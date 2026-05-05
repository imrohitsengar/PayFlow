import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import crypto from "crypto";

// Set env vars BEFORE importing app (env.ts validates at import time)
beforeAll(() => {
    process.env.WEBHOOK_SECRET = "test-webhook-secret-32-chars-long!!";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

// Mock @repo/db/client before importing app
vi.mock("@repo/db/client", () => ({
    default: {
        onRampTransaction: {
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        balance: {
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

// Dynamic import AFTER mocks are set up (vi.mock is hoisted, so this is safe)
const { default: app } = await import("../app");
const { default: db } = await import("@repo/db/client");

const SECRET = "test-webhook-secret-32-chars-long!!";

/** Generate a valid HMAC-SHA256 signature over a JSON body (same as the handler) */
function sign(body: object): string {
    return crypto
        .createHmac("sha256", SECRET)
        .update(JSON.stringify(body))
        .digest("hex");
}

const VALID_BODY = {
    token: "tok_abc123",
    user_identifier: "42",
    amount: "10000",
};

describe("POST /hdfcwebhook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Signature validation ────────────────────────────────────────────────

    it("returns 401 when x-webhook-signature header is missing", async () => {
        const res = await request(app)
            .post("/hdfcwebhook")
            .send(VALID_BODY);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Missing webhook signature");
    });

    it("returns 401 when signature is incorrect", async () => {
        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", "deadbeefdeadbeef")
            .send(VALID_BODY);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Invalid webhook signature/i);
    });

    // ── Payload validation ──────────────────────────────────────────────────

    it("returns 400 when required payload fields are missing", async () => {
        const badBody = { token: "tok_abc123" }; // missing user_identifier, amount
        const sig = sign(badBody);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(badBody);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid payload");
        expect(res.body.errors).toBeDefined();
    });

    // ── Business logic ──────────────────────────────────────────────────────

    it("returns 404 when token does not match any transaction", async () => {
        vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue(null);
        const sig = sign(VALID_BODY);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(VALID_BODY);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Transaction not found");
    });

    it("returns 200 'Already processed' for idempotent re-delivery (Success state)", async () => {
        vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
            id: 1, token: "tok_abc123", status: "Success",
            userId: 42, amount: 10000, provider: "HDFC",
            startTime: new Date(), createdAt: new Date(), updatedAt: new Date(),
        } as any);
        const sig = sign(VALID_BODY);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(VALID_BODY);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Already processed");
        // $transaction must NOT be called again for an already-processed txn
        expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("returns 400 when transaction is in Failure state", async () => {
        vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
            id: 1, token: "tok_abc123", status: "Failure",
            userId: 42, amount: 10000, provider: "HDFC",
            startTime: new Date(), createdAt: new Date(), updatedAt: new Date(),
        } as any);
        const sig = sign(VALID_BODY);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(VALID_BODY);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Failure");
    });

    it("processes a Processing transaction atomically and returns 'Captured'", async () => {
        vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
            id: 1, token: "tok_abc123", status: "Processing",
            userId: 42, amount: 10000, provider: "HDFC",
            startTime: new Date(), createdAt: new Date(), updatedAt: new Date(),
        } as any);
        vi.mocked(db.$transaction).mockResolvedValue([{ count: 1 }, { count: 1 }]);
        const sig = sign(VALID_BODY);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(VALID_BODY);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Captured");
        expect(db.$transaction).toHaveBeenCalledOnce();
        // Verify balance.updateMany and onRampTransaction.updateMany were queued
        const [ops] = vi.mocked(db.$transaction).mock.calls[0] as any;
        expect(ops).toHaveLength(2);
    });

    it("returns 500 when the database throws an unexpected error", async () => {
        vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
            id: 1, token: "tok_abc123", status: "Processing",
            userId: 42, amount: 10000, provider: "HDFC",
            startTime: new Date(), createdAt: new Date(), updatedAt: new Date(),
        } as any);
        vi.mocked(db.$transaction).mockRejectedValue(new Error("DB connection lost"));
        const sig = sign(VALID_BODY);

        const res = await request(app)
            .post("/hdfcwebhook")
            .set("x-webhook-signature", sig)
            .send(VALID_BODY);

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Error while processing webhook");
    });
});
