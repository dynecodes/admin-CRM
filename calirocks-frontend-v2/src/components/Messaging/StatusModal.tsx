import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import DraggableModalWrapper from "../ui/DraggableModalWrapper";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: string;
  customStatusText?: string;
  onStatusChange: (status: string, customText?: string) => void;
}

const STATUS_OPTIONS = [
  { id: 'available', label: 'Available', color: 'bg-green-500' },
  { id: 'busy', label: 'Busy', color: 'bg-red-500' },
  { id: 'away', label: 'Away from desk', color: 'bg-yellow-500' },
  { id: 'leave', label: 'On leave', color: 'bg-gray-500' },
];

export default function StatusModal({
  isOpen,
  onClose,
  currentStatus = 'available',
  customStatusText = '',
  onStatusChange,
}: StatusModalProps) {
  const [customStatus, setCustomStatus] = useState(customStatusText || '');
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  if (!isOpen) return null;

  const handleStatusSelect = (statusId: string) => {
    setSelectedStatus(statusId);
    onStatusChange(statusId);
    onClose();
  };

  const handleSaveCustomStatus = () => {
    if (customStatus.trim()) {
      setSelectedStatus('custom');
      onStatusChange('custom', customStatus.trim());
      onClose();
    }
  };

  const handleDone = () => {
    // If custom status is entered but not saved, save it
    if (customStatus.trim() && customStatus !== customStatusText) {
      handleSaveCustomStatus();
    } else {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".modal-drag-handle" className="w-[90vw] max-w-md">
        <div className="bg-white  rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* Header - Draggable */}
          <div className="modal-drag-handle flex items-center justify-between p-4 border-b  cursor-grab active:cursor-grabbing select-none flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900  pointer-events-none">
              Edit Status
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-2">
                Custom Status
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCustomStatus();
                    }
                  }}
                  placeholder="What's on your mind?"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300  rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent  "
                />
                <button
                  onClick={handleSaveCustomStatus}
                  disabled={!customStatus.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Set
                </button>
              </div>
              {selectedStatus === 'custom' && customStatusText && (
                <p className="mt-2 text-xs text-gray-500 ">
                  Current: {customStatusText}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusSelect(status.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedStatus === status.id
                      ? 'bg-gray-50  border-2 border-gray-500'
                      : 'hover:bg-gray-50  border-2 border-transparent'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-gray-900  text-sm">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t ">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300  text-gray-700  rounded-lg hover:bg-gray-50  font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
}