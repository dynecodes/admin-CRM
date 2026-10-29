import React, { useState } from 'react';
import { Modal, Button } from 'flowbite-react';
import { HiSearch } from 'react-icons/hi';
import { useDraggableModal } from '../../hooks/useDraggableModal';

interface ViewListModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  items: Array<{ id?: number; name: string; [key: string]: any }>;
  renderItem?: (item: any) => React.ReactNode;
}

const ViewListModal: React.FC<ViewListModalProps> = ({
  show,
  onClose,
  title,
  items,
  renderItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  useDraggableModal(show);

  // Reset search when modal closes
  React.useEffect(() => {
    if (!show) setSearchTerm('');
  }, [show]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={show} onClose={onClose} size="2xl">
      {/* Draggable header */}
      <div className="modal-drag-handle flex items-start justify-between p-5 border-b border-gray-300 rounded-t cursor-grab active:cursor-grabbing select-none">
        <h3 className="text-xl font-semibold text-gray-900 pointer-events-none">
          {title}
        </h3>
        <button
          type="button"
          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center cursor-pointer"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>

      {/* Modal body */}
      <div className="p-6 space-y-4">
        {/* Search bar with icon */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search"
            className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm "
          />
        </div>

        {/* Item count */}
        <div className="text-sm text-gray-600">
          {searchTerm ? (
            <>Showing {filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}</>
          ) : (
            <>Total: {items.length} item{items.length !== 1 ? 's' : ''}</>
          )}
        </div>

        {/* Scrollable list in two columns */}
        <div
          className="overflow-y-auto border border-gray-200 rounded-lg p-2"
          style={{ maxHeight: 'min(calc(5 * 56px), calc(100vh - 350px))' }}
        >
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {searchTerm ? (
                <>
                  <HiSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No results found for "{searchTerm}"</p>
                </>
              ) : (
                <p className="text-sm">No items to display</p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-2">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {item.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal footer */}
      <div className="flex items-center justify-end p-6 border-t border-gray-300 rounded-b">
        <Button color="gray" onClick={onClose} className="w-24 cursor-pointer">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ViewListModal;