import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import crypto from "crypto";
import db from "@repo/db/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthenticated request" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Missing payment verification fields" },
        { status: 400 },
      );
    }

    // Verify the signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // Look up the transaction we created in create-order
    const transaction = await db.onRampTransaction.findUnique({
      where: { token: razorpay_order_id },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 },
      );
    }

    // Idempotency: if already processed, return success
    if (transaction.status === "Success") {
      return NextResponse.json({ message: "Already processed" });
    }

    // Verify the transaction belongs to the logged-in user
    if (transaction.userId !== Number(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Atomically: credit balance + mark transaction as Success
    await db.$transaction([
      db.balance.updateMany({
        where: { userId: transaction.userId },
        data: { amount: { increment: transaction.amount } },
      }),
      db.onRampTransaction.updateMany({
        where: {
          token: razorpay_order_id,
          status: "Processing",
        },
        data: {
          status: "Success",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      }),
    ]);

    return NextResponse.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { message: "Payment verification failed" },
      { status: 500 },
    );
  }
}
