// src/components/availability/SpecificDateModal.tsx
import * as React from "react";
import { Modal, Button, Label } from "flowbite-react";
import type { Shift } from "../../hooks/Availability/useAvailability";
import { useDraggableModal } from "../../hooks/useDraggableModal";
import DatePicker from "../ui/DatePicker";
import TimeDrop from "../ui/TimeDrop";
import AutoGrowTextarea from "../ui/AutoGrowTextarea";

/* ---------- Types ---------- */
export type AvailabilityNote = { id: string | number; text: string };

type Props = {
  open: boolean;
  onClose: () => void;

  // Persist date range + shifts
  onSave: (
    startDate: string,
    endDate: string,
    shifts: Shift[],
    note?: string,
  ) => void;

  // Reset to default availability for the range
  onReset: (startDate: string, endDate: string) => void;

  // Initial cursor date "YYYY-MM-DD"
  initialDate: string;

  // Optional initial shifts for the first load (when opening)
  initialShifts?: Shift[];

  // Booking conflict badge
  getBookingConflicts?: (startDate: string, endDate: string) => number;

  // Notes APIs (per YMD – same style as TimeOffModal)
  getNotesForYmd: (ymd: string) => string[];
  addNoteForYmd: (ymd: string, text: string) => void | Promise<void>;
  updateNoteForYmd: (
    ymd: string,
    index: number,
    text: string,
  ) => void | Promise<void>;
  deleteNoteForYmd: (ymd: string, index: number) => void | Promise<void>;

  // 🔹 Shifts API per YMD – to show shifts for the selected date
  getShiftsForYmd?: (ymd: string) => Shift[]; // optional
};

