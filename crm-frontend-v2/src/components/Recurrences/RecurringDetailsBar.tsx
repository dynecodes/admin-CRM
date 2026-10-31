// src/components/Bookings/RecurringDetailsBar.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "flowbite-react";
import { HiRefresh, HiClock, HiCalendar, HiArrowRight } from "react-icons/hi";

/* =================================================================== */
/* Draggable wrapper (inline, same file)                               */
/* =================================================================== */

type DraggableModalWrapperProps = {
  children: React.ReactNode;
  isOpen: boolean;
  handleSelector?: string; // default: [data-drag-handle]
  className?: string;
};

const DraggableModalWrapper: React.FC<DraggableModalWrapperProps> = ({
  children,
  isOpen,
  handleSelector = "[data-drag-handle]",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Center on open
  useEffect(() => {
    if (isOpen) setPosition({ x: 0, y: 0 });
  }, [isOpen]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    const handle = el.querySelector(handleSelector);
    if (!handle) return;

    if (!(handle as HTMLElement).contains(e.target as Node)) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.2s ease",
        cursor: isDragging ? "grabbing" : "grab", // pan hand
      }}
      className={className}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

/* =================================================================== */
/* Cancel Recurring Modal (inline component)                           */
/* =================================================================== */

interface CancelRecurringSeriesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (opts: { sendEmail: boolean }) => void | Promise<void>;
  customerName?: string;
  loading?: boolean;
}

const CancelRecurringSeriesModal: React.FC<CancelRecurringSeriesModalProps> = ({
  open,
  onClose,
  onConfirm,
  customerName,
  loading = false,
}) => {
  const [sendEmail, setSendEmail] = useState(false);

  if (!open) return null;

  const labelName = customerName?.trim()
    ? `${customerName}'s`
    : "this customer's";

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      {/* click outside */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <DraggableModalWrapper
        isOpen={open}
        className="relative z-[1000] w-2xl"
      >
        <div className="overflow-hidden rounded-lg bg-white shadow-xl">
          {/* Header = drag handle */}
          <div
            data-drag-handle
            className="cursor-grab active:cursor-grabbing border-b border-gray-200 px-6 pt-5 pb-3"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Cancel recurring booking
            </h2>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-4 text-sm text-gray-700">
            <p>
              Are you sure you want to cancel{" "}
              <span className="font-semibold">{labelName}</span> recurring
              appointment?
            </p>

            <p className="text-sm text-gray-500">
              All upcoming jobs for this recurring booking will be marked as
              cancelled in your job history and no future jobs will be created.
              This action cannot be undone.
            </p>

            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded cursor-pointer border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={loading}
              />
              <span>Send an email notification to the customer</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Button
              type="button"
              color="light"
              className="cursor-pointer border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              Keep Recurring Booking
            </Button>
            <Button
              type="button"
              color="failure"
              className="cursor-pointer px-4 text-white font-semibold !bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
              onClick={() => {
                if (onConfirm) onConfirm({ sendEmail });
              }}
              disabled={loading}
            >
              Cancel Recurring Series
            </Button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
};

/* =================================================================== */
/* RecurringDetailsBar                                                 */
/* =================================================================== */

export interface RecurringDetailsBarProps {
  /** e.g. "Every week on Tuesday" */
  repeatsText: string;
  /** e.g. "9:00 AM – 11:00 AM" */
  timeslotText: string;
  /** e.g. "Nov 19, 2025" */
  startDateText: string;
  /** e.g. "Nov 26, 2025" */
  nextJobText: string;
  /** Called when user confirms in modal */
  onCancelRecurring?: (opts: { sendEmail: boolean }) => void | Promise<void>;
  /** Disable cancel buttons while API runs */
  cancelDisabled?: boolean;
  /** Optional: show name inside modal question */
  customerName?: string;
}

export default function RecurringDetailsBar({
  repeatsText,
  timeslotText,
  startDateText,
  nextJobText,
  onCancelRecurring,
  cancelDisabled,
  customerName,
}: RecurringDetailsBarProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <>
      <div className="rounded-xl bg-blue-600 px-4 py-3 text-white shadow-sm sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: 4 info blocks */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Repeats */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700/70">
                <HiRefresh className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                  Repeats
                </div>
                <div className="truncate text-sm ">
                  {repeatsText}
                </div>
              </div>
            </div>

            {/* Timeslot */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700/70">
                <HiClock className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                  Timeslot
                </div>
                <div className="truncate text-sm ">
                  {timeslotText}
                </div>
              </div>
            </div>

            {/* Start date */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700/70">
                <HiCalendar className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                  Start Date
                </div>
                <div className="truncate text-sm  ">
                  {startDateText}
                </div>
              </div>
            </div>

            {/* Next job */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700/70">
                <HiArrowRight className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                  Next Job
                </div>
                <div className="truncate text-sm  ">
                  {nextJobText}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cancel button – RED */}
          <div className="flex justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={cancelDisabled}
              className="h-10 sm:h-11 px-4 sm:px-6 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white shadow-sm  focus:ring-red-500  cursor-pointer"
            >
              Cancel Recurring
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CancelRecurringSeriesModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        loading={!!cancelDisabled}
        customerName={customerName}
        onConfirm={async ({ sendEmail }) => {
          if (onCancelRecurring) {
            await onCancelRecurring({ sendEmail });
          }
          setShowCancelModal(false);
        }}
      />
    </>
  );
}
