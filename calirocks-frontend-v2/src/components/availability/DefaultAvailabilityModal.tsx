// src/components/availability/DefaultAvailabilityModal.tsx
import * as React from "react";
import { Modal, Button, Checkbox } from "flowbite-react";
import type { Shift, Weekday } from "../../hooks/Availability/useAvailability";
import TimeDrop from "../ui/TimeDrop";
import { useDraggableModal } from "../../hooks/useDraggableModal"; // ← NEW

/* ---------- constants ---------- */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as Weekday[];
const DEFAULT_SHIFT: Shift = { start: "08:00", end: "17:00" };

/* ---------- small helpers ---------- */
function replaceAt<T>(arr: T[], index: number, value: T) {
  return arr.map((item, i) => (i === index ? value : item));
}
function removeAt<T>(arr: T[], index: number) {
  return arr.filter((_, i) => i !== index);
}

/* ---------- row for a single shift (responsive) ---------- */
function ShiftRow({
  shift,
  onChange,
  onRemove,
}: {
  shift: Shift;
  onChange: (s: Shift) => void;
  onRemove: () => void;
}) {
  const handleStart = (v: string) => onChange({ ...shift, start: v });
  const handleEnd = (v: string) => onChange({ ...shift, end: v });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <TimeDrop
          id="shift_start"
          name="shift_start"
          value={shift.start}
          onChange={handleStart}
          minuteStep={5}
          className="w-full sm:w-44 md:w-32 lg:w-32"
          inputClassName="w-full text-sm border-[1.5px] border-gray-300 rounded-md px-1 py-1 text-left leading-tight focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <span className="hidden text-gray-600 sm:inline">–</span>
        <TimeDrop
          id="shift_end"
          name="shift_end"
          value={shift.end}
          onChange={handleEnd}
          minuteStep={5}
          className="w-full sm:w-44 md:w-32 lg:w-32"
          inputClassName="w-full text-sm border-[1.5px] border-gray-300 rounded-md px-1 py-1 text-left leading-tight focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <Button
        color="failure"
        size="xs"
        onClick={onRemove}
        aria-label="Remove shift"
        className="mr-20 self-start sm:self-auto cursor-pointer"
      >
        ✕
      </Button>
    </div>
  );
}

