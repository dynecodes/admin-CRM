import * as React from "react";
import { createPortal } from "react-dom";
import DatePicker from "../ui/DatePicker";

type Props = {
  open: boolean;
  createdAt: string | Date;        // "YYYY-MM-DD" or Date
  expiresAt: string | Date | null; // "YYYY-MM-DD" or Date
  onClose: () => void;
  onSave: (expiresAt: string | null) => void; // returns "YYYY-MM-DD" or null
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(+v) ? null : v;

  // date-only
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // datetime without zone (MySQL-ish: "YYYY-MM-DD HH:mm[:ss]")
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(v) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(v)) {
    const iso = v.replace(" ", "T") + "Z"; // assume server meant UTC
    const d = new Date(iso);
    return isNaN(+d) ? null : d;
  }

  const d = new Date(v);
  return isNaN(+d) ? null : d;
}

function toYMD(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// function fmtLong(d: Date | null) {
//   if (!d) return "";
//   const dow = d.toLocaleDateString(undefined, { weekday: "long" });
//   const month = d.toLocaleDateString(undefined, { month: "long" });
//   const day = ordinal(d.getDate());
//   const year = d.getFullYear();
//   const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
//   return `${dow} ${month} ${day}, ${year} ${time}`;
// }

function daysBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

function fmtLongDateOnly(d: Date | null) {
  if (!d) return "";
  const dow = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "long" });
  const day = ordinal(d.getDate());
  const year = d.getFullYear();
  return `${dow} ${month} ${day}, ${year}`;
}


const MODAL_Z = 9999;

export default function QuoteExpirationModal({
  open,
  createdAt,
  expiresAt,
  onClose,
  onSave,
}: Props) {
  const created = toDate(createdAt);
  const [exp, setExp] = React.useState<Date | null>(toDate(expiresAt));

  // sync when parent changes
  React.useEffect(() => setExp(toDate(expiresAt)), [expiresAt]);

  // lock body scroll + esc close
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const diff = daysBetween(created, exp);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      style={{ zIndex: MODAL_Z }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-300 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Change Expiration Date</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          <div className="grid grid-cols-[140px_1fr] items-center gap-y-3 gap-x-4">
            <div className="text-sm font-medium text-gray-600">Created on</div>
            <div className="text-sm text-gray-900">{fmtLongDateOnly(created)}</div>

            <label className="text-sm font-medium text-gray-600">Expires on*</label>
            <div>
              <DatePicker
                value={exp}
                onChange={(d) => setExp(d)}
                placeholder="Select expiration date"
                inputClassName="text-sm"
              />
              <div className="mt-1 text-xs text-gray-500">
                {typeof diff === "number" ? (
                  diff === 0 ? "(same day)" :
                  diff > 0 ? `(${diff} day${diff === 1 ? "" : "s"})` :
                  `(expired ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago)`
                ) : "(choose a date)"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-300 px-5 py-3">
          <button
            type="button"
            className="rounded-lg border cursor-pointer border-gray-300 bg-white px-4 py-2 text-sm"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 cursor-pointer px-4 py-2 text-sm text-white disabled:opacity-60"
            disabled={!exp}
            onClick={() => onSave(toYMD(exp))}
          >
            Save 
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
