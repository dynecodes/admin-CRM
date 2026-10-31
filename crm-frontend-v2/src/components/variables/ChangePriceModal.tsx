import React, { useState } from 'react';
import { Modal, Label, Button } from 'flowbite-react';
import { HiX, HiCurrencyDollar, HiExclamationCircle } from 'react-icons/hi';
import { useDraggableModal } from '../../hooks/useDraggableModal';

interface ChangePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  onConfirm: (newPrice: number) => void;
}

const ChangePriceModal: React.FC<ChangePriceModalProps> = ({
  isOpen,
  onClose,
  currentPrice,
  onConfirm,
}) => {
  const [newPrice, setNewPrice] = useState<number>(currentPrice);
  useDraggableModal(isOpen);

  const handleConfirm = () => {
    if (newPrice > 0) {
      onConfirm(newPrice);
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <div className="relative bg-white rounded-lg shadow">
        {/* Header - DRAGGABLE */}
        <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pointer-events-none">
            <HiCurrencyDollar className="w-5 h-5 text-blue-600" />
            Change Price
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center cursor-pointer"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning message */}
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <HiExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Notice</p>
              <p>
                Because the current Pricing Parameter has linked bookings, we must create a new 
                Pricing Parameter with the new Price.
              </p>
            </div>
          </div>

          {/* New Price Input */}
          <div>
            <Label htmlFor="new_price" className="mb-2 block text-sm font-medium">
              New Price
            </Label>
            <div className="relative">
              <input
                id="new_price"
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setNewPrice(0);
                    return;
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    const decimalPart = value.split('.')[1];
                    if (decimalPart && decimalPart.length > 2) {
                      setNewPrice(Math.floor(numValue * 100) / 100);
                    } else {
                      setNewPrice(numValue);
                    }
                  }
                }}
                placeholder="0.00"
                className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10"
              />
              <HiCurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Note:</span> All of your existing bookings 
              (both recurring and one-time) will be grandfathered into the old price. 
              The new price will only apply to new bookings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <Button color="gray" onClick={onClose} size="sm" className="w-24 cursor-pointer">
            Cancel
          </Button>
          <Button 
            color="blue" 
            onClick={handleConfirm} 
            size="sm"
            disabled={newPrice <= 0 || newPrice === currentPrice}
            className="w-24 cursor-pointer"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePriceModal;