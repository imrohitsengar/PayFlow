"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";
import { z } from "zod";

const p2pTransferSchema = z.object({
    to: z.string().min(10, "Recipient phone number must be at least 10 digits").max(15, "Phone number too long"),
    amount: z.number().int("Amount must be a whole number (in paisa)").positive("Amount must be greater than zero"),
});

export async function p2pTransfer(to: string, amount: number) {
    // Validate inputs with Zod
    const parsed = p2pTransferSchema.safeParse({ to, amount });
    if (!parsed.success) {
        return {
            message: parsed.error.issues[0]?.message || "Invalid input"
        }
    }

    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "Error while sending"
        }
    }
    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    });

    if (!toUser) {
        return {
            message: "User not found"
        }
    }

    // Prevent self-transfer
    if (Number(from) === toUser.id) {
        return {
            message: "Cannot transfer to yourself"
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Lock both sender and receiver rows to prevent race conditions
            await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;
            await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${toUser.id} FOR UPDATE`;

            const fromBalance = await tx.balance.findUnique({
                where: { userId: Number(from) },
            });
            if (!fromBalance || fromBalance.amount < amount) {
                throw new Error('Insufficient funds');
            }

            await tx.balance.update({
                where: { userId: Number(from) },
                data: { amount: { decrement: amount } },
            });

            await tx.balance.update({
                where: { userId: toUser.id },
                data: { amount: { increment: amount } },
            });

            await tx.p2PTransfer.create({
                data: {
                    fromUserId: Number(from),
                    toUserId: toUser.id,
                    amount,
                    timestamp: new Date()
                }
            })
        });

        return {
            message: "Transfer successful"
        }
    } catch (e: unknown) {
        if (e instanceof Error && e.message === 'Insufficient funds') {
            return {
                message: "Insufficient funds"
            }
        }
        console.error("P2P Transfer error:", e);
        return {
            message: "Error while sending"
        }
    }
}