/* ---------- Date helpers ---------- */
function toYMD(d: Date | null | undefined): string | null {
  if (!d) return null;
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function fromYMD(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

/* ---------- Small helpers ---------- */

function replaceAt<T>(arr: T[], index: number, value: T) {
  return arr.map((item, i) => (i === index ? value : item));
}
function removeAt<T>(arr: T[], index: number) {
  return arr.filter((_, i) => i !== index);
}

// Format day of week
function formatDayOfWeek(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

/* ---------- Shift row ---------- */
const ShiftRow = React.memo(function ShiftRow({
  shift,
  date,
  onChange,
  onRemove,
}: {
  shift: Shift;
  date: Date;
  onChange: (s: Shift) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
      {/* Day label (1st column) */}
      <div className="text-sm font-medium text-gray-600">
        {formatDayOfWeek(date)}{" "}
        {date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      {/* Time inputs (2nd column) */}
      <div className="flex flex-wrap items-center gap-5">
        <TimeDrop
          id="shift_start"
          name="shift_start"
          value={shift.start}
          onChange={(v) => onChange({ ...shift, start: v })}
          minuteStep={5}
          className="flex min-w-[20px] flex-1"
          inputClassName="w-full rounded border border-gray-300  bg-white px-1 py-2 text-sm"
        />

        <TimeDrop
          id="shift_end"
          name="shift_end"
          value={shift.end}
          onChange={(v) => onChange({ ...shift, end: v })}
          minuteStep={5}
          className="min-w-[50px] flex-1"
          inputClassName="w-full rounded border border-gray-300 bg-white px-1 py-2 text-sm"
        />
      </div>

      {/* Remove button (3rd column) */}
      <div className="flex justify-end sm:justify-center">
        <Button
          color="failure"
          size="xs"
          onClick={onRemove}
          aria-label="Remove shift"
        >
          ✕
        </Button>
      </div>
    </div>
  );
});

/* ---------- Component ---------- */
function SpecificDateModal({
  open,
  onClose,
  onSave,
  onReset,
  initialDate,
  initialShifts,
  getBookingConflicts,
  getNotesForYmd,
  addNoteForYmd,
  updateNoteForYmd,
  deleteNoteForYmd,
  getShiftsForYmd,
}: Props) {
  useDraggableModal(open);

  const [startDate, setStartDate] = React.useState(initialDate);
  const [endDate, setEndDate] = React.useState(initialDate);

  // 👉 start as empty; we load from API / fallback
  const [shifts, setShifts] = React.useState<Shift[]>([]);

  // Notes state
  const [notes, setNotes] = React.useState<AvailabilityNote[]>([]);
  const [editingId, setEditingId] = React.useState<
    AvailabilityNote["id"] | "new"
  >("new");
  const [draft, setDraft] = React.useState("");
  const [showNoteSuccess, setShowNoteSuccess] = React.useState(false);

  /* ----- Note loader (same idea as TimeOffModal) ----- */
  const getNotesRef = React.useRef(getNotesForYmd);
  React.useEffect(() => {
    getNotesRef.current = getNotesForYmd;
  }, [getNotesForYmd]);

  const loadNotes = React.useCallback((ymd: string) => {
    const arr = getNotesRef.current(ymd) ?? [];
    setNotes(arr.map((t, i) => ({ id: i, text: t })));
  }, []);

  /* ----- Shift loader per date ----- */
  const getShiftsRef = React.useRef(getShiftsForYmd);
  React.useEffect(() => {
    getShiftsRef.current = getShiftsForYmd;
  }, [getShiftsForYmd]);

  const loadShifts = React.useCallback((ymd: string, fallback?: Shift[]) => {
    try {
      const apiFn = getShiftsRef.current;
      const apiShifts: Shift[] = apiFn ? (apiFn(ymd) ?? []) : [];

      if (apiShifts.length > 0) {
        setShifts(apiShifts);
        return;
      }

      if (fallback && fallback.length > 0) {
        setShifts(fallback);
        return;
      }

      // 🚫 no shifts for this date – treat as "Off"
      setShifts([]);
    } catch {
      // In case getShiftsForYmd throws, don't break the modal
      if (fallback && fallback.length > 0) setShifts(fallback);
      else setShifts([]);
    }
  }, []);

  /* ----- Open / initial load ----- */
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setStartDate(initialDate);
      setEndDate(initialDate);
      setEditingId("new");
      setDraft("");
      setShowNoteSuccess(false);

      loadNotes(initialDate);
      loadShifts(initialDate, initialShifts);
    }
    wasOpen.current = open;
  }, [open, initialDate, initialShifts, loadNotes, loadShifts]);

  /* ----- When date changes inside modal: reload notes + shifts for that day ----- */
  React.useEffect(() => {
    if (!open) return;
    loadNotes(startDate);
    loadShifts(startDate);
    setEditingId("new");
    setDraft("");
  }, [startDate, open, loadNotes, loadShifts]);

  const conflicts = getBookingConflicts?.(startDate, endDate) ?? 0;

  /* ----- Notes: Edit/Delete ----- */
  const beginEdit = (n: AvailabilityNote) => {
    setEditingId(n.id);
    setDraft(n.text);
  };

  const deleteNote = async (id: AvailabilityNote["id"]) => {
    await deleteNoteForYmd(startDate, Number(id));

    if (editingId === id) {
      setEditingId("new");
      setDraft("");
    }

    setShowNoteSuccess(true);
    setTimeout(() => setShowNoteSuccess(false), 1500);
    loadNotes(startDate);
  };
  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  // Save everything (shifts + note) from the footer button
  const handleModalSave = async () => {
    const text = draft.trim();

    // ----- handle notes first -----
    if (text) {
      if (editingId === "new") {
        await addNoteForYmd(startDate, text);
      } else {
        await updateNoteForYmd(startDate, Number(editingId), text);
      }

      setShowNoteSuccess(true);
      setTimeout(() => setShowNoteSuccess(false), 2000);
      loadNotes(startDate);
    }

    // reset editor
    setDraft("");
    setEditingId("new");

    // ----- clean & validate shifts -----
    const validShifts = shifts.filter(
      (s) => s.start && s.end && timeToMinutes(s.start) < timeToMinutes(s.end), // end must be after start
    );

    // Optional: warn if nothing valid
    if (shifts.length > 0 && validShifts.length === 0) {
      alert("Shift end time must be later than start time.");
      return; // don't save if everything is invalid
    }

    // This will turn the day ON again if there is at least one valid shift,
    // or OFF if validShifts is empty (like Launch27)
    onSave(startDate, endDate, validShifts);
  };
  // Get the date for shift display
  const shiftDate = fromYMD(startDate) || new Date();
  function formatYMDPretty(ymd: string | null | undefined): string {
    const d = fromYMD(ymd ?? null);
    if (!d) return ymd ?? "";
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  return (
    <Modal show={open} size="3xl" dismissible onClose={onClose}>
      <div className="relative rounded-md bg-white shadow-xl ring-1 ring-gray-200">
        {/* success banner */}
        {showNoteSuccess && (
          <div className="mx-6 mt-4 rounded-md bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
            Availability note successfully saved!
          </div>
        )}

        {/* Header */}
        <div className="modal-drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 px-6 py-4 select-none active:cursor-grabbing">
          <h3 className="pointer-events-none text-lg font-semibold text-gray-900">
            Change Availability for {formatYMDPretty(startDate)} -{" "}
            {formatYMDPretty(endDate)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Dates */}
          <div>
            <Label className="mb-1 block text-sm font-medium text-gray-900">
              Date(s)
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <DatePicker
                value={fromYMD(startDate)}
                onChange={(v: Date | null) => {
                  const next = toYMD(v) ?? startDate;
                  setStartDate(next);
                  if (endDate && next && endDate < next) setEndDate(next);
                }}
                placeholder="Start (MM/DD/YYYY)"
              />
              <div className="hidden items-center justify-center text-gray-500 select-none sm:flex">
                &ndash;
              </div>
              <DatePicker
                value={fromYMD(endDate)}
                onChange={(v: Date | null) => setEndDate(toYMD(v) ?? startDate)}
                placeholder="End (MM/DD/YYYY)"
              />
            </div>
          </div>

          {/* Shifts */}
          <div>
            <Label>Shift(s)</Label>
            <div className="mt-2 space-y-2">
              {shifts.length === 0 && (
                <div className="text-xs text-gray-500">
                  No shifts for this date.
                </div>
              )}

              {shifts.map((s, i) => (
                <ShiftRow
                  key={i}
                  shift={s}
                  date={shiftDate}
                  onChange={(ns) => setShifts(replaceAt(shifts, i, ns))}
                  onRemove={() => setShifts(removeAt(shifts, i))}
                />
              ))}

              <Button
                size="sm"
                color="gray"
                onClick={() =>
                  setShifts(
                    (prev) =>
                      prev.length > 0
                        ? [...prev, { ...prev[prev.length - 1] }] // clone last shift
                        : [...prev, { start: "", end: "" }], // first shift: blank
                  )
                }
                className="cursor-pointer"
              >
                Add Shift
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 bg-white">
            <Label>Notes</Label>

            {/* existing notes with Edit/Delete */}
            <div className="space-y-1">
              {notes.map((n) => {
                const isEditing = editingId === n.id;
                return (
                  <div key={n.id}>
                    <div
                      className={`text-sm leading-relaxed font-semibold whitespace-pre-line ${
                        isEditing ? "text-red-600" : "text-gray-800"
                      } max-h-[3 rem] overflow-hidden`}
                      title={n.text}
                    >
                      {n.text}
                    </div>

                    <div className="mt-1 flex gap-4 text-sm">
                      <button
                        className="cursor-pointer text-gray-600 hover:underline"
                        onClick={() => beginEdit(n)}
                      >
                        Edit
                      </button>
                      <button
                        className="cursor-pointer text-gray-600 hover:underline"
                        onClick={() => deleteNote(n.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* composer (always visible) */}
            <div className="mt-2">
              <AutoGrowTextarea
                maxRows={5}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Enter a note"
                className="border border-gray-300 bg-white !text-gray-900 focus:!border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Booking status chip */}
          <div
            className={`inline-block rounded px-3 py-2 text-sm ${
              conflicts
                ? "bg-red-100 text-red-700"
                : "bg-cyan-100 text-cyan-700"
            }`}
          >
            {conflicts
              ? `${conflicts} booking(s) conflict in this range`
              : `No Bookings assigned to this team from ${startDate} to ${endDate}`}
          </div>

          <Button
            color="light"
            onClick={() => onReset(startDate, endDate)}
            className="cursor-pointer"
          >
            Reset To Default Availability
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <Button color="light" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            color="gray"
            onClick={handleModalSave}
            className="cursor-pointer"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SpecificDateModal;
