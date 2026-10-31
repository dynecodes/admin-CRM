import React, { useRef, useEffect } from 'react';
import { getAvatarColor } from '../../utils/avatarColors';
import { Pin, Mail, Phone } from 'lucide-react';

interface DMInfoDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  status: string;
  customStatusText?: string; 
  email: string;
  phoneNumber?: string;
  userId: number;  // ADD THIS
  onPinChat: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

const DMInfoDropdown: React.FC<DMInfoDropdownProps> = ({
  isOpen,
  onClose,
  firstName,
  lastName,
  profilePicUrl,
  status,
  customStatusText,
  email,
  phoneNumber,
  userId,  // ADD THIS
  onPinChat,
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

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'available') return 'bg-green-500';
    if (statusLower === 'busy') return 'bg-red-500';
    if (statusLower === 'away') return 'bg-yellow-500';
    if (statusLower === 'offline') return 'bg-gray-400';
    return 'bg-green-500'; // default
  };

  return (
    <div
        ref={dropdownRef}
        className="absolute top-[58px] md:top-[74px] left-2 md:left-4 bg-white  rounded-lg shadow-xl border border-gray-200  w-72 md:w-80 z-50"
    >
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-6 md:left-8 w-4 h-4 bg-white  border-l border-t border-gray-200  transform rotate-45"></div>
      
      <div className="p-3 md:p-4 relative">
        {/* Profile Pic, Name, and Status - Same Row */}
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={`${firstName} ${lastName}`}
              className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-md ${getAvatarColor(userId)} flex items-center justify-center text-white text-base md:text-xl font-bold flex-shrink-0`}>
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-gray-900  truncate">
              {firstName} {lastName}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
              <p className="text-xs md:text-sm text-gray-600  truncate">
                {status === 'custom' && customStatusText 
                  ? customStatusText 
                  : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Pin Action */}
        <button
          onClick={onPinChat}
          className="w-full flex items-center gap-2 p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors mb-3 md:mb-4"
        >
          <Pin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
          <span className="text-xs md:text-sm text-gray-700 ">Pin this chat</span>
        </button>

        {/* Divider */}
        <div className="border-t border-gray-200  mb-3 md:mb-4"></div>

        {/* Email */}
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500  flex-shrink-0" />
          <a
            href={`mailto:${email}`}
            className="text-xs md:text-sm text-gray-600  hover:underline truncate"
          >
            {email}
          </a>
        </div>

        {/* Phone Number */}
        {phoneNumber && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500  flex-shrink-0" />
            <a
              href={`tel:${phoneNumber}`}
              className="text-xs md:text-sm text-gray-600  hover:underline"
            >
              {phoneNumber}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMInfoDropdown;