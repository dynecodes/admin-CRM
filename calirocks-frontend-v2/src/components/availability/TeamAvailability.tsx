// src/components/availability/TeamAvailability.tsx
import * as React from "react";
import { useProviders } from "../../hooks/Providers/useProviders";
import {
  useAvailability,
  AvailabilitySlot,
} from "../../hooks/Availability/useAvailability";
import SpecificDateModal from "../../components/availability/SpecificDateModal";
import TimeOffModal from "../../components/availability/TimeOffModal";
import HistoryModal from "../../components/availability/HistoryModal";

/* -------------------------------------------------------------------------- */
/*                                   UI Bits                                  */
/* -------------------------------------------------------------------------- */

function NotePill({ text }: { text: string }) {
  return (
    <div
      className="truncate rounded-md bg-yellow-300 px-2 py-1 text-[11px] leading-4 font-medium text-gray-900"
      title={text}
    >
      {text}
    </div>
  );
}

function DayPill({
  text,
  onDelete,
  title,
}: {
  text: string;
  title?: string;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative">
      <div
        className="truncate rounded-md bg-green-600 px-2 py-1 text-[11px] leading-4 font-semibold text-white"
        title={title}
      >
        {text}
      </div>
      {onDelete && (
        <button
          aria-label="Remove availability"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0 right-0 hidden h-4 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 shadow group-hover:flex"
          title="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
const label = (iso: string) => {
  const d = new Date(iso);
  const hh = ((d.getHours() + 11) % 12) + 1;
  const mm = String(d.getMinutes()).padStart(2, "0");
  const am = d.getHours() < 12;
  return `${hh}:${mm}${am ? "AM" : "PM"}`;
};
const rangeLabel = (s: AvailabilitySlot) => `${label(s.start)}-${label(s.end)}`;

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

function TeamAvailability() {
  const { providers } = useProviders();
  const av = useAvailability();

  // provider scope
  const [providerId, setProviderId] = React.useState<number>(
    () => providers[0]?.id ?? 1,
  );
  const provider = providers.find((p) => p.id === providerId);
  const api = React.useMemo(() => av.forProvider(providerId), [av, providerId]);

  // calendar state
  const [cursor, setCursor] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [view, setView] = React.useState<"month" | "week">("month"); // (no Day view here)

  // modals
  const [showSpecific, setShowSpecific] = React.useState(false);
  const [showTimeOff, setShowTimeOff] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // navigation
  const goPrev = () => {
    if (view === "month") setCursor(addDays(startOfMonth(cursor), -1));
    else setCursor(addDays(cursor, -7));
  };
  const goNext = () => {
    if (view === "month") setCursor(addDays(endOfMonth(cursor), 1));
    else setCursor(addDays(cursor, 7));
  };
  const goToday = () => setCursor(new Date());

  // cells & ranges
  const monthCells = React.useMemo(() => {
    const mStart = startOfMonth(cursor);
    const first = addDays(mStart, -((mStart.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [cursor]);

  const weekDays = React.useMemo(() => {
    const wStart = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
  }, [cursor]);

  const slotsForDay = (d: Date) =>
    api.slotsForRange(startOfDay(d), endOfDay(d));

  const onOpenForDate = (day: Date) => {
    setSelectedDate(day);
    setShowSpecific(true);
  };
  const shiftsForYmd = (ymdStr: string) => {
    const dayStart = new Date(ymdStr + "T00:00:00");
    const dayEnd = new Date(ymdStr + "T23:59:59");

    // use actual slots for that day and turn them into "HH:mm"
    const slots = api.slotsForRange(dayStart, dayEnd);
    return slots.map((slot) => ({
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
    }));
  };
  const initialYMD = ymd(selectedDate ?? cursor);

  const confirmDelete = (slot: AvailabilitySlot) => {
    if (!window.confirm("Remove this availability?")) return;
    const d = new Date(slot.start);
    av.setOverrideForDate(providerId, ymd(d), []);
  };

  // modal handlers
  const saveSpecific = (
    startDate: string,
    endDate: string,
    shifts: { start: string; end: string }[],
    note?: string,
  ) => {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      av.setOverrideForDate(providerId, ymd(d), shifts, note);
    }
    setShowSpecific(false);
  };

  const resetSpecific = (startDate: string, endDate: string) => {
    av.resetToDefaultForRange(providerId, startDate, endDate);
    setShowSpecific(false);
  };

  const handleSaveTimeOff = (
    startDate: string,
    endDate: string,
    note?: string,
  ) => {
    av.addTimeOff(providerId, startDate, endDate, note);
    setShowTimeOff(false);
  };

  return (
    <div className="px-4 pb-6 sm:px-5">
      {/* Header (kept minimal) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Team Availability
          </h1>
          <p className="text-sm text-gray-500">
            Manage availability schedules for your service providers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={providerId}
            onChange={(e) => setProviderId(Number(e.target.value))}
          >
            {providers.map((p) => {
              const count = p.memberIds?.length ?? p.teamMembers?.length ?? 0;
              const suffix =
                count === 1 ? " (Solo)" : count > 1 ? ` (${count})` : "";
              return (
                <option key={p.id} value={p.id}>
                  {p.teamTitle}
                  {suffix}
                </option>
              );
            })}
          </select>

          <div className="flex items-center gap-2">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  view === v
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-700"
                }`}
                onClick={() => setView(v)}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
            <button
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
              onClick={goToday}
            >
              Today
            </button>
            <button
              className="rounded-md border border-gray-200 bg-white px-2 py-1"
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              className="rounded-md border border-gray-200 bg-white px-2 py-1"
              onClick={goNext}
            >
              ›
            </button>
          </div>

          <button
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
            onClick={() => setShowTimeOff(true)}
          >
            Request Time Off
          </button>
          <button
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
            onClick={() => setShowHistory(true)}
          >
            History
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {view === "month" && (
        <div className="grid grid-cols-1 gap-2 rounded-xl sm:grid-cols-7 sm:bg-gray-50 sm:p-3">
          {monthCells.map((day, idx) => {
            const inMonth = day.getMonth() === cursor.getMonth();
            const daySlots = slotsForDay(day);
            const isSelected = selectedDate && sameYMD(selectedDate, day);
            const isToday = sameYMD(day, new Date());
            const notes = api.dayInfo(day).notes ?? [];

            return (
              <button
                key={idx}
                onClick={() => onOpenForDate(day)}
                className={[
                  "rounded-lg border p-3 text-left transition",
                  "focus:ring-2 focus:ring-blue-500 focus:outline-none",
                  "min-h[72px] sm:min-h-[112px]",
                  inMonth
                    ? "border-gray-200 bg-white"
                    : "border-gray-100 bg-gray-50",
                  isSelected ? "ring-2 ring-blue-500" : "hover:border-blue-300",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      inMonth ? "text-gray-800" : "text-gray-400"
                    } ${isToday ? "font-bold text-blue-700" : ""}`}
                  >
                    {day.getDate()}
                  </span>
                  {!!daySlots.length && (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700">
                      {daySlots.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {notes.slice(0, 2).map((t, i) => (
                    <NotePill key={i} text={t} />
                  ))}
                  {notes.length > 2 && (
                    <div className="text-[11px] text-gray-600">
                      +{notes.length - 2} more
                    </div>
                  )}

                  {daySlots.map((s) => (
                    <DayPill
                      key={s.id}
                      text={rangeLabel(s)}
                      title="Click × to remove"
                      onDelete={() => confirmDelete(s)}
                    />
                  ))}

                  {notes.length === 0 && daySlots.length === 0 && (
                    <div className="text-[11px] text-gray-400 sm:hidden">
                      No availability
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* WEEK VIEW */}
      {view === "week" && (
        <div className="rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-7 sm:gap-2">
            {weekDays.map((d) => {
              const daySlots = slotsForDay(d);
              const isToday = sameYMD(d, new Date());
              const notes = api.dayInfo(d).notes ?? [];

              return (
                <button
                  key={d.toISOString()}
                  onClick={() => onOpenForDate(d)}
                  className={[
                    "rounded-lg border bg-white p-2 text-left transition",
                    "hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none",
                    "min-h-[96px] sm:min-h-[140px]",
                    isToday ? "ring-1 ring-blue-400" : "border-gray-200",
                  ].join(" ")}
                >
                  <div className="space-y-1">
                    {notes.slice(0, 2).map((t, i) => (
                      <NotePill key={i} text={t} />
                    ))}
                    {notes.length > 2 && (
                      <div className="text-[12px] text-gray-600">
                        +{notes.length - 2} more
                      </div>
                    )}

                    {daySlots.length === 0 && notes.length === 0 && (
                      <div className="text-[12px] text-gray-400">
                        No availability
                      </div>
                    )}

                    {daySlots.map((s) => (
                      <DayPill
                        key={s.id}
                        text={rangeLabel(s)}
                        title="Click × to remove"
                        onDelete={() => confirmDelete(s)}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {provider && (
        <>
          <SpecificDateModal
            open={showSpecific}
            onClose={() => setShowSpecific(false)}
            onSave={saveSpecific}
            onReset={resetSpecific}
            initialDate={initialYMD}
            // pre-fill shifts when opening, based on the selected day
            initialShifts={
              selectedDate
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
            // notes API (per YMD), same style as TimeOffModal
            getNotesForYmd={(day) => api.noteListForYmd(day)}
            addNoteForYmd={(day, text) => api.addNoteForYmd(day, text)}
            updateNoteForYmd={(day, i, text) =>
              api.updateNoteForYmd(day, i, text)
            }
            deleteNoteForYmd={(day, i) => api.deleteNoteForYmd(day, i)}
            // shifts API for when the user changes the date inside the modal
            getShiftsForYmd={shiftsForYmd}
          />

          <TimeOffModal
            open={showTimeOff}
            onClose={() => setShowTimeOff(false)}
            onSave={handleSaveTimeOff}
            providerLabel={provider?.teamTitle ?? ""}
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
        </>
      )}
    </div>
  );
}

export default TeamAvailability;
