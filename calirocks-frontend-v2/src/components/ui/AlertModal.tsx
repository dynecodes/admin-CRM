import * as React from "react";
import { Button } from "flowbite-react";
import { HiX, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { createPortal } from "react-dom";
import DraggableModalWrapper from "./DraggableModalWrapper";

type AlertType = "success" | "error" | "info";

type Props = {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  autoCloseMs?: number; // auto-close after this many milliseconds
};

const alertConfig: Record<AlertType, { bgColor: string; icon: React.ReactNode; textColor: string }> = {
  success: {
    bgColor: "bg-green-50",
    icon: <HiCheckCircle className="h-6 w-6 text-green-600" />,
    textColor: "text-green-900",
  },
  error: {
    bgColor: "bg-red-50",
    icon: <HiExclamationCircle className="h-6 w-6 text-red-600" />,
    textColor: "text-red-900",
  },
  info: {
    bgColor: "bg-black-50",
    icon: <HiCheckCircle className="h-6 w-6 text-black-600" />,
    textColor: "text-black-900",
  },
};

export default function AlertModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  actionLabel,
  onAction,
  autoCloseMs = 0,
}: Props) {
  React.useEffect(() => {
    if (isOpen && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  const config = alertConfig[type];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".modal-drag-handle" className="w-[90vw] max-w-md">
        <div className={`${config.bgColor} rounded-lg shadow-xl relative`}>
          {/* Header */}
          <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none">
            <h2 className={`text-lg font-semibold pointer-events-none ${config.textColor}`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`${config.textColor} hover:opacity-70`}
            >
              <HiX className="h-5 w-5 cursor-pointer" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex items-start gap-4">
            <div className="flex-shrink-0">{config.icon}</div>
            <div className="flex-1">
              <p className={`text-sm ${config.textColor}`}>{message}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <Button color="light" onClick={onClose} className="cursor-pointer">
              Close
            </Button>
            {actionLabel && onAction && (
              <Button color="gray" onClick={onAction} className="cursor-pointer">
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
}