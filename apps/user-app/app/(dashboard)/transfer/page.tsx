export const dynamic = "force-dynamic";

import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getBalance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { amount: 0, locked: 0 };
  const balance = await prisma.balance.findFirst({
    where: {
      userId: Number(session.user.id),
    },
  });
  return {
    amount: balance?.amount || 0,
    locked: balance?.locked || 0,
  };
}

async function getOnRampTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const txns = await prisma.onRampTransaction.findMany({
    where: {
      userId: Number(session.user.id),
    },
    orderBy: { startTime: "desc" },
  });
  return txns.map((t) => ({
    time: t.startTime,
    amount: t.amount,
    status: t.status,
    provider: t.provider,
  }));
}

export default async function TransferPage() {
  const balance = await getBalance();
  const transactions = await getOnRampTransactions();

  return (
    <div className="w-full p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Transfer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add money to your wallet from your bank
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <AddMoney />
        </div>
        <div className="space-y-6">
          <BalanceCard amount={balance.amount} locked={balance.locked} />
          <OnRampTransactions transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
