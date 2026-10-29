import * as React from "react";
import { createPortal } from "react-dom";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi";

/* ============================ Types ============================ */
type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastItem = Required<ToastOptions> & { id: string };

type ToastContextValue = {
  show: (opts: ToastOptions | string) => string;
  success: (msg: string | Omit<ToastOptions, "variant">) => string;
  error: (msg: string | Omit<ToastOptions, "variant">) => string;
  info: (msg: string | Omit<ToastOptions, "variant">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastCtx = React.createContext<ToastContextValue | null>(null);

/* ============================ Hook ============================ */
export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}

/* ============================ Provider ============================ */
export function ToastProvider({
  children,
  defaultDuration = 5000, // ⏱️ show 5s by default
  maxVisible = 3,
}: {
  children: React.ReactNode;
  defaultDuration?: number;
  maxVisible?: number;
}) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (opts: ToastOptions | string, variant?: ToastVariant) => {
      const base: ToastOptions =
        typeof opts === "string" ? { description: opts } : opts;

      const id = base.id ?? Math.random().toString(36).slice(2, 10);
      const toast: ToastItem = {
        id,
        title: base.title ?? "",
        description: base.description ?? "",
        variant: base.variant ?? variant ?? "info",
        duration:
          typeof base.duration === "number" ? base.duration : defaultDuration,
      };

      setToasts((prev) => {
        const next = [toast, ...prev];
        return next.slice(0, maxVisible);
      });

      if (toast.duration > 0) {
        window.setTimeout(() => dismiss(id), toast.duration);
      }

      return id;
    },
    [defaultDuration, maxVisible, dismiss],
  );

  const api: ToastContextValue = React.useMemo(
    () => ({
      show: push,
      success: (msg) =>
        push(
          typeof msg === "string" ? { description: msg } : msg,
          "success",
        ),
      error: (msg) =>
        push(typeof msg === "string" ? { description: msg } : msg, "error"),
      info: (msg) =>
        push(typeof msg === "string" ? { description: msg } : msg, "info"),
      dismiss,
      clear: () => setToasts([]),
    }),
    [push, dismiss],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

/* ============================ Viewport (Portal) ============================ */
function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="assertive"
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
    
      <div className="mt-4 mr-4 flex justify-end">
        <div className="flex w-[100%] max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ============================ Single Toast ============================ */
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const color =
    toast.variant === "success"
      ? "bg-green-600"
      : toast.variant === "error"
      ? "bg-red-600"
      : "bg-blue-600";

  const Icon =
    toast.variant === "success"
      ? HiCheckCircle
      : toast.variant === "error"
      ? HiExclamationCircle
      : HiInformationCircle;

  return (
    <div
      className={`pointer-events-auto w-full transform rounded-lg text-white shadow-xl ring-1 ring-black/10 transition-all duration-200 ${color}`}
      role="status"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          {toast.title && (
            <p className="truncate text-sm font-semibold leading-5">
              {toast.title}
            </p>
          )}
          {toast.description && (
            <p className="mt-0.5 text-sm leading-5">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="ml-auto inline-flex rounded-md px-2 py-1 text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
