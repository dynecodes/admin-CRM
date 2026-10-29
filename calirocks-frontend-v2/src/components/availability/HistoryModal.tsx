// src/components/availability/HistoryModal.tsx
import * as React from "react";
import { Modal } from "flowbite-react";
import type { HistoryEntry } from "../../hooks/Availability/useAvailability";
import { useDraggableModal } from "../../hooks/useDraggableModal";

/* ---------- types ---------- */
type Props = {
  open: boolean;
  onClose: () => void;
  items: HistoryEntry[];
};

/* ---------- helpers ---------- */
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });

/* ---------- component ---------- */
function HistoryModal({ open, onClose, items }: Props) {
  useDraggableModal(open);

  // newest first
  const rows = React.useMemo(
    () => [...items].sort((a, b) => (a.whenIso < b.whenIso ? 1 : -1)),
    [items],
  );

  return (
    <Modal show={open} size="4xl" dismissible onClose={onClose}>
      <div className="relative rounded-md bg-white shadow-xl ring-1 ring-gray-200">
        {/* Header / drag handle */}
        <div className="modal-drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 px-6 py-4 select-none active:cursor-grabbing">
          <h3 className="pointer-events-none text-lg font-semibold text-gray-900">
            Changes report
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto py-2">
          {/* ========================= DESKTOP (table) ========================= */}
          <div className="hidden px-1 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 align-top">Who</th>
                  <th className="px-4 py-2 align-top">What</th>
                  <th className="px-4 py-2 align-top">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
                  return (
                    <tr
                      key={h.id}
                      className={`${rowBg} border-b border-gray-200 align-top last:border-b-0`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Dyne S
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {h.what}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {fmtWhen(h.whenIso)}
                        <div className="mt-1 text-xs text-gray-400">
                          IP: {h.ip ?? "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No changes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================= MOBILE (stacked) ======================== */}
          <div className="space-y-3 px-4 md:hidden">
            {rows.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                No changes yet.
              </div>
            )}

            {rows.map((h, idx) => (
              <div key={h.id} className="overflow-hidden">
                {/* inner “card” with alternating row backgrounds like screenshot */}
                <div className="divide-y divide-gray-200">
                  {/* Who */}
                  <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-2 text-sm">
                    <div className="font-semibold text-gray-600">Who</div>
                    <div className="text-gray-900">Dyne S</div>
                  </div>

                  {/* What */}
                  <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-white px-3 py-3 text-sm">
                    <div className="pt-[2px] font-semibold text-gray-600">
                      What
                    </div>
                    <div className="text-gray-800">{h.what}</div>
                  </div>

                  {/* When */}
                  <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-3 text-sm">
                    <div className="pt-[2px] font-semibold text-gray-600">
                      When
                    </div>
                    <div className="text-gray-800">
                      {fmtWhen(h.whenIso)}
                      <div className="mt-1 text-xs text-gray-400">
                        IP: {h.ip ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* subtle separator between records, matching Launch27 feel */}
                {idx !== rows.length - 1 && (
                  <div className="h-[1px] bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default HistoryModal;
