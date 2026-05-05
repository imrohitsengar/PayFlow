"use client";
import { Button } from "./button";

interface AppbarProps {
  user?: {
    name?: string | null;
  };
  onSignin: () => void;
  onSignout: () => void;
  themeToggle?: React.ReactNode;
}
export const Appbar = ({
  user,
  onSignin,
  onSignout,
  themeToggle,
}: AppbarProps) => {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors duration-300">
      <a
        href="/"
        className="flex items-center gap-0.5 font-extrabold text-2xl tracking-tight select-none hover:opacity-80 transition-opacity"
      >
        <span className="text-blue-600 dark:text-blue-400">Pay</span>
        <span className="text-[#6a51a6] dark:text-purple-400">Flow</span>
      </a>
      <div className="flex items-center gap-3">
        {themeToggle}
        {user?.name && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-[#6a51a6] flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {user.name}
            </span>
          </div>
        )}
        <Button onClick={user ? onSignout : onSignin}>
          {user ? "Logout" : "Login"}
        </Button>
      </div>
    </div>
  );
};
