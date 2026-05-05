import { type ReactNode } from "react";

export function Card({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
          {title}
        </h2>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}
