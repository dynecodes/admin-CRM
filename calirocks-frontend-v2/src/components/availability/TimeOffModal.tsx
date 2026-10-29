// src/components/availability/TimeOffModal.tsx
import * as React from "react";
import { Modal, Button, Label, Textarea } from "flowbite-react";
import { useDraggableModal } from "../../hooks/useDraggableModal";
import DatePicker from "../ui/DatePicker";

/* -------------------------------------------------------------------------- */
/*                                Date Helpers                                */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AvailabilityNote = { id: string | number; text: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string, note?: string) => void;
  initialDate: string; // YYYY-MM-DD
  providerLabel: string;
  getBookingConflicts?: (startDate: string, endDate: string) => number;

  // Note APIs
  getNotesForYmd: (ymd: string) => string[];
  addNoteForYmd: (ymd: string, text: string) => void | Promise<void>;
  updateNoteForYmd: (
    ymd: string,
    index: number,
    text: string,
  ) => void | Promise<void>;
  deleteNoteForYmd: (ymd: string, index: number) => void | Promise<void>;
};

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

function TimeOffModal({
  open,
  onClose,
  onSave,
  initialDate,
  providerLabel,
  getBookingConflicts,
  getNotesForYmd,
  addNoteForYmd,
  updateNoteForYmd,
  deleteNoteForYmd,
}: Props) {
  useDraggableModal(open);

  // ─── State ───────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = React.useState(initialDate);
  const [endDate, setEndDate] = React.useState(initialDate);
  const [notes, setNotes] = React.useState<AvailabilityNote[]>([]);
  const [editingId, setEditingId] = React.useState<
    AvailabilityNote["id"] | "new"
  >("new");
  const [draft, setDraft] = React.useState("");
  const [showNoteSuccess, setShowNoteSuccess] = React.useState(false);

  // ─── Note Loader ─────────────────────────────────────────────────────────
  const getNotesRef = React.useRef(getNotesForYmd);
  React.useEffect(() => {
    getNotesRef.current = getNotesForYmd;
  }, [getNotesForYmd]);

  const loadNotes = React.useCallback((ymd: string) => {
    const arr = getNotesRef.current(ymd) ?? [];
    setNotes(arr.map((t, i) => ({ id: i, text: t })));
  }, []);

  // ─── Open / Date Watchers ────────────────────────────────────────────────
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setStartDate(initialDate);
      setEndDate(initialDate);
      setEditingId("new");
      setDraft("");
      setShowNoteSuccess(false);
      loadNotes(initialDate);
    }
    wasOpen.current = open;
  }, [open, initialDate, loadNotes]);

  React.useEffect(() => {
    if (!open) return;
    loadNotes(startDate);
    setEditingId("new");
    setDraft("");
  }, [startDate, open, loadNotes]);

  const conflicts = getBookingConflicts?.(startDate, endDate) ?? 0;

  // ─── Note Actions (same pattern as SpecificDateModal) ────────────────────
  const beginEdit = (n: AvailabilityNote) => {
    setEditingId(n.id);
    setDraft(n.text);
  };

  const deleteNote = async (id: AvailabilityNote["id"]) => {
    await deleteNoteForYmd(startDate, Number(id));

    // if we were editing this note, reset the editor
    if (editingId === id) {
      setEditingId("new");
      setDraft("");
    }

    setShowNoteSuccess(true);
    setTimeout(() => setShowNoteSuccess(false), 1500);
    loadNotes(startDate);
  };

  const handleModalSave = async () => {
    const text = draft.trim();

    // handle note create/update first
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

    // reset editor state
    setDraft("");
    setEditingId("new");

    // then save the time-off range (and latest note text)
    onSave(startDate, endDate);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Modal show={open} size="3xl" dismissible onClose={onClose}>
      <div className="relative rounded-md bg-white shadow-xl ring-1 ring-gray-200">
        {showNoteSuccess && (
          <div className="mx-6 mt-4 rounded-md bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
            Availability note successfully saved!
          </div>
        )}

        {/* Header */}
        <div className="modal-drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 px-6 py-4 select-none active:cursor-grabbing">
          <h3 className="pointer-events-none text-lg font-semibold text-gray-900">
            {`Request Time Off${providerLabel ? ` for ${providerLabel}` : ""}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
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
                onChange={(v) => {
                  const next = toYMD(v) ?? startDate;
                  setStartDate(next);
                  if (endDate && next && endDate < next) setEndDate(next);
                }}
              />
              <div className="hidden items-center justify-center text-gray-500 select-none sm:flex">
                &ndash;
              </div>
              <DatePicker
                value={fromYMD(endDate)}
                onChange={(v) => setEndDate(toYMD(v) ?? startDate)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <div className="space-y-1">
              {notes.map((n) => (
                <div key={n.id}>
                  <div
                    className={`font-semibold ${
                      editingId === n.id ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {n.text}
                  </div>
                  <div className="mt-1 flex gap-4 text-sm">
                    <button
                      className="text-gray-600 hover:underline"
                      onClick={() => beginEdit(n)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-gray-600 hover:underline"
                      onClick={() => deleteNote(n.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <Textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Enter a note"
                className="border border-gray-300 bg-white !text-gray-900 focus:!border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Booking Status */}
          <div
            className={`inline-block rounded px-2 py-1 text-xs ${
              conflicts
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {conflicts
              ? `${conflicts} booking(s) conflict in this range`
              : `No Bookings assigned to this team from ${startDate} to ${endDate}`}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <Button
            color="light"
            onClick={onClose}
            type="button"
            className="w-full cursor-pointer sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            color="gray"
            onClick={handleModalSave}
            disabled={!!conflicts}
            type="button"
            className="w-full cursor-pointer sm:w-auto"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* Export*/
export default TimeOffModal;
