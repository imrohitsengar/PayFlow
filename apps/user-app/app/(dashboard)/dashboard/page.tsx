export const dynamic = "force-dynamic";

import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import Link from "next/link";

async function getBalance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { amount: 0, locked: 0 };
  const balance = await prisma.balance.findFirst({
    where: { userId: Number(session.user.id) },
  });
  return {
    amount: balance?.amount || 0,
    locked: balance?.locked || 0,
  };
}

async function getRecentP2PTransfers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const userId = Number(session.user.id);

  const transfers = await prisma.p2PTransfer.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    orderBy: { timestamp: "desc" },
    take: 5,
    include: {
      fromUser: { select: { name: true, number: true } },
      toUser: { select: { name: true, number: true } },
    },
  });

  return transfers.map((t) => ({
    id: t.id,
    amount: t.amount,
    timestamp: t.timestamp,
    type: t.fromUserId === userId ? ("sent" as const) : ("received" as const),
    counterparty:
      t.fromUserId === userId
        ? t.toUser.name || t.toUser.number
        : t.fromUser.name || t.fromUser.number,
  }));
}

async function getRecentOnRampTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const txns = await prisma.onRampTransaction.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { startTime: "desc" },
    take: 5,
  });
  return txns.map((t) => ({
    id: t.id,
    amount: t.amount,
    time: t.startTime,
    status: t.status,
    provider: t.provider,
  }));
}

async function getUserName() {
  const session = await getServerSession(authOptions);
  return session?.user?.name || "there";
}

export default async function DashboardPage() {
  const [balance, recentP2P, recentOnRamp, userName] = await Promise.all([
    getBalance(),
    getRecentP2PTransfers(),
    getRecentOnRampTransactions(),
    getUserName(),
  ]);

  return (
    <div className="w-full p-6 md:p-10 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-[#6a51a6] dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {userName}
          </span>{" "}
          👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here&apos;s your financial overview
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Available
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            ₹
            {(balance.amount / 100).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Locked
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹
            {(balance.locked / 100).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#6a51a6] to-blue-600 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            ₹
            {((balance.amount + balance.locked) / 100).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/transfer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-[#6a51a6] text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm font-semibold active:scale-[0.97]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Money
          </Link>
          <Link
            href="/p2p"
            className="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 hover:shadow-lg transition-all text-sm font-semibold active:scale-[0.97]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
            Send Money
          </Link>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all text-sm font-semibold border border-slate-200 dark:border-slate-600 active:scale-[0.97]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            View Transactions
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent P2P Transfers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              Recent Transfers
            </h2>
            <Link
              href="/transactions"
              className="text-[#6a51a6] dark:text-purple-400 text-xs font-semibold hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentP2P.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-3xl mb-2">💸</div>
              <div className="text-sm">No transfers yet</div>
            </div>
          ) : (
            <div className="space-y-1">
              {recentP2P.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${t.type === "sent" ? "bg-gradient-to-br from-red-400 to-rose-500" : "bg-gradient-to-br from-emerald-400 to-teal-500"}`}
                    >
                      {t.type === "sent" ? "↑" : "↓"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.type === "sent" ? "Sent to" : "From"}{" "}
                        {t.counterparty}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {t.timestamp.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold ${t.type === "sent" ? "text-red-500" : "text-emerald-500"}`}
                  >
                    {t.type === "sent" ? "-" : "+"}₹
                    {(t.amount / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent On-Ramp Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              Recent Deposits
            </h2>
            <Link
              href="/transactions"
              className="text-[#6a51a6] dark:text-purple-400 text-xs font-semibold hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentOnRamp.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-3xl mb-2">🏦</div>
              <div className="text-sm">No deposits yet</div>
            </div>
          ) : (
            <div className="space-y-1">
              {recentOnRamp.map((t) => {
                const statusStyle =
                  {
                    Success:
                      "text-emerald-600 bg-emerald-50 border-emerald-200",
                    Failure: "text-red-600 bg-red-50 border-red-200",
                    Processing: "text-amber-600 bg-amber-50 border-amber-200",
                  }[t.status] || "text-slate-500 bg-slate-50 border-slate-200";

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                        ₹
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">
                          {t.provider}
                        </div>
                        <div className="text-xs text-slate-400">
                          {t.time.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusStyle}`}
                      >
                        {t.status}
                      </span>
                      <span className="text-sm font-bold text-emerald-500">
                        +₹
                        {(t.amount / 100).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
