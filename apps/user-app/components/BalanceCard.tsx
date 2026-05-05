import { Card } from "@repo/ui/card";

export const BalanceCard = ({
  amount,
  locked,
}: {
  amount: number;
  locked: number;
}) => {
  const fmt = (paisa: number) =>
    `₹${(paisa / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card title="Balance">
      <div className="space-y-0">
        <Row
          label="Available"
          value={fmt(amount)}
          icon="💰"
          valueColor="text-slate-800"
        />
        <Row
          label="Locked"
          value={fmt(locked)}
          icon="🔒"
          valueColor="text-amber-600"
        />
        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600">
            Total Balance
          </span>
          <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-[#6a51a6] bg-clip-text text-transparent">
            {fmt(amount + locked)}
          </span>
        </div>
      </div>
    </Card>
  );
};

function Row({
  label,
  value,
  icon,
  valueColor = "text-slate-800",
}: {
  label: string;
  value: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-slate-100 last:border-0 py-3">
      <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <span className="text-xs">{icon}</span>
        {label}
      </span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