/* ---------- “Apply to …” popover ---------- */
function ApplyToMenu({
  anchorDay,
  selectedDays,
  onToggleDay,
  onToggleAll,
  onCancel,
  onApply,
}: {
  anchorDay: Weekday;
  selectedDays: Set<Weekday>;
  onToggleDay: (d: Weekday) => void;
  onToggleAll: (checked: boolean) => void;
  onCancel: () => void;
  onApply: (from: Weekday, to: Weekday[]) => void;
}) {
  const allChecked = DAY_NAMES.every((_, i) => selectedDays.has(i as Weekday));

  return (
    <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-xs rounded-md border border-gray-200 bg-white p-2 shadow-lg sm:right-0 sm:left-auto sm:w-36 sm:max-w-none">
      <label className="mb-1 flex items-center gap-2 text-sm text-gray-600">
        <Checkbox
          color="gray"
          className="ml-1 rounded-sm border-gray-300 cursor-pointer"
          checked={allChecked}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
        <span>All</span>
      </label>

      <div className="max-h-48 space-y-1 overflow-auto border-t border-gray-200 py-3 pr-1">
        {DAY_NAMES.map((label, idx) => {
          const d = idx as Weekday;
          return (
            <label key={d} className="ml-1 flex items-center gap-3 text-sm">
              <Checkbox
                color="gray"
                className="rounded-sm cursor-pointer"
                checked={selectedDays.has(d)}
                onChange={() => onToggleDay(d)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-2 flex justify-end gap-2 ">
        <Button size="xs" className="cursor-pointer" color="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="xs" color="gray" className="cursor-pointer" onClick={() => onApply(anchorDay, Array.from(selectedDays.values()))}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function DayEditorRow({
  day,
  name,
  shifts,
  setShifts,
  onOpenApply,
  isApplyOpen,
  selectedDays,
  onToggleDay,
  onToggleAll,
  onCancelApply,
  onApply,
}: {
  day: Weekday;
  name: string;
  shifts: Shift[];
  setShifts: (d: Weekday, s: Shift[]) => void;
  onOpenApply: (d: Weekday) => void;
  isApplyOpen: boolean;
  selectedDays: Set<Weekday>;
  onToggleDay: (d: Weekday) => void;
  onToggleAll: (checked: boolean) => void;
  onCancelApply: () => void;
  onApply: (from: Weekday, to: Weekday[]) => void;
}) {
  const addShift = () => setShifts(day, [...shifts, DEFAULT_SHIFT]);
  const updateShift = (index: number, value: Shift) =>
    setShifts(day, replaceAt(shifts, index, value));
  const removeShift = (index: number) =>
    setShifts(day, removeAt(shifts, index));

  return (
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-1">
      <div className="font-semibold">{name}</div>

      <div className="space-y-2">
        {shifts.length === 0 && (
          <div className="text-sm text-gray-500">Off</div>
        )}
        {shifts.map((s, i) => (
          <ShiftRow
            key={`${day}-${i}`}
            shift={s}
            onChange={(ns) => updateShift(i, ns)}
            onRemove={() => removeShift(i)}
          />
        ))}
        <Button
          size="xs"
          color="light"
          onClick={addShift}
          className="w-full sm:w-auto cursor-pointer"
        >
          + Add Shift
        </Button>
      </div>

      {/* Button + menu container */}
      <div className="relative">
        <Button
          size="xs"
          color="light"
          
          onClick={() => onOpenApply(day)}
          className="w-full sm:w-auto cursor-pointer"
        >
          Apply to…
        </Button>

        {isApplyOpen && (
          <ApplyToMenu
            anchorDay={day}
            selectedDays={selectedDays}
            onToggleDay={onToggleDay}
            onToggleAll={onToggleAll}
            onCancel={onCancelApply}
            onApply={onApply}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
function DefaultAvailabilityModal({
  open,
  onClose,
  getShifts,
  setShifts,
  applyFromTo,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  getShifts: (d: Weekday) => Shift[];
  setShifts: (d: Weekday, s: Shift[]) => void;
  applyFromTo: (from: Weekday, to: Weekday[]) => void;
  onSave: (draft: Record<Weekday, Shift[]>) => void;
}) {
  const [applyOpenFor, setApplyOpenFor] = React.useState<Weekday | null>(null);
  const [applySelection, setApplySelection] = React.useState<Set<Weekday>>(
    new Set(),
  );

  // 🔹 Make the modal draggable (desktop + mobile)
  useDraggableModal(open);
  const collectDraft = React.useCallback(() => {
    const draft = {} as Record<Weekday, Shift[]>;
    WEEKDAYS.forEach((d) => (draft[d] = getShifts(d)));
    return draft;
  }, [getShifts]);

  const openApply = (day: Weekday) => {
    setApplyOpenFor((prev) => (prev === day ? null : day));
    setApplySelection(new Set());
  };

  const toggleDay = (d: Weekday) =>
    setApplySelection((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setApplySelection(checked ? new Set(WEEKDAYS) : new Set());

  const applyAndClose = (from: Weekday, to: Weekday[]) => {
    applyFromTo(from, to);
    setApplyOpenFor(null);
    setApplySelection(new Set());
  };

  return (
    <Modal show={open} size="2xl" onClose={onClose} dismissible>
      {/* Drag handle header */}
      <div className="relative rounded-md bg-white shadow-xl ring-1 ring-gray-200">
        <div className="modal-drag-handle cursor-grab border-b border-gray-200 px-6 py-4 select-none active:cursor-grabbing">
          <h3 className="text-lg font-semibold">
            Change your Default Availability
          </h3>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-3">
            {WEEKDAYS.map((day) => {
              const shifts = getShifts(day);
              return (
                <DayEditorRow
                  key={day}
                  day={day}
                  name={DAY_NAMES[day]}
                  shifts={shifts}
                  setShifts={setShifts}
                  onOpenApply={openApply}
                  isApplyOpen={applyOpenFor === day}
                  selectedDays={applySelection}
                  onToggleDay={toggleDay}
                  onToggleAll={toggleAll}
                  onCancelApply={() => setApplyOpenFor(null)}
                  onApply={applyAndClose}
                />
              );
            })}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-4 sm:px-6">
          <Button
            color="light"
            onClick={onClose}
            className="w-full cursor-pointer sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            color="gray"
            onClick={() => {
              onSave(collectDraft());
              onClose();
            }}
            className="w-full cursor-pointer sm:w-auto"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DefaultAvailabilityModal;
