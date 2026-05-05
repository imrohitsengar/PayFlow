"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
}

export const Button = ({ onClick, children }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="text-white bg-gradient-to-r from-blue-600 to-[#6a51a6] hover:from-blue-500 hover:to-[#7a61b6] focus:outline-none focus:ring-2 focus:ring-[#6a51a6]/40 focus:ring-offset-2 dark:focus:ring-offset-slate-900 font-semibold rounded-xl text-sm px-5 py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.97]"
    >
      {children}
    </button>
  );
};
