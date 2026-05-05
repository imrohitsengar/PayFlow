import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies before importing the action ───────────────────────────

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@repo/db/client", () => ({
  default: {
    user: { findFirst: vi.fn() },
    balance: { findUnique: vi.fn(), update: vi.fn() },
    p2PTransfer: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Env vars are set by vitest.setup.ts, but guard here just in case
process.env.JWT_SECRET ??= "test-jwt-secret-at-least-32-chars-long!!";
process.env.NEXTAUTH_URL ??= "http://localhost:3001";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

const { getServerSession } = await import("next-auth");
const { default: db } = await import("@repo/db/client");
const { p2pTransfer } = await import("../p2pTransfer");

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockSession(userId = "1") {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: userId, name: "Alice", email: "alice@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
}

function mockNoSession() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}

/** Simulate a successful $transaction with an interactive tx object */
function mockSuccessfulTransaction(senderAmount: number, _recipientId: number) {
  // eslint-disable-line no-unused-vars
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
    const mockTx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      balance: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ amount: senderAmount, locked: 0 }),
        update: vi.fn().mockResolvedValue({}),
      },
      p2PTransfer: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    return cb(mockTx);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("p2pTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Input validation (Zod) ────────────────────────────────────────────────

  it("returns error for phone number that is too short", async () => {
    const result = await p2pTransfer("123", 100);
    expect(result.message).toMatch(/phone number/i);
  });

  it("returns error for zero amount", async () => {
    const result = await p2pTransfer("9876543210", 0);
    expect(result.message).toMatch(/greater than zero/i);
  });

  it("returns error for negative amount", async () => {
    const result = await p2pTransfer("9876543210", -500);
    expect(result.message).toMatch(/greater than zero/i);
  });

  // ── Authentication ────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockNoSession();
    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Error while sending");
  });

  // ── Recipient lookup ──────────────────────────────────────────────────────

  it("returns error when recipient phone number is not found", async () => {
    mockSession("1");
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    const result = await p2pTransfer("9999999999", 1000);
    expect(result.message).toBe("User not found");
  });

  it("returns error when sender tries to transfer to themselves", async () => {
    mockSession("5");
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 5,
      number: "9876543210",
      name: "Alice",
      password: "hashed",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Cannot transfer to yourself");
  });

  // ── Balance checks ────────────────────────────────────────────────────────

  it("returns 'Insufficient funds' when sender balance is too low", async () => {
    mockSession("1");
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 2,
      number: "9876543210",
      name: "Bob",
      password: "hashed",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        balance: {
          // Only 500 paisa in balance, but trying to send 1000
          findUnique: vi.fn().mockResolvedValue({ amount: 500, locked: 0 }),
          update: vi.fn(),
        },
        p2PTransfer: { create: vi.fn() },
      };
      return cb(mockTx);
    });

    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Insufficient funds");
  });

  it("returns 'Insufficient funds' when sender has no balance record", async () => {
    mockSession("1");
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 2,
      number: "9876543210",
      name: "Bob",
      password: "hashed",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      const mockTx = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        balance: {
          findUnique: vi.fn().mockResolvedValue(null), // no balance row
          update: vi.fn(),
        },
        p2PTransfer: { create: vi.fn() },
      };
      return cb(mockTx);
    });

    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Insufficient funds");
  });

  // ── Successful transfer ───────────────────────────────────────────────────

  it("transfers successfully and returns 'Transfer successful'", async () => {
    mockSession("1");
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 2,
      number: "9876543210",
      name: "Bob",
      password: "hashed",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockSuccessfulTransaction(50000, 2); // sender has 50000 paisa = ₹500

    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Transfer successful");
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("handles unexpected DB errors gracefully", async () => {
    mockSession("1");
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 2,
      number: "9876543210",
      name: "Bob",
      password: "hashed",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.$transaction).mockRejectedValue(
      new Error("DB connection lost"),
    );

    const result = await p2pTransfer("9876543210", 1000);
    expect(result.message).toBe("Error while sending");
  });
});
