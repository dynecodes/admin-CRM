import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Checkbox } from "flowbite-react";
import { HiSearch, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { useDraggableModal } from "../../hooks/useDraggableModal";

interface MultiSelectOption {
  id: number;
  name: string;
  [key: string]: any;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
  disabled?: boolean;
  formatDisplay?: (item: MultiSelectOption) => string;
  className?: string;
  selectAllByDefault?: boolean;
  maxDisplayedBadges?: number;
  label?: string;
  modalTitle?: string;
  /** NEW: maximum allowed selections (set to 1 for single-select behavior) */
  max?: number;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options = [],
  selected = [],
  onChange,
  placeholder,
  disabled = false,
  formatDisplay,
  className = "",
  selectAllByDefault = false,
  maxDisplayedBadges: _maxDisplayedBadges = 3,
  label = "",
  modalTitle,
  max = Number.POSITIVE_INFINITY, // NEW
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useDraggableModal(showModal);

  const maxNum = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : Number.POSITIVE_INFINITY; // NEW

  const safeOptions = Array.isArray(options) ? options : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectAllByDefault && safeSelected.length === 0 && safeOptions.length > 0) {
      onChange(safeOptions.map((opt) => opt.id));
    }
  }, [selectAllByDefault, safeOptions, safeSelected.length, onChange]);

  // const selectedItems = safeOptions.filter((opt) => safeSelected.includes(opt.id));

  const filteredOptions = safeOptions.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenModal = () => {
    setTempSelected([...safeSelected]);
    setSearchTerm("");
    setShowModal(true);
  };

  const handleOpenMobile = () => {
    setTempSelected([...safeSelected]);
    setSearchTerm("");
    setExpandedMobile(true);
    setTimeout(() => {
      if (dropdownRef.current) {
        dropdownRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, 100);
  };

  // NEW: prevent exceeding max while toggling
  const toggleSelection = (itemId: number) => {
    setTempSelected((prev) => {
      const has = prev.includes(itemId);
      if (has) return prev.filter((id) => id !== itemId);
      if (maxNum === 1) return [itemId];                // replace in single-select
      if (prev.length >= maxNum) return prev;           // block additional in multi
      return [...prev, itemId];
    });
  };

  // NEW: Save never emits more than max
  const handleApply = () => {
    const next = maxNum === Number.POSITIVE_INFINITY ? tempSelected : tempSelected.slice(0, maxNum);
    onChange(next);
    if (isMobile) setExpandedMobile(false);
    else setShowModal(false);
  };

  const handleCancel = () => {
    setTempSelected([...safeSelected]);
    if (isMobile) setExpandedMobile(false);
    else setShowModal(false);
  };

  const clearAllTemp = () => {
    setTempSelected([]);
  };

  // NEW: respect max and disable for single-select
  const selectAllFiltered = () => {
    if (maxNum === 1) return; // no-op
    const allFilteredIds = filteredOptions.map((opt) => opt.id);
    const combined = [...new Set([...tempSelected, ...allFilteredIds])];
    setTempSelected(combined.slice(0, maxNum));
  };

  const getModalTitle = () => {
    if (modalTitle) return modalTitle;
    if (!label) return "Select Options";
    return `Select ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  };

  // NEW: Disable chips if cap reached and this chip isn't selected
  const isChoiceDisabled = (id: number) =>
    maxNum !== Number.POSITIVE_INFINITY && tempSelected.length >= maxNum && !tempSelected.includes(id);

  // NEW: Better display when max=1: show selected name instead of "1 selected"
  const displayText =
    safeSelected.length === 0
      ? placeholder
      : maxNum === 1
      ? safeOptions.find((o) => o.id === safeSelected[0])?.name ?? placeholder
      : `${safeSelected.length} selected`;

  /* -------------------------- Mobile Inline -------------------------- */
  if (isMobile) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              if (expandedMobile) handleCancel();
              else handleOpenMobile();
            }
          }}
          disabled={disabled}
          type="button"
          className="w-full flex justify-between items-center px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-left  disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm text-gray-700">{displayText}</span>
          {expandedMobile ? <HiChevronUp className="h-4 w-4 text-gray-400" /> : <HiChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {expandedMobile && (
          <div ref={dropdownRef} className="border border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden">
            <div className="p-3 bg-gray-50">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {tempSelected.length} item{tempSelected.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <Button size="xs" color="light" onClick={clearAllTemp} className="flex-1">
                  Clear All
                </Button>
                {maxNum !== 1 && (
                  <Button size="xs" color="light" onClick={selectAllFiltered} className="flex-1">
                    Select All
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto p-3" style={{ maxHeight: "calc(4.5 * 56px)" }}>
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center">
                  <HiSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No results found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOptions.map((option) => {
                    const isSelected = tempSelected.includes(option.id);
                    const disabledChip = isChoiceDisabled(option.id);
                    return (
                      <div
                        key={option.id}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                          isSelected ? "border-gray-500 bg-gray-50" : "border-gray-200 bg-white"
                        } ${disabledChip ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={() => !disabledChip && toggleSelection(option.id)}
                      >
                        <Checkbox checked={isSelected} onChange={() => {}} className="pointer-events-none" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium truncate ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                              {option.name}
                            </span>
                            {formatDisplay && (
                              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                                {formatDisplay(option)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 flex gap-2">
              <Button color="light" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button color="gray" onClick={handleApply} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* -------------------------- Desktop Modal -------------------------- */
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) handleOpenModal();
        }}
        disabled={disabled}
        type="button"
        className="w-full flex justify-between items-center px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-sm text-gray-700">{displayText}</span>
        <HiChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {showModal && (
        <Modal show={showModal} onClose={() => setShowModal(false)} size="2xl">
          {/* modal header - DRAGGABLE */}
          <div className="modal-drag-handle flex items-start justify-between p-5 border-b border-gray-300 rounded-t cursor-grab active:cursor-grabbing select-none">
            <h3 className="text-xl font-semibold text-gray-900 pointer-events-none">{getModalTitle()}</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center cursor-pointer"
              onClick={() => setShowModal(false)}
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

          {/* modal body */}
          <div className="p-6 space-y-4">
            {/* search and actions bar */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:border-gray-500 focus:ring-gray-500 sm:px-3 sm:py-2.5 sm:text-sm"
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {tempSelected.length} item{tempSelected.length !== 1 ? "s" : ""} selected
                </div>

                <div className="flex gap-2">
                  <Button size="xs" color="light" onClick={clearAllTemp} className="cursor-pointer">
                    Clear All
                  </Button>
                  {maxNum !== 1 && (
                    <Button size="xs" color="light" onClick={selectAllFiltered} className="cursor-pointer">
                      Select All
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* options grid */}
            <div className="overflow-y-auto" style={{ maxHeight: "min(calc(6.5 * 56px), calc(100vh - 400px))" }}>
              {filteredOptions.length === 0 ? (
                <div className="py-12 text-center">
                  <HiSearch className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600 font-medium">No results found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredOptions.map((option) => {
                    const isSelected = tempSelected.includes(option.id);
                    const disabledChip = isChoiceDisabled(option.id);
                    return (
                      <div
                        key={option.id}
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected ? "border-gray-500 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
                        } ${disabledChip ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={() => !disabledChip && toggleSelection(option.id)}
                      >
                        <Checkbox color="gray" checked={isSelected} onChange={() => {}} className="pointer-events-none" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium truncate ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                              {option.name}
                            </span>
                            {formatDisplay && (
                              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                                {formatDisplay(option)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* modal footer */}
          <div className="flex items-center justify-end p-6 space-x-2 border-t border-gray-300 rounded-b">
            <Button color="light" onClick={handleCancel} className="w-24 cursor-pointer">
              Cancel
            </Button>
            <Button color="gray" onClick={handleApply} className="w-24 cursor-pointer">
              Save
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
