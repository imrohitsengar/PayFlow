import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ────────────────────────────────────────────────────────

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@repo/db/client", () => ({
  default: {
    onRampTransaction: { create: vi.fn() },
    balance: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: {
      create: vi.fn().mockResolvedValue({
        id: "order_test_123",
        amount: 50000,
        currency: "INR",
        receipt: "payflow_test",
      }),
    },
  })),
}));

process.env.JWT_SECRET ??= "test-jwt-secret-at-least-32-chars-long!!";
process.env.NEXTAUTH_URL ??= "http://localhost:3001";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.RAZORPAY_KEY_ID ??= "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET ??= "rzp_test_secret";

const { getServerSession } = await import("next-auth");
const { default: db } = await import("@repo/db/client");

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockSession(userId = "7") {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, name: "Charlie", email: "charlie@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Razorpay create-order API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    // Import the route handler
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500 }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe("Unauthenticated request");
  });

  it("rejects invalid amount (zero)", async () => {
    mockSession("7");
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0 }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects negative amount", async () => {
    mockSession("7");
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -100 }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("creates order and transaction on valid request", async () => {
    mockSession("7");
    vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500 }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orderId).toBe("order_test_123");
    expect(data.amount).toBe(50000);
    expect(data.currency).toBe("INR");
    expect(db.onRampTransaction.create).toHaveBeenCalledOnce();
  });

  it("stores amount as paisa (input × 100)", async () => {
    mockSession("7");
    vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 250 }),
    });

    await POST(req as any);

    const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0]![0];
    expect(callArg.data.amount).toBe(25000); // 250 × 100
  });

  it("stores transaction with Processing status", async () => {
    mockSession("7");
    vi.mocked(db.onRampTransaction.create).mockResolvedValue({} as any);
    const { POST } =
      await import("../../../../app/api/razorpay/create-order/route");

    const req = new Request("http://localhost:3001/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100 }),
    });

    await POST(req as any);

    const callArg = vi.mocked(db.onRampTransaction.create).mock.calls[0]![0];
    expect(callArg.data.status).toBe("Processing");
    expect(callArg.data.provider).toBe("Razorpay");
  });
});
