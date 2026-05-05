"use server";

import crypto from "crypto";
import db from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { z } from "zod";

const onRampSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    amount: z.number().positive("Amount must be greater than zero"),
});

export async function createOnRampTransaction(provider: string, amount: number) {
    // Validate inputs with Zod
    const parsed = onRampSchema.safeParse({ provider, amount });
    if (!parsed.success) {
        return {
            message: parsed.error.issues[0]?.message || "Invalid input"
        }
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user?.id) {
        return {
            message: "Unauthenticated request"
        }
    }

    // Use cryptographically secure token instead of Math.random()
    const token = crypto.randomUUID();

    await db.onRampTransaction.create({
        data: {
            provider,
            status: "Processing",
            startTime: new Date(),
            token: token,
            userId: Number(session?.user?.id),
            amount: amount * 100
        }
    });

    return {
        message: "Done"
    }
}