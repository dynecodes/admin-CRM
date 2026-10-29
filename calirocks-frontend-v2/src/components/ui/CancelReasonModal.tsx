import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Label } from "flowbite-react";
import DraggableModalWrapper from "./DraggableModalWrapper";

export type CancelReasonModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireReason?: boolean;
  loading?: boolean;
  initialReason?: string;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
};

const CancelReasonModal: React.FC<CancelReasonModalProps> = ({
  open,
  title = "Cancel Booking",
  message = "Are you sure you want to Cancel this Booking?",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  requireReason = true,
  loading = false,
  initialReason = "",
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = React.useState(initialReason);

  React.useEffect(() => {
    if (open) setReason(initialReason);
  }, [open, initialReason]);

  if (!open) return null;

  const confirmDisabled = loading || (requireReason && !reason.trim());

  const overlay = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
    >
      {/* margin on the dialog itself, not the overlay */}
      <DraggableModalWrapper isOpen={open} className="w-full max-w-lg mx-4">
        <div className="w-full overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Header (drag handle) */}
          <div
            className="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-5 py-3 cursor-grab"
            data-drag-handle
          >
            <h2 className="text-base font-semibold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xl leading-none text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-700">{message}</p>
            <div>
              <Label className="mb-1 block text-sm">
                Reason for Cancelling*
              </Label>
              <textarea
                rows={4}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                placeholder="Reason for Cancelling*"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-300 px-5 py-3">
            <Button
              type="button"
              color="light"
              size="sm"
              className="px-5 cursor-pointer"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>

             <Button
              type="button"
              color="gray"
              size="sm"
              className="px-8 cursor-pointer"
              onClick={() => onConfirm(reason)}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>
  );
  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
};

export default CancelReasonModal;
