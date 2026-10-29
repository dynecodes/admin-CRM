import * as React from "react";
import {
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

type CalendarProps = {
  value?: Date | null;
  onChange?: (date: Date) => void;
  /** Optionally control the visible month from parent */
  visibleMonth?: Date;
  onVisibleMonthChange?: (m: Date) => void;
  /** Start week on Sunday (default) or Monday */
  weekStartsOn?: 0 | 1;
  className?: string;
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

export const Calendar: React.FC<CalendarProps> = ({
  value = null,
  onChange,
  visibleMonth,
  onVisibleMonthChange,
  weekStartsOn = 0,
  className = "",
}) => {
  const uncontrolledMonth = React.useMemo(
    () => startOfMonth(value ?? new Date()),
    // changing month when value changes keeps the month aligned when selecting
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [/*value*/]
  );

  const [internalMonth, setInternalMonth] = React.useState<Date>(uncontrolledMonth);

  const month = visibleMonth ? startOfMonth(visibleMonth) : internalMonth;

  const setMonth = (m: Date) => {
    if (onVisibleMonthChange) onVisibleMonthChange(m);
    else setInternalMonth(m);
  };

  const monthLabel = month.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid (6 rows x 7 columns)
  const firstDayOfMonth = startOfMonth(month);
  const firstWeekday = firstDayOfMonth.getDay(); // 0..6 Sun..Sat
  // shift offset if week starts Monday
  const offset = weekStartsOn === 1 ? (firstWeekday + 6) % 7 : firstWeekday;

  const days: Date[] = [];
  // start date shown in grid
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

  return (
    <div className={`w-full select-none rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Header with LEFT / RIGHT arrows */}
      <div className="relative flex items-center justify-center border-b border-gray-200 px-10 py-2">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          className="absolute cursor-pointer left-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Previous month"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-sm font-semibold text-gray-900">{monthLabel}</div>

        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="absolute right-2 cursor-pointer rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          aria-label="Next month"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headings */}
      <div className="grid grid-cols-7 gap-0 px-2 pt-2">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1 text-center text-xs font-medium text-gray-500">
            {w}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 p-2 pb-3 cursor-pointer">
        {days.map((d) => {
          const isCurrentMonth = d.getMonth() === month.getMonth();
          const selected = value ? isSameDay(d, value) : false;

          return (
            <button
              type="button"
              key={d.toISOString()}
              onClick={() => onChange?.(d)}
              className={[
                "h-9 w-full rounded-md text-sm",
                "focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer",
                selected
                  ? "bg-gray-600 font-semibold text-white"
                  : isToday(d)
                  ? "border border-gray-500 text-gray-700"
                  : isCurrentMonth
                  ? "text-gray-900 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-gray-100",
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

export default Calendar;
