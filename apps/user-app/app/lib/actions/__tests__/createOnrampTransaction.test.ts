import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ────────────────────────────────────────────────────────

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@repo/db/client", () => ({
    default: {
        onRampTransaction: { create: vi.fn() },
    },
}));

process.env.JWT_SECRET ??= "test-jwt-secret-at-least-32-chars-long!!";
process.env.NEXTAUTH_URL ??= "http://localhost:3001";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

const { getServerSession } = await import("next-auth");
const { default: db } = await import("@repo/db/client");
const { createOnRampTransaction } = await import("../createOnrampTransaction");

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockSession(userId = "7") {
    vi.mocked(getServerSession).mockResolvedValue({
        user: { id: userId, name: "Charlie", email: "charlie@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createOnRampTransaction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Authentication ────────────────────────────────────────────────────────

    it("returns error when user is not authenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);
        const result = await createOnRampTransaction("HDFC Bank", 500);
        expect(result.message).toBe("Unauthenticated request");
    });

    it("returns error when session exists but user.id is missing", async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: undefined, name: "Ghost" },
            expires: new Date(Date.now() + 86400000).toISOString(),
        } as any);
        const result = await createOnRampTransaction("HDFC Bank", 500);
        expect(result.message).toBe("Unauthenticated request");
    });

    // ── Zod validation ────────────────────────────────────────────────────────

    it("returns error for zero amount", async () => {
        mockSession();
        const result = await createOnRampTransaction("HDFC Bank", 0);
        expect(result.message).toMatch(/greater than zero/i);
    });

    it("returns error for negative amount", async () => {
        mockSession();
        const result = await createOnRampTransaction("HDFC Bank", -100);
        expect(result.message).toMatch(/greater than zero/i);
    });

    it("returns error for empty provider", async () => {
        mockSession();
        const result = await createOnRampTransaction("", 500);
        expect(result.message).toMatch(/provider/i);
    });

    // ── Successful creation ───────────────────────────────────────────────────

    it("creates onramp transaction and returns 'Done'", async () => {
        mockSession("7");
        vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);

        const result = await createOnRampTransaction("HDFC Bank", 500);
        expect(result.message).toBe("Done");
        expect(db.onRampTransaction.create).toHaveBeenCalledOnce();
    });

    it("stores amount as paisa (input × 100)", async () => {
        mockSession("7");
        vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);

        await createOnRampTransaction("Axis Bank", 250);

        const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0][0];
        expect(callArg.data.amount).toBe(25000); // 250 × 100
    });

    it("stores the transaction with Processing status", async () => {
        mockSession("7");
        vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);

        await createOnRampTransaction("HDFC Bank", 100);

        const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0][0];
        expect(callArg.data.status).toBe("Processing");
    });

    it("generates a UUID token (crypto.randomUUID format)", async () => {
        mockSession("7");
        vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);

        await createOnRampTransaction("HDFC Bank", 100);

        const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0][0];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(callArg.data.token).toMatch(uuidRegex);
    });

    it("associates transaction with the correct userId from session", async () => {
        mockSession("42");
        vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);

        await createOnRampTransaction("HDFC Bank", 100);

        const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0][0];
        expect(callArg.data.userId).toBe(42);
    });
});
