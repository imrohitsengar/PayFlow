import { Card } from "@repo/ui/card";

type OnRampStatus = "Success" | "Failure" | "Processing";

const STATUS_CONFIG: Record<
  OnRampStatus,
  { label: string; badge: string; icon: string }
> = {
  Success: {
    label: "Success",
    badge: "text-emerald-600 bg-emerald-50 border border-emerald-200",
    icon: "✓",
  },
  Failure: {
    label: "Failed",
    badge: "text-red-600 bg-red-50 border border-red-200",
    icon: "✕",
  },
  Processing: {
    label: "Processing",
    badge: "text-amber-600 bg-amber-50 border border-amber-200",
    icon: "⟳",
  },
};

export const OnRampTransactions = ({
  transactions,
}: {
  transactions: {
    time: Date;
    amount: number;
    status: OnRampStatus;
    provider: string;
  }[];
}) => {
  if (!transactions.length) {
    return (
      <Card title="Recent Deposits">
        <div className="text-center py-10 text-slate-400 text-sm">
          <div className="text-3xl mb-2">🏦</div>
          <div className="font-medium text-slate-500">No deposits yet</div>
          <div className="text-xs mt-1">
            Add money to see your deposit history
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Recent Deposits">
      <div className="pt-1 space-y-0.5">
        {transactions.map((t, index) => {
          const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.Processing;
          return (
            <div
              key={`${t.provider}-${index}-${t.time.getTime()}`}
              className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {/* Left — provider + date */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Right — status badge + amount */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${cfg.badge}`}
                >
                  <span>{cfg.icon}</span>
                  {cfg.label}
                </span>
                <span className="text-sm font-bold text-emerald-500 min-w-[60px] text-right">
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
    </Card>
  );
};
