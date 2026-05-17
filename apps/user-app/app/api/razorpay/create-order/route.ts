import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { z } from "zod";
import Razorpay from "razorpay";
import db from "@repo/db/client";

const orderSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
});

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
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const amountInPaise = Math.round(parsed.data.amount * 100);

    // Initialize Razorpay with server-side keys
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `payflow_${Date.now()}_${session.user.id}`,
    });

    // Store as Processing transaction in our DB
    await db.onRampTransaction.create({
      data: {
        provider: "Razorpay",
        status: "Processing",
        startTime: new Date(),
        token: order.id,
        userId: Number(session.user.id),
        amount: amountInPaise,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { message: "Failed to create payment order" },
      { status: 500 },
    );
  }
}
