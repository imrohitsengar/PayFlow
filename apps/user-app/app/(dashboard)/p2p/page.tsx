import { SendCard } from "../../../components/SendCard";

export default function P2PPage() {
  return (
    <div className="w-full p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          P2P Transfer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Send money instantly to any registered user
        </p>
      </div>
      <SendCard />
    </div>
  );
}
