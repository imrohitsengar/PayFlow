"use client";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const SidebarItem = ({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const selected = pathname === href;

  return (
    <div
      className={`flex items-center gap-3 cursor-pointer mx-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-gradient-to-r from-[#6a51a6]/10 to-blue-500/10 dark:from-[#6a51a6]/20 dark:to-blue-500/20 text-[#6a51a6] dark:text-purple-400 shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
      onClick={() => router.push(href)}
    >
      <div
        className={`${selected ? "text-[#6a51a6] dark:text-purple-400" : ""}`}
      >
        {icon}
      </div>
      <span>{title}</span>
    </div>
  );
};
