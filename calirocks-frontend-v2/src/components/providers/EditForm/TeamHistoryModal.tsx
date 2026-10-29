import * as React from "react";
import { createPortal } from "react-dom";

// ---- types ----
type HistoryType = "availability" | "preference" | "note" | "profile" | "other";

export type TeamChange = {
  id: string | number;
  at: string | Date;
  actor: { id?: string | number; name: string };
  type: HistoryType;   // normalized
  summary: string;
  details?: string;
  ip?: string;
};

// Allow callers to pass any string for `type`
type TeamChangeRaw = Omit<TeamChange, "type"> & { type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  teamName?: string;
  items: (TeamChange | TeamChangeRaw)[];
};


const dfmt = (d: string | Date) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "short" }).format(new Date(d));
const tfmt = (d: string | Date) =>
  new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(d));

export default function TeamHistoryModal({ open, onClose, items }: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const data = [...items].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Changes report"
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* Modal header (inside the panel) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Changes History</h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Desktop/table view */}
        <div className="hidden md:block px-5 py-3">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="sticky top-0 bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-[240px_1fr_220px]">
              <div className="text-sm font-semibold text-gray-700">Changed By</div>
              <div className="text-sm font-semibold text-gray-700">Change</div>
              <div className="text-sm font-semibold text-gray-700 text-right">When</div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {data.map((it, i) => (
                <div
                  key={it.id}
                  className={`grid grid-cols-[240px_1fr_220px] items-start px-4 py-3 border-b border-gray-200/70 ${i % 2 ? "bg-gray-50/60" : "bg-white"}`}
                >
                  <div className="text-sm text-gray-900">{it.actor.name}</div>
                  <div className="text-sm">
                    <div className="text-gray-900">{it.summary}</div>
                    {it.details && <div className="text-gray-600 mt-0.5">{it.details}</div>}
                  </div>
                  <div className="text-sm text-gray-800 text-right">
                    <div>{dfmt(it.at)} {tfmt(it.at)}</div>
                    {it.ip && <div className="text-xs text-gray-500">IP: {it.ip}</div>}
                  </div>
                </div>
              ))}
              {data.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-gray-500">No changes yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile/card view (Who/What/When rows like your screenshot) */}
        <div className="md:hidden px-3 py-3">
          <div className="max-h-[70vh] overflow-y-auto space-y-2">
            {data.map((it) => (
              <div key={it.id} className="rounded-lg border border-gray-200 bg-white">
                <div className="divide-y divide-gray-200">
                  <div className="grid grid-cols-[70px_1fr] gap-3 px-3 py-2">
                    <div className="text-xs font-semibold text-gray-600">Who</div>
                    <div className="text-sm text-gray-900">{it.actor.name}</div>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] gap-3 px-3 py-2">
                    <div className="text-xs font-semibold text-gray-600">What</div>
                    <div className="text-sm">
                      <div className="text-gray-900">{it.summary}</div>
                      {it.details && <div className="text-gray-600 mt-0.5">{it.details}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-[70px_1fr] gap-3 px-3 py-2">
                    <div className="text-xs font-semibold text-gray-600">When</div>
                    <div className="text-sm text-gray-800">
                      {dfmt(it.at)} {tfmt(it.at)}
                      {it.ip && <div className="text-xs text-gray-500">IP: {it.ip}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-gray-500">No changes yet.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button onClick={onClose} className="rounded-lg px-4 py-2 cursor-pointer text-sm border border-gray-300 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
