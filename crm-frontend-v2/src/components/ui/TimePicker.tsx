import * as React from "react";
import { createPortal } from "react-dom";
import { HiClock, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import useIsMobile from "./useIsMobile";

type Props = {
  value?: string | null; // "HH:mm"
  onChange?: (t: string | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** New: disables interaction entirely */
  disabled?: boolean;
  /** New: optional helper text under the input */
  helperText?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function parse24(v?: string | null) {
  if (!v) return { h24: 10, m: 0 };
  const [h, m] = v.split(":").map(Number);
  return { h24: clamp(h ?? 0, 0, 23), m: clamp(m ?? 0, 0, 59) };
}
function to12(h24: number) {
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return { h12, period };
}
function to24(h12: number, m: number, p: "AM" | "PM") {
  let h = h12 % 12;
  if (p === "PM") h += 12;
  return { h24: h, m };
}

export default function TimePicker({
  value = null,
  onChange,
  placeholder = "Select time",
  className = "",
  inputClassName = "",
  disabled = false,
  helperText,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const ref = React.useRef<HTMLDivElement>(null);

  const { h24, m } = parse24(value);
  const t12 = to12(h24);

  const [hour12, setHour12] = React.useState<number>(t12.h12);
  const [minute, setMinute] = React.useState<number>(m);
  const [ampm, setAmpm] = React.useState<"AM" | "PM">(t12.period);

  React.useEffect(() => {
    const p = parse24(value);
    const t = to12(p.h24);
    setHour12(t.h12);
    setAmpm(t.period);
    setMinute(p.m);
  }, [value]);

  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const updateAndClose = (newHour: number, newMin: number, newPeriod: "AM" | "PM") => {
    if (disabled) return;
    const { h24: hh, m } = to24(newHour, newMin, newPeriod);
    onChange?.(`${pad(hh)}:${pad(m)}`);
  };

  const incHour = (dir: 1 | -1) =>
    setHour12((p) => (p + (dir === 1 ? 1 : 11)) % 12 || 12);

  const incMinute = (dir: 1 | -1) =>
    setMinute((p) => {
      const list = minuteOptions;
      const idx = list.indexOf(p);
      const nextIdx = (idx + (dir === 1 ? 1 : list.length - 1)) % list.length;
      return list[nextIdx];
    });

  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const measure = React.useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const GAP = 8;
    const PANEL_H = 230;
    const above = rect.top >= PANEL_H + GAP;
    const top = (above ? rect.top - PANEL_H - GAP : rect.bottom + GAP) + window.scrollY;
    const left = rect.left + window.scrollX;
    setCoords({ top, left, width: rect.width });
  }, []);

  // Don’t attach listeners or open panel when disabled
  React.useEffect(() => {
    if (disabled || !open || isMobile) return;
    measure();
    const r = () => measure();
    window.addEventListener("scroll", r, true);
    window.addEventListener("resize", r);
    return () => {
      window.removeEventListener("scroll", r, true);
      window.removeEventListener("resize", r);
    };
  }, [open, isMobile, measure, disabled]);

  React.useEffect(() => {
    if (disabled || !open || isMobile) return;
    const onDoc = (e: MouseEvent) => {
      const pop = document.getElementById("timepicker-popover");
      if (!pop) return;
      if (!pop.contains(e.target as Node) && !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, isMobile, disabled]);

  React.useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
    if (!isMobile) measure();
  };

  const Panel = (
    <div className="rounded-xl border border-gray-200 bg-white shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => incHour(-1)}
              disabled={disabled}
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold text-gray-900">
              {pad(hour12)}
            </span>
            <button
              type="button"
              onClick={() => incHour(1)}
              disabled={disabled}
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm font-semibold text-gray-500">:</span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => incMinute(-1)}
              disabled={disabled}
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold text-gray-900">
              {pad(minute)}
            </span>
            <button
              type="button"
              onClick={() => incMinute(1)}
              disabled={disabled}
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              className={`px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                p === ampm ? "bg-gray-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setAmpm(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* MINUTE GRID */}
      <div className="grid cursor-pointer grid-cols-6 gap-2 p-3">
        {minuteOptions.map((mm) => (
          <button
            key={mm}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setMinute(mm);
              updateAndClose(hour12, mm, ampm);
              setOpen(false);
            }}
            className={`rounded-md border px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              mm === minute
                ? "border-gray-600 bg-gray-50 text-gray-700"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {pad(mm)}
          </button>
        ))}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-gray-200 p-2">
        <button
          type="button"
          disabled={disabled}
          className="rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (disabled) return;
            onChange?.(null);
            setOpen(false);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          disabled={disabled}
          className="rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (disabled) return;
            setOpen(false);
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  const display =
    value
      ? (() => {
          const { h24, m } = parse24(value);
          const t = to12(h24);
          return `${pad(t.h12)}:${pad(m)} ${t.period}`;
        })()
      : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          readOnly
          disabled={disabled}
          aria-disabled={disabled || undefined}
          value={display}
          onClick={handleToggle}
          placeholder={placeholder}
          className={[
            "block w-full rounded-lg border px-3 py-2 pr-10 text-sm text-gray-900 focus:outline-none",
            disabled
              ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
              : "border-gray-300 bg-white cursor-pointer focus:border-gray-600 focus:ring-1 focus:ring-gray-500",
            inputClassName,
          ].join(" ")}
        />
        <HiClock
          className={[
            "absolute top-1/2 right-3 -translate-y-1/2",
            disabled ? "text-gray-400" : "text-gray-500 cursor-pointer",
          ].join(" ")}
          size={18}
          onClick={handleToggle}
          aria-hidden
        />
      </div>

      {helperText && (
        <p className={`mt-1 text-xs ${disabled ? "text-gray-500" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}

      {open &&
        !disabled &&
        createPortal(
          isMobile ? (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-4">
              <div className="w-full max-w-[22rem]">{Panel}</div>
            </div>
          ) : (
            <div
              id="timepicker-popover"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 10000,
              }}
            >
              {Panel}
            </div>
          ),
          document.body
        )}
    </div>
  );
}
