import { useEffect, useState } from "react";

export type ToastType = "success" | "error";

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-100 flex flex-col gap-3 w-90 max-w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exit = setTimeout(() => setExiting(true), 3600);
    const remove = setTimeout(() => onDismiss(toast.id), 4000);
    return () => { clearTimeout(exit); clearTimeout(remove); };
  }, [toast.id, onDismiss]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  const isSuccess = toast.type === "success";

  return (
    <div
      style={{ transition: "opacity 0.3s, transform 0.3s" }}
      className={`pointer-events-auto animate-slide-in-right flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-xl border backdrop-blur-md text-sm font-medium
        ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
        ${isSuccess
          ? "bg-emerald-500/95 border-emerald-400/50 text-white"
          : "bg-rose-500/95 border-rose-400/50 text-white"
        }`}
    >
      {/* Icon */}
      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
        isSuccess ? "bg-white/20" : "bg-white/20"
      }`}>
        {isSuccess ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>

      <span className="flex-1 leading-relaxed">{toast.message}</span>

      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
