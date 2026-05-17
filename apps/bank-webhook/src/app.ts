import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import db from "@repo/db/client";
import rateLimit from "express-rate-limit";

const app = express();

// Extend Request type to include rawBody
interface WebhookRequest extends Request {
  rawBody?: string;
}

// We need the raw body for HMAC verification, so we use a custom middleware
app.use(
  express.json({
    verify: (req: WebhookRequest, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

// Rate limiter: max 60 webhook calls per minute per IP
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

// Razorpay webhook signature verification middleware
function verifyRazorpaySignature(
  req: WebhookRequest,
  res: Response,
  next: NextFunction,
) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET environment variable is not set");
    res.status(500).json({ message: "Webhook secret not configured" });
    return;
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(401).json({ message: "Missing webhook signature" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody || "")
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      res.status(401).json({ message: "Invalid webhook signature" });
      return;
    }
  } catch (_e) {
    res.status(401).json({ message: "Invalid webhook signature format" });
    return;
  }

  next();
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Razorpay webhook endpoint — handles payment.captured and payment.failed events
app.post(
  "/razorpay-webhook",
  webhookLimiter,
  verifyRazorpaySignature,
  async (req: WebhookRequest, res: Response) => {
    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;

    if (!event || !payment) {
      res.status(400).json({ message: "Invalid webhook payload" });
      return;
    }

    const orderId = payment.order_id;
    const paymentId = payment.id;

    if (!orderId) {
      res.status(400).json({ message: "Missing order_id in payment entity" });
      return;
    }

    try {
      // Look up the transaction by Razorpay order_id (stored as token)
      const transaction = await db.onRampTransaction.findUnique({
        where: { token: orderId },
      });

      if (!transaction) {
        // Unknown order — might be for a different system
        res.status(200).json({ message: "Order not found, skipping" });
        return;
      }

      if (event === "payment.captured") {
        // Idempotency: skip if already processed
        if (transaction.status === "Success") {
          res.json({ message: "Already processed" });
          return;
        }

        // Only process transactions in Processing state
        if (transaction.status !== "Processing") {
          res.status(200).json({
            message: `Transaction in ${transaction.status} state, skipping`,
          });
          return;
        }

        // Atomically: credit balance + mark as Success
        await db.$transaction([
          db.balance.updateMany({
            where: { userId: transaction.userId },
            data: { amount: { increment: transaction.amount } },
          }),
          db.onRampTransaction.updateMany({
            where: { token: orderId, status: "Processing" },
            data: {
              status: "Success",
              razorpayPaymentId: paymentId,
            },
          }),
        ]);

        res.json({ message: "Payment captured successfully" });
      } else if (event === "payment.failed") {
        // Mark as Failure if still Processing
        if (transaction.status === "Processing") {
          await db.onRampTransaction.updateMany({
            where: { token: orderId, status: "Processing" },
            data: {
              status: "Failure",
              razorpayPaymentId: paymentId,
            },
          });
        }

        res.json({ message: "Payment failure recorded" });
      } else {
        // Other events (e.g., refund) — acknowledge but don't process
        res.json({ message: `Event ${event} acknowledged` });
      }
    } catch (e) {
      console.error("Razorpay webhook error:", e);
      res.status(500).json({ message: "Error processing webhook" });
    }
  },
);

export default app;
