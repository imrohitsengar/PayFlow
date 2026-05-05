export const dynamic = "force-dynamic";

import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import Link from "next/link";

const PAGE_SIZE = 10;

type TransactionItem = {
  id: number;
  amount: number;
  timestamp: Date;
  type: "p2p_sent" | "p2p_received" | "onramp";
  status: string;
  counterparty: string;
};

async function getAllTransactions(
  page: number,
): Promise<{ items: TransactionItem[]; total: number }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { items: [], total: 0 };
  const userId = Number(session.user.id);

  const [p2pTransfers, onRampTransactions, p2pCount, onRampCount] =
    await Promise.all([
      prisma.p2PTransfer.findMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        orderBy: { timestamp: "desc" },
        include: {
          fromUser: { select: { name: true, number: true } },
          toUser: { select: { name: true, number: true } },
        },
      }),
      prisma.onRampTransaction.findMany({
        where: { userId },
        orderBy: { startTime: "desc" },
      }),
      prisma.p2PTransfer.count({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      }),
      prisma.onRampTransaction.count({ where: { userId } }),
    ]);

  const p2pItems: TransactionItem[] = p2pTransfers.map((t) => ({
    id: t.id,
    amount: t.amount,
    timestamp: t.timestamp,
    type:
      t.fromUserId === userId
        ? ("p2p_sent" as const)
        : ("p2p_received" as const),
    status: "Success",
    counterparty:
      t.fromUserId === userId
        ? t.toUser.name || t.toUser.number
        : t.fromUser.name || t.fromUser.number,
  }));

  const onRampItems: TransactionItem[] = onRampTransactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    timestamp: t.startTime,
    type: "onramp" as const,
    status: t.status,
    counterparty: t.provider,
  }));

  // Merge and sort by timestamp desc, then paginate
  const all = [...p2pItems, ...onRampItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const total = p2pCount + onRampCount;
  const start = (page - 1) * PAGE_SIZE;
  return { items: all.slice(start, start + PAGE_SIZE), total };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { items: transactions, total } = await getAllTransactions(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="w-full p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Transactions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your complete transaction history
        </p>
      </div>

      {/* Filter Legend */}
      <div className="flex gap-4 flex-wrap mb-6 items-center">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-red-400 to-rose-500 inline-block"></span>{" "}
          Sent
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 inline-block"></span>{" "}
          Received
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 inline-block"></span>{" "}
          Deposit
        </div>
        {total > 0 && (
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {total} transaction{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-medium text-slate-500">
              No transactions yet
            </div>
            <div className="text-sm mt-1">
              Your transaction history will appear here
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Details</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            {/* Rows */}
            {transactions.map((t) => {
              const typeConfig = {
                p2p_sent: {
                  label: "Sent",
                  icon: "↑",
                  iconBg: "bg-gradient-to-br from-red-400 to-rose-500",
                  color: "text-red-500",
                  prefix: "-",
                },
                p2p_received: {
                  label: "Received",
                  icon: "↓",
                  iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
                  color: "text-emerald-500",
                  prefix: "+",
                },
                onramp: {
                  label: "Deposit",
                  icon: "₹",
                  iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
                  color: "text-blue-600",
                  prefix: "+",
                },
              }[t.type];

              const statusColor =
                {
                  Success: "text-emerald-600 bg-emerald-50 border-emerald-200",
                  Failure: "text-red-600 bg-red-50 border-red-200",
                  Processing: "text-amber-600 bg-amber-50 border-amber-200",
                }[t.status] || "text-slate-500 bg-slate-50 border-slate-200";

              return (
                <div
                  key={`${t.type}-${t.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100/60 last:border-0 hover:bg-slate-50/50 transition-colors items-center"
                >
                  <div className="col-span-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${typeConfig.iconBg}`}
                    >
                      {typeConfig.icon}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-slate-700">
                      {typeConfig.label}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {t.counterparty}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-sm text-slate-600">
                      {t.timestamp.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t.timestamp.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${statusColor}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div
                    className={`col-span-3 text-right text-sm font-bold ${typeConfig.color}`}
                  >
                    {typeConfig.prefix}₹
                    {(t.amount / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-1.5">
            {page > 1 && (
              <Link
                href={`/transactions?page=${page - 1}`}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all"
              >
                ← Previous
              </Link>
            )}
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return pageNum <= totalPages ? (
                <Link
                  key={pageNum}
                  href={`/transactions?page=${pageNum}`}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                    pageNum === page
                      ? "bg-gradient-to-r from-blue-600 to-[#6a51a6] text-white shadow-sm"
                      : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </Link>
              ) : null;
            })}
            {page < totalPages && (
              <Link
                href={`/transactions?page=${page + 1}`}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
