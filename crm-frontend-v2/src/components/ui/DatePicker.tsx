// src/components/ui/DatePicker.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { HiCalendar } from "react-icons/hi";
import Calendar from "./Calendar";
import useIsMobile from "./useIsMobile";

type Props = {
  value?: Date | null;
  onChange?: (d: Date | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  weekStartsOn?: 0 | 1;
};

function fmt(d?: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatePicker({
  value = null,
  onChange,
  placeholder = "Select date",
  className = "",
  inputClassName = "",
  weekStartsOn = 0,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const ref = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });

  const measure = React.useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const GAP = 2;

    // ALWAYS open below input
    const top = rect.bottom + GAP + window.scrollY;
    const left = rect.left + window.scrollX;

    setCoords({ top, left, width: rect.width });
  }, []);

  // Outside click (desktop only; portal used)
  React.useEffect(() => {
    if (!open || isMobile) return;
    const onDoc = (e: MouseEvent) => {
      const pop = document.getElementById("datepicker-popover");
      if (!pop) return;
      if (
        !pop.contains(e.target as Node) &&
        !ref.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, isMobile]);

  // Keep popup anchored correctly
  React.useEffect(() => {
    if (!open || isMobile) return;
    measure();
    const rerun = () => measure();
    window.addEventListener("scroll", rerun, true);
    window.addEventListener("resize", rerun);
    return () => {
      window.removeEventListener("scroll", rerun, true);
      window.removeEventListener("resize", rerun);
    };
  }, [open, isMobile, measure]);

  // Lock body scroll on mobile
  React.useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const toggle = () => {
    setOpen((v) => !v);
    if (!isMobile) measure();
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          readOnly
          value={fmt(value)}
          onClick={toggle}
          placeholder={placeholder}
          className={[  
            "block w-full px-3 py-2 pr-10 text-gray-900 cursor-pointer border border-gray-300 rounded-md text-xs text-left items-center justify-between hover:border-gray-600 hover:ring-gray-500 hover:ring-1 bg-white ",
            "cursor-pointer outline-none",
            inputClassName,
          ].join(" ")}
        />
        <HiCalendar
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-500"
          size={18}
          onClick={toggle}
        />
      </div>

      {open &&
        createPortal(
          isMobile ? (
            // 📱 Mobile centered modal
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-4">
              <div className="w-full max-w-[22rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                <div className="px-4 py-3 text-sm font-semibold text-gray-900">
                  Select date
                </div>
                <Calendar
                  value={value ?? undefined}
                  weekStartsOn={weekStartsOn}
                  onChange={(d) => {
                    onChange?.(d);
                    setOpen(false);
                  }}
                />
                <div className="flex items-center justify-between border-t border-gray-200 p-2">
                  <button
                    type="button"
                    className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    onClick={() => onChange?.(null)}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="datepicker-popover"
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: 252,
                zIndex: 10000,
              }}
            >
              <div
                className="-mb-8 origin-top-left scale-90"
                style={{ width: "111.11%" }}
              >
                <Calendar
                  value={value ?? undefined}
                  weekStartsOn={weekStartsOn}
                  onChange={(d) => {
                    onChange?.(d);
                    setOpen(false);
                  }}
                />
              </div>
              <div
                className="flex origin-bottom-left scale-90 items-center justify-between border-t border-gray-200 p-1.5"
                style={{ width: "111.11%" }}
              >
                <button
                  type="button"
                  className="cursor-pointer rounded-md px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100"
                  onClick={() => onChange?.(null)}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-md px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          ),
          document.body,
        )}
    </div>
  );
}
