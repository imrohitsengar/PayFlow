import { type ReactNode } from "react";

export const Center = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      {children}
    </div>
  );
};
