import React, { useState, useRef, useEffect } from 'react';
import { Camera, Users, Mail, Pin, Settings, LogOut, ChevronDown } from 'lucide-react';
import { ChannelMember } from '../../types/channels';

interface ChannelInfoDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  channelAvatar?: string;
  channelEmoji?: string;
  channelEmojiColor?: string;
  memberCount: number;
  members: ChannelMember[];
  isAdmin: boolean;
  currentUserId: number;
  channelPurpose?: string;
  onUpdateAvatar: () => void;
  onSetPurpose: (purpose: string) => void;
  onOpenSettings: () => void;
  onPinChannel: () => void;
  onLeaveChannel: () => void;
  onSendMail: () => void;
  onMakeAdmin: (userId: number) => void;
  onRemoveAdmin: (userId: number) => void;
  onRemoveMember: (userId: number) => void;
  onMemberClick: (userId: number) => void;
}

const ChannelInfoDropdown: React.FC<ChannelInfoDropdownProps> = ({
  isOpen,
  onClose,
  channelName,
  channelAvatar,
  channelEmoji,
  channelEmojiColor,
  memberCount,
  members,
  isAdmin,
  currentUserId,
  channelPurpose,
  onUpdateAvatar,
  onSetPurpose,
  onOpenSettings,
  onPinChannel,
  onLeaveChannel,
  onSendMail,
  onMakeAdmin,
  onRemoveAdmin,
  onRemoveMember,
  onMemberClick,
}) => {
  const [purpose, setPurpose] = useState(channelPurpose || '');
  const [_hoveredMemberId, setHoveredMemberId] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPurpose(channelPurpose || '');
  }, [channelPurpose]);

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

  const handlePurposeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSetPurpose(purpose);
    }
  };

  if (!isOpen) return null;

  const renderAvatar = () => {
    if (channelEmoji) {
      const bgColorMap: { [key: string]: string } = {
        'transparent': 'bg-transparent',
        'red-500': 'bg-red-500',
        'orange-500': 'bg-orange-500',
        'yellow-500': 'bg-yellow-500',
        'green-500': 'bg-green-500',
        'teal-500': 'bg-teal-500',
        'sky-400': 'bg-sky-400',
        'gray-500': 'bg-gray-500',
        'indigo-500': 'bg-indigo-500',
        'purple-500': 'bg-purple-500',
        'pink-500': 'bg-pink-500',
      };
      const bgColorClass = bgColorMap[channelEmojiColor || 'transparent'] || 'bg-transparent border-2 border-gray-300';

      return (
        <div className={`w-14 h-14 rounded-lg ${bgColorClass} flex items-center justify-center text-4xl relative group ${isAdmin ? 'cursor-pointer' : ''}`}
          onClick={isAdmin ? onUpdateAvatar : undefined}>
          {channelEmoji}
          {isAdmin && (
            <div className="absolute bottom-0.5 right-0.5 bg-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      );
    }

    if (channelAvatar) {
      return (
        <div className={`relative group ${isAdmin ? 'cursor-pointer' : ''}`} onClick={isAdmin ? onUpdateAvatar : undefined}>
          <img src={channelAvatar} alt={channelName} className="w-14 h-14 rounded-lg object-cover" />
          {isAdmin && (
            <div className="absolute bottom-0.5 right-0.5 bg-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`w-14 h-14 rounded-lg bg-gray-500 flex items-center justify-center text-white text-2xl font-bold relative group ${isAdmin ? 'cursor-pointer' : ''}`}
        onClick={isAdmin ? onUpdateAvatar : undefined}>
        {channelName.charAt(0).toUpperCase()}
        {isAdmin && (
          <div className="absolute bottom-0.5 right-0.5 bg-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
        ref={dropdownRef}
        className="absolute top-[58px] md:top-[74px] left-2 md:left-4 bg-white  rounded-lg shadow-xl border border-gray-200  w-72 md:w-80 z-50 max-h-[80vh] flex flex-col"
    >
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-6 md:left-8 w-4 h-4 bg-white  border-l border-t border-gray-200  transform rotate-45"></div>
        
        <div className="p-3 md:p-4 relative flex flex-col overflow-hidden">
        {/* Avatar and Channel Name - Same Row */}
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          {renderAvatar()}
          <h3 className="text-base md:text-lg font-bold text-gray-900  flex-1 truncate">{channelName}</h3>
        </div>

        {/* Set Channel Purpose - Admin Only */}
        {isAdmin && (
          <div className="mb-2 md:mb-3">
            <input
              type="text"
              placeholder="Set a channel purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              onKeyDown={handlePurposeKeyDown}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs md:text-sm bg-white  text-gray-900 "
            />
          </div>
        )}

        {/* Channel Purpose - Regular Member */}
        {!isAdmin && channelPurpose && (
          <p className="text-xs md:text-sm text-gray-600  mb-2 md:mb-3">{channelPurpose}</p>
        )}

        {/* Member Count and Action Icons */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 ">
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {isAdmin && (
              <button
                onClick={onSendMail}
                className="group relative p-1"
                title="Send mail to channel members"
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600  hover:text-gray-600  transition-colors" />
              </button>
            )}

            <button
              onClick={onPinChannel}
              className="group relative p-1"
              title="Pin this chat"
            >
              <Pin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600  hover:text-gray-600  transition-colors" />
            </button>

            {isAdmin && (
              <button
                onClick={onOpenSettings}
                className="group relative p-1"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600  hover:text-gray-600  transition-colors" />
              </button>
            )}

            <button
              onClick={onLeaveChannel}
              className="group relative p-1"
              title="Leave this channel"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600  hover:text-red-600  transition-colors" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200  mb-2 md:mb-3"></div>

        {/* Members List */}
        <div className="max-h-48 md:max-h-64 overflow-y-auto flex-shrink group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 transition-all">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const showDropdownButton = !isCurrentUser && isAdmin;

            return (
              <div
                key={member.userId}
                className={`group flex items-center justify-between p-1.5 md:p-2 rounded-md transition-colors relative cursor-pointer ${
                  !isCurrentUser ? 'hover:bg-gray-100 ' : ''
                }`}
                onClick={() => !isCurrentUser && onMemberClick(member.userId)}
                onMouseEnter={() => setHoveredMemberId(member.userId)}
                onMouseLeave={() => {
                  if (openDropdownId !== member.userId) {
                    setHoveredMemberId(null);
                  }
                }}
              >
                <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                  {member.profilePicUrl ? (
                    <img
                      src={member.profilePicUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gray-500 flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs md:text-sm font-medium text-gray-800  truncate">
                    {member.firstName} {member.lastName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  {!!member.isAdmin && (
                    <span className="text-[10px] md:text-xs text-gray-500  font-medium">(admin)</span>
                  )}

                  {showDropdownButton && (
                    <div className="relative">
                      {/* Mobile: Always visible | Desktop: Show on hover only */}
                      <button
                        ref={(el) => {
                            if (el && openDropdownId === member.userId) {
                                const rect = el.getBoundingClientRect();
                                const dropdown = el.parentElement?.parentElement?.querySelector('.member-action-dropdown') as HTMLElement;
                                if (dropdown) {
                                const isMobile = window.innerWidth < 768;
                                dropdown.style.top = `${rect.bottom + (isMobile ? -50 : 4)}px`;
                                dropdown.style.left = `${rect.right + (isMobile ? -155: -190)}px`;
                                }
                            }
                            }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === member.userId ? null : member.userId);
                        }}
                        className={`p-0.5 md:p-1 hover:bg-gray-200  rounded transition-all ${
                        openDropdownId === member.userId
                            ? 'block opacity-100'
                            : 'block md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
                      </button>

                      {/* Dropdown Menu - Pops OUTSIDE */}
                      {openDropdownId === member.userId && (
                        <div 
                          className="member-action-dropdown fixed bg-white  rounded-md shadow-lg border border-gray-200  py-1 w-40 md:w-48 z-[60]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {member.isAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  onRemoveAdmin(member.userId);
                                  setOpenDropdownId(null);
                                  setHoveredMemberId(null);
                                }}
                                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-700  hover:bg-gray-100  transition-colors"
                              >
                                Remove as admin
                              </button>
                              <button
                                onClick={() => {
                                  onRemoveMember(member.userId);
                                  setOpenDropdownId(null);
                                  setHoveredMemberId(null);
                                }}
                                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-red-600  hover:bg-gray-100  transition-colors"
                              >
                                Remove from channel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  onMakeAdmin(member.userId);
                                  setOpenDropdownId(null);
                                  setHoveredMemberId(null);
                                }}
                                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-700  hover:bg-gray-100  transition-colors"
                              >
                                Make admin
                              </button>
                              <button
                                onClick={() => {
                                  onRemoveMember(member.userId);
                                  setOpenDropdownId(null);
                                  setHoveredMemberId(null);
                                }}
                                className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-red-600  hover:bg-gray-100  transition-colors"
                              >
                                Remove from channel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChannelInfoDropdown;