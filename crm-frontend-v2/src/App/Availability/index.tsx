// App/Availability/index.tsx
import * as React from "react";
import { Modal } from "flowbite-react";

import { useProviders } from "../../hooks/Providers/useProviders";

import {
  useAvailability,
  AvailabilitySlot,
} from "../../hooks/Availability/useAvailability";
import ChangeAvailabilityMenu from "../../components/availability/ChangeAvailabilityMenu";

// change-availability modals
import DefaultAvailabilityModal from "../../components/availability/DefaultAvailabilityModal";
import SpecificDateModal from "../../components/availability/SpecificDateModal";
import TimeOffModal from "../../components/availability/TimeOffModal";
import HistoryModal from "../../components/availability/HistoryModal";
import { useDraggableModal } from "../../hooks/useDraggableModal";

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Shift = { start: string; end: string };

// ============================================================================
// DATE UTILITIES
// ============================================================================

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const delta = x.getDay();
  x.setDate(x.getDate() - delta);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameYMD = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const pad = (n: number) => String(n).padStart(2, "0");
const label = (iso: string) => {
  const d = new Date(iso);
  let h = d.getHours(),
    m = d.getMinutes();
  const am = h < 12;
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${pad(m)}${am ? "AM" : "PM"}`;
};
const rangeLabel = (s: AvailabilitySlot) => `${label(s.start)}-${label(s.end)}`;
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const longHeader = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

// ============================================================================
// PILL COMPONENTS
// ============================================================================

function DayPill({
  text,
  title,
}: {
  text: string;
  title?: string;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative">
      <div
        className="cursor-pointer truncate rounded bg-green-600 px-2 py-1 text-[11px] leading-4 font-semibold text-white"
        title={title}
      >
        {text}
      </div>
    </div>
  );
}

function NotePill({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <div
      className={
        "truncate rounded bg-yellow-400 px-2 py-1 text-[11px] leading-4 font-semibold text-gray-900" +
        (onClick ? " cursor-pointer hover:bg-yellow-500" : "")
      }
      title={text}
      onClick={onClick}
    >
      {text}
    </div>
  );
}

// ============================================================================
// MONTH VIEW DAY CONTENT
// ============================================================================

function DayContent({
  notes,
  slots,
  maxVisible = 4,
  onMore,
  onDeleteSlot,
}: {
  notes: string[];
  slots: AvailabilitySlot[];
  maxVisible?: number;
  onMore: () => void;
  onDeleteSlot: (slot: AvailabilitySlot) => void;
}) {
  const allItems = [
    ...notes.map((n) => ({ type: "note" as const, content: n })),
    ...slots.map((s) => ({ type: "slot" as const, content: s })),
  ];

  const visible = allItems.slice(0, maxVisible);
  const remaining = allItems.length - maxVisible;

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {visible.map((item, i) => {
        if (item.type === "note") {
          return <NotePill key={`note-${i}`} text={item.content} />;
        } else {
          return (
            <DayPill
              key={item.content.id}
              text={rangeLabel(item.content)}
              title="Click × to remove"
              onDelete={() => onDeleteSlot(item.content)}
            />
          );
        }
      })}
      {remaining > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="cursor-pointer text-[11px] font-medium text-gray-700"
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
}

// ============================================================================
// TIME GRID COMPONENTS (Week & Day views)
// ============================================================================

// Calculate position and height for time-based blocks
function getTimeGridPosition(
  startISO: string,
  endISO: string,
  gridStartHour: number = 0,
) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const startHour = start.getHours();
  const startMin = start.getMinutes();
  const endHour = end.getHours();
  const endMin = end.getMinutes();

  // Each hour = 60px
  const PIXELS_PER_HOUR = 60;
  const PIXELS_PER_MIN = PIXELS_PER_HOUR / 60;

  // Calculate from grid start (default 6am)
  const topOffset =
    (startHour - gridStartHour) * PIXELS_PER_HOUR + startMin * PIXELS_PER_MIN;
  const duration =
    (endHour - startHour) * PIXELS_PER_HOUR +
    (endMin - startMin) * PIXELS_PER_MIN;

  return {
    top: Math.max(0, topOffset),
    height: Math.max(20, duration),
  };
}

// Time-based availability block for Week/Day views
function TimeBlock({
  slot,
  onClick,
  gridStartHour = 0,
}: {
  slot: AvailabilitySlot;
  onDelete: () => void;
  onClick: () => void;
  gridStartHour?: number;
}) {
  const { top, height } = getTimeGridPosition(
    slot.start,
    slot.end,
    gridStartHour,
  );

  return (
    <div
      className="group absolute right-0 left-0 mx-0.5 cursor-pointer overflow-hidden rounded bg-green-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
      style={{ top: `${top}px`, height: `${height}px`, minHeight: "40px" }}
      title={rangeLabel(slot)}
      onClick={onClick}
    >
      <div className="relative h-full">
        <div className="truncate">{rangeLabel(slot)}</div>
      </div>
    </div>
  );
}

// ============================================================================
// DAY DETAILS MODAL
// ============================================================================
function DayDetailsModal({
  open,
  onClose,
  day,
  notes,
  slots,
}: {
  open: boolean;
  onClose: () => void;
  day: Date | null;
  notes: string[];
  slots: AvailabilitySlot[];
  onDeleteSlot: (slot: AvailabilitySlot) => void;
}) {
  useDraggableModal(open);

  return (
    <Modal show={open} size="sm" dismissible onClose={onClose}>
      <div className="relative rounded-md bg-white">
        {/* draggable header (handle) */}
        <div className="modal-drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 px-6 py-4 select-none active:cursor-grabbing">
          <div className="pointer-events-none">
            {day ? longHeader(day) : ""}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className="max-h-[60vh] space-y-3 overflow-auto p-4">
          {notes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase">
                Notes
              </div>
              {notes.map((n, i) => (
                <NotePill key={i} text={n} />
              ))}
            </div>
          )}

          {slots.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase">
                Availability
              </div>
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2"
                >
                  <DayPill text={rangeLabel(s)} />
                </div>
              ))}
            </div>
          )}

          {notes.length === 0 && slots.length === 0 && (
            <div className="py-4 text-center text-sm text-gray-500">
              No notes or availability for this day
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const TeamAvailability: React.FC = () => {
  const { providers } = useProviders();
  const av = useAvailability();

  const [providerId, setProviderId] = React.useState<number>(
    () => providers[0]?.id ?? 1,
  );
  const api = React.useMemo(() => av.forProvider(providerId), [av, providerId]);

  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = React.useState<Date>(new Date());

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] =
    React.useState<AvailabilitySlot | null>(null);

  const [showDefault, setShowDefault] = React.useState(false);
  const [showSpecific, setShowSpecific] = React.useState(false);
  const [showTimeOff, setShowTimeOff] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // Details modal state
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsDay, setDetailsDay] = React.useState<Date | null>(null);
  const [detailsNotes, setDetailsNotes] = React.useState<string[]>([]);
  const [detailsSlots, setDetailsSlots] = React.useState<AvailabilitySlot[]>(
    [],
  );

  const openDetails = (
    day: Date,
    notes: string[],
    slots: AvailabilitySlot[],
  ) => {
    setDetailsDay(day);
    setDetailsNotes(notes);
    setDetailsSlots(slots);
    setDetailsOpen(true);
  };
  const closeDetails = () => setDetailsOpen(false);

  // Default Availability editor draft
  const [defaultByWeekday, setDefaultByWeekday] = React.useState<
    Record<Weekday, Shift[]>
  >(() => av.defaults as Record<Weekday, Shift[]>);

  React.useEffect(() => {
    if (showDefault) {
      setDefaultByWeekday(av.defaults as Record<Weekday, Shift[]>);
    }
  }, [showDefault, av.defaults]);

  const provider = providers.find((p) => p.id === providerId);

  const onOpenForDate = (day: Date) => {
    setSelectedDate(day);
    setSelectedSlot(null); // Clear any previously selected slot
    setShowSpecific(true);
  };

  const onOpenForSlot = (slot: AvailabilitySlot) => {
    const slotDate = new Date(slot.start);
    setSelectedDate(slotDate);
    setSelectedSlot(slot);
    setShowSpecific(true);
  };

  const confirmDelete = (slot: AvailabilitySlot) => {
    if (!window.confirm("Remove this availability?")) return;
    const d = new Date(slot.start);
    av.setOverrideForDate(providerId, ymd(d), []);
  };

  // Defaults modal helpers
  const getShifts = React.useCallback(
    (d: any): Shift[] => {
      const key = (typeof d === "number" ? d : 0) as Weekday;
      return defaultByWeekday[key] ?? [];
    },
    [defaultByWeekday],
  );

  const setShifts = React.useCallback((d: any, s: Shift[]) => {
    const key = (typeof d === "number" ? d : 0) as Weekday;
    setDefaultByWeekday((prev) => ({ ...prev, [key]: s }));
  }, []);

  const applyFromTo = React.useCallback((from: any, to: any) => {
    const f = (typeof from === "number" ? from : 0) as Weekday;
    const targets = (Array.isArray(to) ? to : [to]) as Weekday[];
    setDefaultByWeekday((prev) => {
      const next = { ...prev };
      targets.forEach((t) => (next[t] = prev[f] ? [...prev[f]] : []));
      return next;
    });
  }, []);

  const handleSaveDefaults = React.useCallback(
    (draft: Record<Weekday, Shift[]>) => {
      // Only apply to the month that is currently shown by `cursor`
      const monthStart = startOfMonth(cursor);
      const monthEnd = endOfMonth(cursor);

      for (let d = new Date(monthStart); d <= monthEnd; d = addDays(d, 1)) {
        const weekday = d.getDay() as Weekday;
        const shiftsForDay = draft[weekday] ?? [];

        // If no shifts = day off for this day in THIS month
        av.setOverrideForDate(providerId, ymd(d), shiftsForDay);
      }
    },
    [av, cursor, providerId],
  );

  const handleSaveSpecific = React.useCallback(
    (startDate: string, endDate: string, shifts: Shift[], note?: string) => {
      const sDate = new Date(startDate + "T00:00:00");
      const eDate = new Date(endDate + "T00:00:00");
      for (let d = new Date(sDate); d <= eDate; d = addDays(d, 1)) {
        av.setOverrideForDate(providerId, ymd(d), shifts, note);
      }
      setShowSpecific(false);
    },
    [av, providerId],
  );

  const handleResetSpecific = React.useCallback(
    (startDate: string, endDate: string) => {
      av.resetToDefaultForRange(providerId, startDate, endDate);
    },
    [av, providerId],
  );

  // Calendar ranges
  const monthCells = React.useMemo(() => {
    const mStart = startOfMonth(cursor);
    // use the same Sunday-based week start as weekDays
    const first = startOfWeek(mStart); // Sunday of the week containing the 1st
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(addDays(first, i));
    }
    return cells;
  }, [cursor]);

  const weekDays = React.useMemo(() => {
    const wStart = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
  }, [cursor]);

  const dayDate = cursor;
  // Day-view all-day notes slicing
  const dayInfo = api.dayInfo(dayDate);
  const dayNotes = dayInfo.notes;
  const maxDayNotes = 4; // how many all-day notes to show before "+n more"
  const visibleDayNotes = dayNotes.slice(0, maxDayNotes);
  const remainingDayNotes = dayNotes.length - maxDayNotes;

  const goPrev = () => {
    if (view === "month") setCursor(addDays(startOfMonth(cursor), -1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor(addDays(endOfMonth(cursor), 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };
  const goToday = () => setCursor(new Date());

  const slotsForDay = (d: Date) =>
    api.slotsForRange(startOfDay(d), endOfDay(d));

  // Time grid hours (6am to 9pm)
  const gridStartHour = 0;
  const gridEndHour = 23;
  const hours = Array.from(
    { length: gridEndHour - gridStartHour + 1 },
    (_, i) => gridStartHour + i,
  );

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* =========================================================================
          HEADER 
      ========================================================================= */}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:mb-6 sm:flex-row">
        <div className="flex items-start gap-4">
          <div className="relative inline-flex h-12 min-h-[3rem] w-12 min-w-[3rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
            <svg
              className="h-6 w-6 flex-shrink-0 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M7 3v3m10-3v3M4 9h16m-1 11H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2Z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Team Availability
              {provider?.teamTitle ? `: ${provider.teamTitle}` : ""}
            </span>
            <div className="text-sm text-gray-500">
              View and manage your teams' working hours and time off.
            </div>
          </div>
        </div>

        {/* Right-side CTA (same position as Promotions button) */}
        <div className="w-full sm:w-auto">
          <div className="flex flex-row flex-wrap items-center gap-2 sm:justify-end">
            <ChangeAvailabilityMenu
              onDefault={() => setShowDefault(true)}
              onSpecific={() => setShowSpecific(true)}
              onTimeOff={() => setShowTimeOff(true)}
              onHistory={() => setShowHistory(true)}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR 
      ========================================================================= */}
      <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
        {/* Provider select */}
        <div className="w-full sm:w-64">
          <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
            Team
          </label>
          <select
            className="w-full cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
            value={providerId}
            onChange={(e) => setProviderId(Number(e.target.value))}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id} >
                {p.teamTitle}
              </option>
            ))}
          </select>
        </div>
        {/* Date + view buttons */}
        <div className="gap-2sm:w-auto mt-2 flex w-full flex-col sm:flex-row sm:items-center sm:justify-end">
          <h2 className="text-gray-900 sm:px-5 sm:text-sm md:text-base md:whitespace-nowrap lg:mr-20 lg:text-2xl">
            {view === "month" &&
              cursor.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            {view === "week" &&
              `${startOfWeek(cursor).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString(
                undefined,
                { day: "numeric" },
              )}, ${cursor.getFullYear()}`}
            {view === "day" &&
              cursor.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
          </h2>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1">
            {/* view buttons: month / week / day */}
            <div className="flex flex-wrap items-center gap-1">
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  className={`cursor-pointer rounded px-3 py-1 text-sm ${
                    view === v
                      ? "bg-gray-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* navigation: today / < / > */}
            <div className="flex items-center gap-1">
              <button
                className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-500 hover:bg-gray-50"
                onClick={goToday}
              >
                today
              </button>
              <button
                className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                onClick={goPrev}
              >
                ‹
              </button>
              <button
                className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                onClick={goNext}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CALENDAR CONTENT 
      ========================================================================= */}
      <div className="flex-1 overflow-auto">
        {/* ===== MONTH VIEW ===== */}
        {view === "month" && (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="border-r border-gray-200 px-2 py-2 text-center text-sm font-medium text-gray-600 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {monthCells.map((day, idx) => {
                const inMonth = day.getMonth() === cursor.getMonth();
                const daySlots = slotsForDay(day);
                const isToday = sameYMD(day, new Date());
                const notes = api.dayInfo(day).notes;

                return (
                  <button
                    key={idx}
                    onClick={() => onOpenForDate(day)}
                    className={`min-h-[100px] cursor-pointer border-r border-b border-gray-200 p-2 text-left hover:bg-gray-50 ${
                      !inMonth ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="mb-1 text-sm">
                      <span
                        className={`${
                          isToday
                            ? "px-2 py-0.5 font-semibold text-blue-600"
                            : inMonth
                              ? "text-gray-900"
                              : "text-gray-400"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    <DayContent
                      notes={notes}
                      slots={daySlots}
                      maxVisible={3}
                      onMore={() => openDetails(day, notes, daySlots)}
                      onDeleteSlot={confirmDelete}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== WEEK VIEW ===== */}
        {view === "week" && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
              <div className="px-2 py-2"></div>
              {weekDays.map((d) => (
                <div
                  key={d.toISOString()}
                  className="border-l border-gray-200 px-2 py-2 text-center"
                >
                  <div className="text-xs text-gray-600">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}{" "}
                    {/* {d.getDate()} */}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      sameYMD(d, new Date()) ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* All-day section */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200">
              <div className="bg-gray-50 px-5.5 py-3 text-xs whitespace-nowrap text-gray-600 uppercase">
                all-day
              </div>
              {weekDays.map((d) => {
                const notes = api.dayInfo(d).notes;
                const maxAllDayNotes = 4; // how many to show before "+n more"
                const visibleNotes = notes.slice(0, maxAllDayNotes);
                const remainingNotes = notes.length - maxAllDayNotes;

                return (
                  <div
                    key={d.toISOString()}
                    className="min-h-[60px] cursor-pointer truncate border-l border-gray-200 bg-yellow-50 p-2 hover:bg-yellow-100"
                    onClick={() => onOpenForDate(d)}
                  >
                    {/* truncate rounded bg-yellow-400 px-2 py-1 text-[11px] leading-4 font-semibold text-gray-900 */}
                    <div className="space-y-1">
                      {notes.length > 0 && (
                        <>
                          {visibleNotes.map((n, i) => (
                            <NotePill key={i} text={n} />
                          ))}

                          {remainingNotes > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(d, notes, slotsForDay(d));
                              }}
                              className="cursor-pointer text-[11px] font-medium text-gray-700"
                            >
                              +{remainingNotes} more
                            </button>
                          )}
                        </>
                      )}
                      {notes.length === 0 && (
                        <div className="text-[11px] text-gray-400">
                          {/* keep empty or put "No all-day items" if you want */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="scrollbar-hide max-h-[480px] overflow-y-auto">
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                {/* Hour labels column */}
                <div className="bg-gray-50">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="h-[60px] border-b border-gray-200 px-2 py-1 text-right text-xs text-gray-600"
                    >
                      {h === 0
                        ? "12am"
                        : h < 12
                          ? `${h}am`
                          : h === 12
                            ? "12pm"
                            : `${h - 12}pm`}
                    </div>
                  ))}
                </div>

                {/* Day columns with time blocks */}
                {weekDays.map((d) => {
                  const daySlots = slotsForDay(d);
                  return (
                    <div
                      key={d.toISOString()}
                      className="relative cursor-pointer border-l border-gray-200 hover:bg-gray-50"
                      onClick={() => onOpenForDate(d)}
                      style={{ height: `${hours.length * 60}px` }}
                    >
                      {/* Hour lines */}
                      {hours.map((h, i) => (
                        <div
                          key={h}
                          className="absolute right-0 left-0 border-b border-gray-100"
                          style={{ top: `${i * 60}px` }}
                        />
                      ))}

                      {/* Time blocks */}
                      {daySlots.map((slot) => (
                        <TimeBlock
                          key={slot.id}
                          slot={slot}
                          onDelete={() => confirmDelete(slot)}
                          onClick={() => onOpenForSlot(slot)}
                          gridStartHour={gridStartHour}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== DAY VIEW ===== */}
        {view === "day" && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* All-day section */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50 px-100 py-2 text-sm font-medium text-gray-700">
              {dayDate.toLocaleDateString(undefined, { weekday: "long" })}
            </div>
            <div className="grid grid-cols-[80px_1fr]">
              <div className="border-b border-gray-200 bg-gray-50 px-5.5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs whitespace-nowrap text-gray-600 uppercase">
                    all-day
                  </div>
                </div>
              </div>
              {/* notes list with "+ n more" like FullCalendar */}
              <div className="space-y-1 border-l border-gray-200 bg-yellow-50 px-1 py-2">
                {dayNotes.length === 0 ? (
                  <div className="text-sm text-gray-400">No all-day items</div>
                ) : (
                  <>
                    {visibleDayNotes.map((n, i) => (
                      <NotePill
                        key={i}
                        text={n}
                        onClick={() => onOpenForDate(dayDate)}
                      />
                    ))}

                    {remainingDayNotes > 0 && (
                      <button
                        className="cursor-pointer text-[11px] font-medium text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(dayDate, dayNotes, slotsForDay(dayDate));
                        }}
                      >
                        +{remainingDayNotes} more
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Time grid */}
            <div className="scrollbar-hide max-h-[480px] overflow-y-auto">
              <div className="grid grid-cols-[80px_1fr]">
                {/* Hour labels */}
                <div className="bg-gray-50">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="h-[60px] border-b border-gray-200 px-2 py-1 text-right text-xs text-gray-600"
                    >
                      {h === 0
                        ? "12am"
                        : h < 12
                          ? `${h}am`
                          : h === 12
                            ? "12pm"
                            : `${h - 12}pm`}
                    </div>
                  ))}
                </div>

                {/* Time blocks */}
                <div
                  className="relative border-l border-gray-200"
                  style={{ height: `${hours.length * 60}px` }}
                >
                  {/* Hour lines */}
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute right-0 left-0 border-b border-gray-100"
                      style={{ top: `${i * 60}px` }}
                    />
                  ))}

                  {/* Time blocks */}
                  {slotsForDay(dayDate).map((slot) => (
                    <TimeBlock
                      key={slot.id}
                      slot={slot}
                      onDelete={() => confirmDelete(slot)}
                      onClick={() => onOpenForSlot(slot)}
                      gridStartHour={gridStartHour}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {provider && (
        <>
          <DefaultAvailabilityModal
            open={showDefault}
            onClose={() => setShowDefault(false)}
            getShifts={getShifts}
            setShifts={setShifts}
            applyFromTo={applyFromTo}
            onSave={handleSaveDefaults}
          />

          <SpecificDateModal
            open={showSpecific}
            onClose={() => {
              setShowSpecific(false);
              setSelectedSlot(null);
            }}
            onSave={handleSaveSpecific}
            onReset={handleResetSpecific}
            initialDate={ymd(selectedDate ?? cursor)}
            initialShifts={
              selectedSlot
                ? [
                    {
                      start: new Date(selectedSlot.start).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        },
                      ),
                      end: new Date(selectedSlot.end).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        },
                      ),
                    },
                  ]
                : selectedDate
                  ? slotsForDay(selectedDate).map((slot) => ({
                      start: new Date(slot.start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }),
                      end: new Date(slot.end).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }),
                    }))
                  : undefined
            }
            getNotesForYmd={(day) => api.noteListForYmd(day)}
            addNoteForYmd={(day, text) => api.addNoteForYmd(day, text)}
            updateNoteForYmd={(day, i, text) =>
              api.updateNoteForYmd(day, i, text)
            }
            deleteNoteForYmd={(day, i) => api.deleteNoteForYmd(day, i)}
            getShiftsForYmd={(ymd) => {
              // 🔹 Build the effective shifts for that day using the core hook data
              const d = new Date(ymd + "T00:00:00");
              const weekday = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

              // 1) check overrides first
              const ov = av.overrides.find(
                (o) => o.providerId === providerId && o.date === ymd,
              );
              if (ov) return ov.shifts;

              // 2) fallback to default template for that weekday
              return av.defaults[weekday] ?? [];
            }}
          />

          <TimeOffModal
            open={showTimeOff}
            onClose={() => setShowTimeOff(false)}
            onSave={(startDate, endDate, note) => {
              av.addTimeOff(providerId, startDate, endDate, note);
              setShowTimeOff(false);
            }}
            providerLabel={
              providers.find((p) => p.id === providerId)?.teamTitle ?? ""
            }
            initialDate={ymd(cursor)}
            getNotesForYmd={(day) => api.noteListForYmd(day)}
            addNoteForYmd={(day, text) => api.addNoteForYmd(day, text)}
            updateNoteForYmd={(day, i, text) =>
              api.updateNoteForYmd(day, i, text)
            }
            deleteNoteForYmd={(day, i) => api.deleteNoteForYmd(day, i)}
          />

          <HistoryModal
            open={showHistory}
            onClose={() => setShowHistory(false)}
            items={av.history}
          />

          <DayDetailsModal
            open={detailsOpen}
            onClose={closeDetails}
            day={detailsDay}
            notes={detailsNotes}
            slots={detailsSlots}
            onDeleteSlot={(slot) => {
              confirmDelete(slot);
              if (detailsDay) {
                const updatedSlots = slotsForDay(detailsDay);
                setDetailsSlots(updatedSlots);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default TeamAvailability;
