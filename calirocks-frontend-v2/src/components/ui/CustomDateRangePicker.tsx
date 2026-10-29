import * as React from "react";
import { createPortal } from "react-dom";
import { HiCalendar, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import useIsMobile from "./useIsMobile";

type Props = {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange?: (startDate: Date | null, endDate: Date | null) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  weekStartsOn?: 0 | 1;
};

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function isInRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  return d >= start && d <= end;
}

function isStartDate(d: Date, start: Date | null) {
  return start ? isSameDay(d, start) : false;
}

function isEndDate(d: Date, end: Date | null) {
  return end ? isSameDay(d, end) : false;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

type CalendarGridProps = {
  month: Date;
  startDate: Date | null;
  endDate: Date | null;
  onDateClick: (date: Date) => void;
  weekStartsOn?: 0 | 1;
  onMonthChange: (month: Date) => void;
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  month,
  startDate,
  endDate,
  onDateClick,
  weekStartsOn = 0,
  onMonthChange,
}) => {
  const firstDayOfMonth = startOfMonth(month);
  const firstWeekday = firstDayOfMonth.getDay();
  const offset = weekStartsOn === 1 ? (firstWeekday + 6) % 7 : firstWeekday;

  const days: Date[] = [];
  const gridStart = new Date(firstDayOfMonth);
  gridStart.setDate(firstDayOfMonth.getDate() - offset);

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const weekdayLabels =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthLabel = month.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white select-none">
      <div className="relative flex items-center justify-center border-b border-gray-200 px-10 py-2">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="absolute left-2 cursor-pointer rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          aria-label="Previous month"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-sm font-semibold text-gray-900">{monthLabel}</div>

        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="absolute right-2 cursor-pointer rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          aria-label="Next month"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headings */}
      <div className="grid grid-cols-7 gap-0 px-2 pt-2">
        {weekdayLabels.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-xs font-medium text-gray-500"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 p-2 pb-3">
        {days.map((d) => {
          const isCurrentMonth = d.getMonth() === month.getMonth();
          const isStart = isStartDate(d, startDate);
          const isEnd = isEndDate(d, endDate);
          const inRange = isInRange(d, startDate, endDate);
          const today = isToday(d);

          let bgClass = "";
          let textClass = "";
          if (isStart || isEnd) {
            bgClass = "bg-gray-600";
            textClass = "font-semibold text-white";
          } else if (inRange) {
            bgClass = "bg-gray-100";
            textClass = "text-gray-900";
          } else if (today) {
            bgClass = "";
            textClass = "border border-gray-500 text-gray-700";
          } else if (isCurrentMonth) {
            bgClass = "";
            textClass = "text-gray-900 hover:bg-gray-100";
          } else {
            bgClass = "";
            textClass = "text-gray-400 hover:bg-gray-100";
          }

          return (
            <button
              type="button"
              key={d.toISOString()}
              onClick={() => onDateClick(d)}
              className={[
                "h-9 w-full cursor-pointer rounded-md text-sm",
                "focus:ring-2 focus:ring-gray-500 focus:outline-none",
                bgClass,
                textClass,
                !isStart && !isEnd && !inRange && !today && isCurrentMonth
                  ? "hover:bg-gray-100"
                  : "",
              ].join(" ")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function CustomDateRangePicker({
  startDate = null,
  endDate = null,
  onChange,
  onCancel,
  placeholder = "Select date",
  className = "",
  inputClassName = "",
  weekStartsOn = 0,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState<Date | null>(
    startDate,
  );
  const [tempEndDate, setTempEndDate] = React.useState<Date | null>(endDate);
  const now = new Date();
  const [leftMonth, setLeftMonth] = React.useState<Date>(
    startDate ? startOfMonth(startDate) : startOfMonth(now),
  );
  const [rightMonth, setRightMonth] = React.useState<Date>(
    startDate
      ? startOfMonth(addMonths(startDate, 1))
      : startOfMonth(addMonths(now, 1)),
  );

  const isMobile = useIsMobile();
  const ref = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });

  React.useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const measure = React.useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const GAP = 8;
    const POPOVER_MIN_WIDTH = 700;
    const VIEWPORT_PADDING = 16;

    const top = rect.bottom + GAP + window.scrollY;
    let left = rect.left + window.scrollX;
    const width = Math.max(rect.width, POPOVER_MIN_WIDTH);

    const viewportWidth = window.innerWidth;
    if (left + width > viewportWidth - VIEWPORT_PADDING) {
      left = Math.max(
        VIEWPORT_PADDING,
        viewportWidth - width - VIEWPORT_PADDING,
      );
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    setCoords({ top, left, width });
  }, []);

  React.useEffect(() => {
    if (!open || isMobile) return;
    const onDoc = (e: MouseEvent) => {
      const pop = document.getElementById("daterangepicker-popover");
      if (!pop) return;
      if (
        !pop.contains(e.target as Node) &&
        !ref.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, isMobile, startDate, endDate]);

  React.useEffect(() => {
    if (!open || isMobile) return;
    const timeoutId = setTimeout(() => {
      measure();
    }, 0);
    const rerun = () => measure();
    window.addEventListener("scroll", rerun, true);
    window.addEventListener("resize", rerun);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", rerun, true);
      window.removeEventListener("resize", rerun);
    };
  }, [open, isMobile, measure]);

  React.useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const toggle = () => {
    if (!open) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      if (startDate) {
        setLeftMonth(startOfMonth(startDate));
        setRightMonth(startOfMonth(addMonths(startDate, 1)));
      } else {
        const now = new Date();
        setLeftMonth(startOfMonth(now));
        setRightMonth(startOfMonth(addMonths(now, 1)));
      }
    }
    setOpen((v) => !v);
    if (!isMobile && !open) {
      requestAnimationFrame(() => {
        measure();
      });
    }
  };

  const handleDateClick = (date: Date) => {
    if (!tempStartDate) {
      setTempStartDate(date);
      setTempEndDate(date);
    } else if (tempStartDate && tempEndDate) {
      if (isSameDay(tempStartDate, tempEndDate)) {
        if (isSameDay(date, tempStartDate)) {
          setTempStartDate(date);
          setTempEndDate(null);
        } else {
          if (date > tempStartDate) {
            setTempEndDate(date);
          } else {
            setTempStartDate(date);
          }
        }
      } else {
        setTempStartDate(date);
        setTempEndDate(date);
      }
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onChange?.(null, null);
  };

  const handleClose = () => {
    if (tempStartDate && tempEndDate) {
      onChange?.(tempStartDate, tempEndDate);
    } else {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
    setOpen(false);
    onCancel?.();
  };

  const handleLeftMonthChange = (month: Date) => {
    setLeftMonth(month);
    setRightMonth(addMonths(month, 1));
  };

  const handleRightMonthChange = (month: Date) => {
    setRightMonth(month);
    setLeftMonth(addMonths(month, -1));
  };

  const displayValue =
    tempStartDate && tempEndDate
      ? isSameDay(tempStartDate, tempEndDate)
        ? formatDate(tempStartDate)
        : `${formatDate(tempStartDate)} - ${formatDate(tempEndDate)}`
      : tempStartDate
        ? formatDate(tempStartDate)
        : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          readOnly
          value={displayValue}
          onClick={toggle}
          placeholder={placeholder}
          className={[
            "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900",
            "cursor-pointer focus:border-gray-600 focus:ring-1 focus:ring-gray-500 focus:outline-none",
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
            <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/30 p-4">
              <div className="flex min-h-full items-center justify-center py-4">
                <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl">
                  <div className="grid grid-cols-1 gap-4 p-4">
                    <CalendarGrid
                      month={leftMonth}
                      startDate={tempStartDate}
                      endDate={tempEndDate}
                      onDateClick={handleDateClick}
                      weekStartsOn={weekStartsOn}
                      onMonthChange={handleLeftMonthChange}
                    />
                    <CalendarGrid
                      month={rightMonth}
                      startDate={tempStartDate}
                      endDate={tempEndDate}
                      onDateClick={handleDateClick}
                      weekStartsOn={weekStartsOn}
                      onMonthChange={handleRightMonthChange}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 p-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="daterangepicker-popover"
              className="rounded-lg border border-gray-200 bg-white shadow-xl"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxWidth: `calc(100vw - ${16 * 2}px)`,
                zIndex: 10000,
              }}
            >
              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <CalendarGrid
                  month={leftMonth}
                  startDate={tempStartDate}
                  endDate={tempEndDate}
                  onDateClick={handleDateClick}
                  weekStartsOn={weekStartsOn}
                  onMonthChange={handleLeftMonthChange}
                />
                <CalendarGrid
                  month={rightMonth}
                  startDate={tempStartDate}
                  endDate={tempEndDate}
                  onDateClick={handleDateClick}
                  weekStartsOn={weekStartsOn}
                  onMonthChange={handleRightMonthChange}
                />
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
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
