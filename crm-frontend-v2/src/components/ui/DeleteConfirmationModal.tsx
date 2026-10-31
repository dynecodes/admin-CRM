import React from "react";
import { Modal, Button } from "flowbite-react";
import { HiX, HiExclamation } from "react-icons/hi";
import { useDraggableModal } from "../../hooks/useDraggableModal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: string;
  message?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  itemName,
  itemType = "item",
  message,
  isDeleting = false,
}) => {
  const defaultMessage = `Are you sure you want to permanently delete the ${itemType} "${itemName}"? This action cannot be undone.`;
  useDraggableModal(isOpen);

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <div className="relative rounded-lg bg-white shadow">
        {/* Header - DRAGGABLE */}
        <div className="modal-drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 p-4 select-none active:cursor-grabbing">
          <h3 className="pointer-events-none flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <HiExclamation className="h-6 w-6 text-red-600" />
            </div>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-700">{message || defaultMessage}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <Button
            color="gray"
            onClick={onClose}
            size="sm"
            disabled={isDeleting}
            className="w-24 cursor-pointer font-medium bg-white border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            color="failure"
            onClick={onConfirm}
            size="sm"
            disabled={isDeleting}
            className="w-24 cursor-pointer font-medium bg-red-600 text-white transition-colors hover:bg-red-700 hover:text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
