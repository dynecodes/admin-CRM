// src/hooks/Availability/useAvailability.ts
import * as React from "react";

/* ───────── Types ───────── */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun..Sat

export type Shift = {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

export type DefaultAvailability = Record<Weekday, Shift[]>;

export type DateISO = string; // "YYYY-MM-DD"

export type OverrideEntry = {
  id: string;
  providerId: number;
  date: DateISO; // applies to *this* day
  shifts: Shift[]; // replaces default for this date
  note?: string; // legacy single-note (kept for compatibility)
};

export type TimeOffEntry = {
  id: string;
  providerId: number;
  startDate: DateISO;
  endDate: DateISO;
  note?: string;
};

export type HistoryEntry = {
  id: string;
  who: string; // “Dyne S”
  what: string; // “Added Day off: Sun” or “Changed default Thu 7:00AM–3:45PM”
  whenIso: string;
  ip?: string;
};

export type AvailabilitySlot = {
  id: string;
  providerId: number;
  start: string; // ISO datetime
  end: string; // ISO datetime
  note?: string; // optional note (first note of the day or override note)
};

/* ───────── Utils ───────── */

const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date): DateISO =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const timeToDate = (day: Date, t: string) => {
  const [hh, mm] = t.split(":").map(Number);
  const d = new Date(day);
  d.setHours(hh, mm, 0, 0);
  return d;
};

const within = (d: Date, s: Date, e: Date) => d >= s && d <= e;

