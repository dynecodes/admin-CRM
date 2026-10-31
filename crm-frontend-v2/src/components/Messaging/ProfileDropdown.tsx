import React, { useRef, useEffect } from 'react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEditStatus: () => void;
  onOpenPreferences: () => void;
  doNotDisturb: boolean;
  onToggleDoNotDisturb: (value: boolean) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onEditStatus,
  onOpenPreferences,
  doNotDisturb,
  onToggleDoNotDisturb,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[70px] md:top-[75px] left-2 md:left-4 bg-white rounded-lg shadow-xl border border-gray-200 w-64 md:w-56 z-50"
    >
      <div className="py-2">
        {/* Edit status */}
        <button
          onClick={() => {
            onEditStatus();
            onClose();
          }}
          className="w-full px-4 py-2.5 cursor-pointer text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
        >
          Edit status
        </button>

        {/* Do not disturb */}
        <div className="px-4 py-2.5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Do not disturb</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doNotDisturb}
                onChange={(e) => onToggleDoNotDisturb(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 cursor-pointer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-0 ">
            {doNotDisturb 
              ? 'You will not receive popup notifications or sounds' 
              : 'Stop receiving notifications'}
          </p>
        </div>

        {/* Preferences */}
        <button
          onClick={() => {
            onOpenPreferences();
            onClose();
          }}
          className="w-full px-4 py-2.5 cursor-pointer text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3 border-t border-gray-100"
        >
          Preferences
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;