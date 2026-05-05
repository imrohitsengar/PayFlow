import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import db from "@repo/db/client";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const app = express();

// Extend Request type to include rawBody
interface WebhookRequest extends Request {
    rawBody?: string;
}

// We need the raw body for HMAC verification, so we use a custom middleware
app.use(express.json({
    verify: (req: WebhookRequest, _res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Rate limiter: max 60 webhook calls per minute per IP
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
});

// Zod schema for webhook payload validation
const webhookPayloadSchema = z.object({
    token: z.string().min(1, "Token is required"),
    user_identifier: z.string().min(1, "User identifier is required"),
    amount: z.string().min(1, "Amount is required"),
});

// HMAC signature verification middleware
function verifyWebhookSignature(req: WebhookRequest, res: Response, next: NextFunction) {
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("WEBHOOK_SECRET environment variable is not set");
        res.status(500).json({ message: "Webhook secret not configured" });
        return;
    }

    const signature = req.headers["x-webhook-signature"];
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

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            res.status(401).json({ message: "Invalid webhook signature" });
            return;
        }
    } catch (_e) {
        res.status(401).json({ message: "Invalid webhook signature format" });
        return;
    }

    next();
}

app.post("/hdfcwebhook", webhookLimiter, verifyWebhookSignature, async (req: WebhookRequest, res: Response) => {
    const parsed = webhookPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Invalid payload",
            errors: parsed.error.flatten().fieldErrors
        });
        return;
    }

    const paymentInformation = {
        token: parsed.data.token,
        userId: parsed.data.user_identifier,
        amount: parsed.data.amount
    };

    try {
        // Idempotency check
        const existingTransaction = await db.onRampTransaction.findUnique({
            where: { token: paymentInformation.token }
        });

        if (!existingTransaction) {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }

        // Idempotent re-delivery
        if (existingTransaction.status === "Success") {
            res.json({ message: "Already processed" });
            return;
        }

        // Only process transactions in Processing state
        if (existingTransaction.status !== "Processing") {
            res.status(400).json({
                message: `Transaction is in ${existingTransaction.status} state, cannot process`
            });
            return;
        }

        // Process atomically
        await db.$transaction([
            db.balance.updateMany({
                where: { userId: Number(paymentInformation.userId) },
                data: { amount: { increment: Number(paymentInformation.amount) } }
            }),
            db.onRampTransaction.updateMany({
                where: { token: paymentInformation.token },
                data: { status: "Success" }
            })
        ]);

        res.json({ message: "Captured" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error while processing webhook" });
    }
});

export default app;