const id = (p = "") =>
  `${p}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const eachDayInclusive = (startYmd: DateISO, endYmd: DateISO) => {
  const out: DateISO[] = [];
  const s = new Date(startYmd + "T00:00:00");
  const e = new Date(endYmd + "T00:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(toYMD(d));
  }
  return out;
};

/* default seed: everything Off, except Thu 7:00–3:45 like your screenshot */
const seedDefault: DefaultAvailability = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [{ start: "07:00", end: "15:45" }], // Thu
  5: [],
  6: [],
};

/* ───────── Hook ───────── */

export function useAvailability() {
  const [defaults, setDefaults] = React.useState<DefaultAvailability>(
    () => seedDefault,
  );
  const [overrides, setOverrides] = React.useState<OverrideEntry[]>([]);
  const [timeOff, setTimeOff] = React.useState<TimeOffEntry[]>([]);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);

  // 🔸 Multi-note store: providerId -> ymd -> string[]
  const [dayNotes, setDayNotes] = React.useState<
    Record<number, Record<DateISO, string[]>>
  >({});

  /* ——— Notes helpers ——— */

  const addNoteForDate = (providerId: number, date: DateISO, text: string) => {
    const t = (text ?? "").trim();
    if (!t) return;
    setDayNotes((prev) => {
      const p = { ...(prev[providerId] ?? {}) };
      const arr = p[date] ? [...p[date]] : [];
      // NEW: put newest note FIRST (matches legacy UI where "loop" shows above "poo")
      arr.unshift(t);
      p[date] = arr;
      return { ...prev, [providerId]: p };
    });
  };

  const updateNoteForDate = (
    providerId: number,
    date: DateISO,
    index: number,
    text: string,
  ) => {
    setDayNotes((prev) => {
      const p = { ...(prev[providerId] ?? {}) };
      const arr = [...(p[date] ?? [])];
      if (index >= 0 && index < arr.length) {
        arr[index] = text;
        p[date] = arr;
      }
      return { ...prev, [providerId]: p };
    });
  };

  const deleteNoteForDate = (
    providerId: number,
    date: DateISO,
    index: number,
  ) => {
    setDayNotes((prev) => {
      const p = { ...(prev[providerId] ?? {}) };
      const arr = [...(p[date] ?? [])];
      if (index >= 0 && index < arr.length) {
        arr.splice(index, 1);
        if (arr.length) p[date] = arr;
        else delete p[date];
      }
      return { ...prev, [providerId]: p };
    });
  };

  const getNotesForDate = (providerId: number, date: DateISO): string[] =>
    dayNotes[providerId]?.[date] ?? [];

  const clearNotesInRange = (
    providerId: number,
    startDate: DateISO,
    endDate: DateISO,
  ) => {
    setDayNotes((prev) => {
      const p = { ...(prev[providerId] ?? {}) };
      for (const y of eachDayInclusive(startDate, endDate)) delete p[y];
      return { ...prev, [providerId]: p };
    });
  };

  /* ——— History helper ——— */
  const addHistory = (
    what: string,
    who = "Dyne S",
    ip = "2001:4456:1e3:2100:easf:aa23:b42d:9504",
  ) =>
    setHistory((h) => [
      { id: id("h_"), who, what, whenIso: new Date().toISOString(), ip },
      ...h,
    ]);

  /* ——— Default Availability API ——— */

  const setDefaultForDay = (day: Weekday, shifts: Shift[]) => {
    setDefaults((prev) => ({ ...prev, [day]: shifts }));
    const label = shifts.length
      ? shifts.map((s) => `${s.start}-${s.end}`).join(", ")
      : "Off";
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
    addHistory(`Changed default ${dayName}: ${label}`);
  };

  const addDefaultShift = (day: Weekday, shift: Shift) =>
    setDefaultForDay(day, [...defaults[day], shift]);

  const removeDefaultShift = (day: Weekday, idx: number) =>
    setDefaultForDay(
      day,
      defaults[day].filter((_, i) => i !== idx),
    );

  const applyDefaultTo = (sourceDay: Weekday, targetDays: Weekday[]) => {
    targetDays.forEach((d) => setDefaultForDay(d, [...defaults[sourceDay]]));
    const from = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][sourceDay];
    const to = targetDays
      .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
      .join(", ");
    addHistory(`Applied default from ${from} to: ${to}`);
  };

  /* ——— Overrides (“Specific Date”) ——— */

  const setOverrideForDate = (
    providerId: number,
    date: DateISO,
    shifts: Shift[],
    note?: string,
  ) => {
    setOverrides((prev) => {
      const exists = prev.find(
        (o) => o.providerId === providerId && o.date === date,
      );
      if (exists) {
        exists.shifts = shifts;
        exists.note = note ?? exists.note; // legacy compatibility
        return [...prev];
      }
      return [...prev, { id: id("ov_"), providerId, date, shifts, note }];
    });

    if (note && note.trim()) addNoteForDate(providerId, date, note);

    const label = shifts.length
      ? shifts.map((s) => `${s.start}-${s.end}`).join(", ")
      : "Off";
    addHistory(`Changed availability ${date}: ${label}`);
  };

  const resetToDefaultForRange = (
    providerId: number,
    startDate: DateISO,
    endDate: DateISO,
  ) => {
    setOverrides((prev) =>
      prev.filter((o) => {
        if (o.providerId !== providerId) return true;
        return o.date < startDate || o.date > endDate;
      }),
    );
    clearNotesInRange(providerId, startDate, endDate);
    addHistory(`Reset to default (${startDate} to ${endDate})`);
  };

  /* ——— Time Off ——— */

  // inside useAvailability()

  const addTimeOff = (
    providerId: number,
    startDate: DateISO,
    endDate: DateISO,
    note?: string,
  ) => {
    // 1) save the time-off range
    setTimeOff((t) => [
      ...t,
      { id: id("off_"), providerId, startDate, endDate, note },
    ]);

    // 2) optional: attach the note to every day (newest first, per earlier change)
    if (note && note.trim()) {
      for (const y of eachDayInclusive(startDate, endDate)) {
        addNoteForDate(providerId, y, note);
      }
    }

    // 3a) proactively clear any existing overrides in that range
    setOverrides((prev) =>
      prev.filter(
        (o) =>
          o.providerId !== providerId || o.date < startDate || o.date > endDate,
      ),
    );

    // 3b) and write an explicit empty override per day (guarantees no chips)
    for (const y of eachDayInclusive(startDate, endDate)) {
      // this replaces whatever the default/override was with "no shifts"
      // and makes the calendar update immediately
      setOverrideForDate(providerId, y, []);
    }

    addHistory(
      `Added Day off: ${
        startDate === endDate ? startDate : `${startDate} to ${endDate}`
      }`,
    );
  };

  /* ——— Computed slots for calendar ——— */

  const forProvider = (providerId: number) => ({
    /** Calendar asks for “slots” to paint for a whole month/week/day window */
    slotsForRange(start: Date, end: Date): AvailabilitySlot[] {
      const out: AvailabilitySlot[] = [];
      const d = new Date(start);
      d.setHours(0, 0, 0, 0);
      while (d <= end) {
        const ymd = toYMD(d);

        const ov = overrides.find(
          (o) => o.providerId === providerId && o.date === ymd,
        );
        const base = ov ? ov.shifts : defaults[d.getDay() as Weekday];
        const dayNoteList = getNotesForDate(providerId, ymd);
        const firstNote = dayNoteList[0] ?? ov?.note ?? undefined;

        base.forEach((s, i) => {
          const startDt = timeToDate(d, s.start);
          const endDt = timeToDate(d, s.end);
          if (endDt > startDt) {
            out.push({
              id: `slot_${ymd}_${i}_${s.start}_${s.end}`,
              providerId,
              start: startDt.toISOString(),
              end: endDt.toISOString(),
              note: firstNote,
            });
          }
        });

        d.setDate(d.getDate() + 1);
      }
      return out;
    },

    /** Extra info the UI may want for a single day */
    dayInfo(day: Date) {
      const ymd = toYMD(day);
      const ov = overrides.find(
        (o) => o.providerId === providerId && o.date === ymd,
      );
      const off = timeOff.find(
        (t) =>
          t.providerId === providerId &&
          within(
            day,
            new Date(t.startDate + "T00:00:00"),
            new Date(t.endDate + "T23:59:59"),
          ),
      );
      const notesArr = getNotesForDate(providerId, ymd);
      const note = notesArr[0] ?? ov?.note ?? (off ? off.note : undefined);
      return { override: ov, dayOff: off, note, notes: notesArr };
    },

    /** Notes (provider-scoped) */
    noteListForYmd: (day: DateISO) => getNotesForDate(providerId, day),
    addNoteForYmd: (day: DateISO, text: string) =>
      addNoteForDate(providerId, day, text),
    updateNoteForYmd: (day: DateISO, index: number, text: string) =>
      updateNoteForDate(providerId, day, index, text),
    deleteNoteForYmd: (day: DateISO, index: number) =>
      deleteNoteForDate(providerId, day, index),

    clearNotesInRange: (startYmd: DateISO, endYmd: DateISO) =>
      clearNotesInRange(providerId, startYmd, endYmd),
  });

  return {
    defaults,
    overrides,
    timeOff,
    history,

    // defaults
    setDefaultForDay,
    addDefaultShift,
    removeDefaultShift,
    applyDefaultTo,

    // overrides
    setOverrideForDate,
    resetToDefaultForRange,

    // time off
    addTimeOff,

    // notes (global helpers)
    addNoteForDate,
    updateNoteForDate,
    deleteNoteForDate,
    getNotesForDate,
    clearNotesInRange,

    // computed / provider API
    forProvider,
  };
}
