"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void; // eslint-disable-line no-unused-vars
}

const ToastContext = createContext<ToastContextType>({
  showToast: (_message, _type) => {},
}); // eslint-disable-line no-unused-vars

export function useToast() {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  // eslint-disable-line no-unused-vars
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: { bg: "bg-gradient-to-r from-emerald-500 to-teal-500", icon: "✓" },
    error: { bg: "bg-gradient-to-r from-red-500 to-rose-500", icon: "✕" },
    info: { bg: "bg-gradient-to-r from-blue-500 to-indigo-500", icon: "ℹ" },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto ${config.bg} text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 min-w-[280px] max-w-[400px] backdrop-blur-sm`}
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <span className="text-sm font-bold flex-shrink-0 w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
        {config.icon}
      </span>
      <span className="text-sm font-medium leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto text-white/60 hover:text-white transition-colors flex-shrink-0 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
