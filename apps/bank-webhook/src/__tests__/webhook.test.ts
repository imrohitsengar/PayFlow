import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import crypto from "crypto";

// Set env vars BEFORE importing app (env.ts validates at import time)
beforeAll(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET =
    "test-razorpay-webhook-secret-32-chars!!";
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

const SECRET = "test-razorpay-webhook-secret-32-chars!!";

/** Generate a valid HMAC-SHA256 signature over a JSON body */
function sign(body: object): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(body))
    .digest("hex");
}

function makePaymentCapturedPayload(orderId: string, paymentId: string) {
  return {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 10000,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };
}

function makePaymentFailedPayload(orderId: string, paymentId: string) {
  return {
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 10000,
          currency: "INR",
          status: "failed",
        },
      },
    },
  };
}

describe("POST /razorpay-webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Signature validation ────────────────────────────────────────────────

  it("returns 401 when x-razorpay-signature header is missing", async () => {
    const body = makePaymentCapturedPayload("order_123", "pay_123");
    const res = await request(app).post("/razorpay-webhook").send(body);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing webhook signature");
  });

  it("returns 401 when signature is incorrect", async () => {
    const body = makePaymentCapturedPayload("order_123", "pay_123");
    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", "deadbeefdeadbeef")
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid webhook signature/i);
  });

  // ── Payload validation ──────────────────────────────────────────────────

  it("returns 400 when event or payment is missing", async () => {
    const body = { some: "data" };
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid webhook payload");
  });

  // ── payment.captured ─────────────────────────────────────────────────────

  it("returns 200 when order not found (graceful skip)", async () => {
    const body = makePaymentCapturedPayload("order_unknown", "pay_123");
    vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue(null);
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Order not found, skipping");
  });

  it("returns 'Already processed' for idempotent re-delivery", async () => {
    const body = makePaymentCapturedPayload("order_abc", "pay_123");
    vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
      id: 1,
      token: "order_abc",
      status: "Success",
      userId: 42,
      amount: 10000,
      provider: "Razorpay",
      startTime: new Date(),
      razorpayPaymentId: "pay_old",
      razorpaySignature: null,
    } as any);
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Already processed");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("processes a captured payment and credits balance", async () => {
    const body = makePaymentCapturedPayload("order_abc", "pay_123");
    vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
      id: 1,
      token: "order_abc",
      status: "Processing",
      userId: 42,
      amount: 10000,
      provider: "Razorpay",
      startTime: new Date(),
      razorpayPaymentId: null,
      razorpaySignature: null,
    } as any);
    vi.mocked(db.$transaction).mockResolvedValue([{ count: 1 }, { count: 1 }]);
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Payment captured successfully");
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  // ── payment.failed ───────────────────────────────────────────────────────

  it("marks transaction as Failure on payment.failed", async () => {
    const body = makePaymentFailedPayload("order_abc", "pay_fail_123");
    vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
      id: 1,
      token: "order_abc",
      status: "Processing",
      userId: 42,
      amount: 10000,
      provider: "Razorpay",
      startTime: new Date(),
      razorpayPaymentId: null,
      razorpaySignature: null,
    } as any);
    vi.mocked(db.onRampTransaction.updateMany).mockResolvedValue({ count: 1 });
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Payment failure recorded");
    expect(db.onRampTransaction.updateMany).toHaveBeenCalledWith({
      where: { token: "order_abc", status: "Processing" },
      data: { status: "Failure", razorpayPaymentId: "pay_fail_123" },
    });
  });

  // ── Other events ─────────────────────────────────────────────────────────

  it("acknowledges unknown events gracefully", async () => {
    const body = {
      event: "refund.created",
      payload: {
        payment: {
          entity: { id: "pay_123", order_id: "order_abc" },
        },
      },
    };
    vi.mocked(db.onRampTransaction.findUnique).mockResolvedValue({
      id: 1,
      token: "order_abc",
      status: "Success",
      userId: 42,
      amount: 10000,
      provider: "Razorpay",
      startTime: new Date(),
      razorpayPaymentId: "pay_123",
      razorpaySignature: null,
    } as any);
    const sig = sign(body);

    const res = await request(app)
      .post("/razorpay-webhook")
      .set("x-razorpay-signature", sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Event refund.created acknowledged");
  });
});
