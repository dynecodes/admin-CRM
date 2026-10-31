
// src/components/ui/TimeDrop.tsx
import * as React from "react";

type Props = {
  id?: string;
  name?: string;
  /** "HH:MM" in 24h format, e.g. "08:00", "17:30" */
  value: string;
  onChange: (value: string) => void;
  /** Minute step for the minute list (1, 5, 10, etc.) */
  minuteStep?: number;
  /** Wrapper (outer) className */
  className?: string;
  /** Input visual box className (border, padding, etc.) */
  inputClassName?: string;
  disabled?: boolean;
  helperText?: string;
};

type Part = "hour" | "minute" | "ampm" | null;

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

function parseTime24(value: string): {
  hour12: number;
  minute: number;
  ampm: "AM" | "PM";
} {
  // default: 08:00
  let h24 = 8;
  let m = 0;

  if (typeof value === "string") {
    const mMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (mMatch) {
      const hh = Number(mMatch[1]);
      const mm = Number(mMatch[2]);
      if (Number.isFinite(hh) && hh >= 0 && hh <= 23) h24 = hh;
      if (Number.isFinite(mm) && mm >= 0 && mm <= 59) m = mm;
    }
  }

  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;

  return { hour12, minute: m, ampm };
}

function to24(hour12: number, minute: number, ampm: "AM" | "PM"): string {
  let h = hour12 % 12;
  if (ampm === "PM") h += 12;
  if (ampm === "AM" && hour12 === 12) h = 0;
  return `${pad(h)}:${pad(minute)}`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const TimeDrop: React.FC<Props> = ({
  id,
  name,
  value,
  onChange,
  minuteStep = 5,
  className = "",
  inputClassName = "",
  disabled = false,
  helperText,
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [openPart, setOpenPart] = React.useState<Part>(null);

  const { hour12, minute, ampm } = React.useMemo(
    () => parseTime24(value),
    [value],
  );

  // Ensure a stable list of minutes based on step
  const minutes = React.useMemo(() => {
    const step = Math.max(1, minuteStep || 1);
    const arr: number[] = [];
    for (let m = 0; m < 60; m += step) arr.push(m);
    return arr;
  }, [minuteStep]);

  const handleHourChange = (h: number) => {
    const next = to24(h, minute, ampm);
    onChange(next);
    setOpenPart(null);
  };

  const handleMinuteChange = (m: number) => {
    const next = to24(hour12, m, ampm);
    onChange(next);
    setOpenPart(null);
  };

  const handleAmPmChange = (nextAmPm: "AM" | "PM") => {
    const next = to24(hour12, minute, nextAmPm);
    onChange(next);
    setOpenPart(null);
  };

  const togglePart = (part: Part) => {
    if (disabled) return;
    setOpenPart((prev) => (prev === part ? null : part));
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!openPart) return;

    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpenPart(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openPart]);

  const baseSegment =
    "relative flex items-center justify-center px-2 py-1 text-sm select-none";

  const dropdownBase =
    "absolute z-50 mt-1 w-10 max-h-44 cursor-pointer  overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm scrollbar-hide";

  const disabledClasses = disabled
    ? "cursor-not-allowed bg-gray-100 text-gray-400"
    : "hover:bg-gray-50";

  return (
    <div className={cx("inline-flex flex-col", className)} ref={rootRef}>
      <div
        id={id}
        className={cx(
          "inline-flex items-stretch text-gray-900",
          disabled
            ? "bg-gray-100"
            : "focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500",
          inputClassName,
        )}
      >
        {/* Hour segment (no vertical border) */}
        <div className={cx(baseSegment, "rounded-l-md", disabledClasses)}>
          <button
            type="button"
            name={name ? `${name}_hour` : undefined}
            className="w-full cursor-pointer text-center outline-none"
            onClick={() => togglePart("hour")}
            disabled={disabled}
          >
            {pad(hour12)}
          </button>

          {openPart === "hour" && (
            <div className={cx(dropdownBase, "top-[110%] left-0")}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <div
                  key={h}
                  className={cx(
                    "px-2 py-1 text-center",
                    h === hour12
                      ? "bg-gray-600 text-white"
                      : "text-gray-900 hover:bg-gray-100",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHourChange(h)}
                >
                  {pad(h)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colon (just spacing, no border) */}
        <div className="flex items-center px-1 text-sm text-gray-600">:</div>

        {/* Minute segment (no vertical border) */}
        <div className={cx(baseSegment, disabledClasses)}>
          <button
            type="button"
            name={name ? `${name}_minute` : undefined}
            className="w-full cursor-pointer text-center outline-none"
            onClick={() => togglePart("minute")}
            disabled={disabled}
          >
            {pad(minute)}
          </button>

          {openPart === "minute" && (
            <div className={cx(dropdownBase, "top-[110%] left-0")}>
              {minutes.map((m) => (
                <div
                  key={m}
                  className={cx(
                    "px-2 py-1 text-center",
                    m === minute
                      ? "bg-gray-600 text-white"
                      : "text-gray-900 hover:bg-gray-100",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleMinuteChange(m)}
                >
                  {pad(m)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AM/PM segment */}
        <div className={cx(baseSegment, "rounded-r-md", disabledClasses)}>
          <button
            type="button"
            name={name ? `${name}_ampm` : undefined}
            className="w-full text-center outline-none"
            onClick={() => togglePart("ampm")}
            disabled={disabled}
          >
            {ampm}
          </button>

          {openPart === "ampm" && (
            <div className={cx(dropdownBase, "top-[110%] left-0")}>
              {(["AM", "PM"] as const).map((p) => (
                <div
                  key={p}
                  className={cx(
                    "px-2 py-1 text-center",
                    p === ampm
                      ? "bg-gray-600 text-white"
                      : "text-gray-900 hover:bg-gray-100",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAmPmChange(p)}
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

export default TimeDrop;
