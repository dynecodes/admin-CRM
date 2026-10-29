import { useEffect, useRef, useState } from "react";
import { getAvatarColor } from "../../utils/avatarColors";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isOnline?: boolean;
  isInChannel?: boolean;
}

interface MentionDropdownProps {
  channelMembers: Member[];
  allStaff: Member[];
  searchQuery: string;
  isAdmin?: boolean; 
  onSelect: (mention: { type: 'all' | 'online' | 'user'; userId?: number; displayName?: string }) => void;
  onAddMember?: (userId: number) => Promise<void>; 
  onClose: () => void;
  position: { top: number; left: number };
}

export default function MentionDropdown({
  channelMembers,
  allStaff,
  searchQuery,
  isAdmin = false,
  onSelect,
  onAddMember,
  onClose,
  position,
}: MentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // Filter members based on search
  const query = searchQuery.toLowerCase();
  
  // Show @all and @online only if query matches
  const showAll = query === '' || 'all'.includes(query);
  const showOnline = query === '' || 'online'.includes(query);

  // Get channel member IDs for filtering - use Set for O(1) lookup
  const channelMemberIds = new Set(channelMembers.map(m => m.id));

  // Filter channel members
  const inChannel = channelMembers.filter(m => 
    query === '' ||
    m.firstName.toLowerCase().includes(query) || 
    m.lastName.toLowerCase().includes(query) ||
    m.email.toLowerCase().includes(query)
  );

  // Filter staff not in channel
  const notInChannel = isAdmin ? allStaff.filter(s => {
    const isInChannel = channelMemberIds.has(s.id);
    const matchesQuery = query === '' ||
      s.firstName.toLowerCase().includes(query) || 
      s.lastName.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);
    
    return !isInChannel && matchesQuery;
  }) : [];

  // Build the list of options
  const options: any[] = [];
  if (showAll) options.push({ type: 'all', id: 'opt-all' });
  if (showOnline) options.push({ type: 'online', id: 'opt-online' });
  inChannel.forEach(m => options.push({ type: 'user', member: m, inChannel: true, id: `user-${m.id}` }));
  notInChannel.forEach(m => options.push({ type: 'user', member: m, inChannel: false, id: `notinchan-${m.id}` }));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (options[selectedIndex]) {
          handleSelect(options[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, options]);

  const handleSelect = (option: any) => {
    if (option.type === 'all') {
      onSelect({ type: 'all', displayName: 'all' });
    } else if (option.type === 'online') {
      onSelect({ type: 'online', displayName: 'online' });
    } else if (option.type === 'user') {
      onSelect({ 
        type: 'user', 
        userId: option.member.id, 
        displayName: `${option.member.firstName} ${option.member.lastName}` 
      });
    }
  };

  const handleAddMember = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    if (!onAddMember) return;
    
    setIsAdding(true);
    try {
      await onAddMember(userId);
      // The member will be automatically moved from "not in channel" to "in channel" after refresh
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (options.length === 0) {
    return null;
  }

  let currentIndex = 0;

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white  border border-gray-300  rounded-lg shadow-lg w-72 md:w-96 max-h-60 md:max-h-80 overflow-y-auto z-50"
      style={{ top: position.top, left: Math.max(8, position.left) }} // Min 8px from left edge
    >
      <div className="p-1.5 md:p-2 border-b border-gray-200  bg-gray-50 ">
        <p className="text-[10px] md:text-xs font-semibold text-gray-500  uppercase">@MENTION</p>
      </div>

      {/* @all option */}
      {showAll && (
        <div
          key="all-option"
          onClick={() => handleSelect({ type: 'all' })}
          className={`px-2 md:px-3 py-1.5 md:py-2 cursor-pointer hover:bg-gray-100  ${selectedIndex === currentIndex++ ? 'bg-gray-100 ' : ''}`}
        >
          <p className="text-xs md:text-sm font-semibold text-gray-900 ">@all</p>
          <p className="text-[10px] md:text-xs text-gray-500 ">all members with notifications enabled for mentions</p>
        </div>
      )}

      {/* @online option */}
      {showOnline && (
        <div
          key="online-option"
          onClick={() => handleSelect({ type: 'online' })}
          className={`px-2 md:px-3 py-1.5 md:py-2 cursor-pointer hover:bg-gray-100  ${selectedIndex === currentIndex++ ? 'bg-gray-100 ' : ''}`}
        >
          <p className="text-xs md:text-sm font-semibold text-gray-900 ">@online</p>
          <p className="text-[10px] md:text-xs text-gray-500 ">members seen within the last 5 min and have notifications enabled for mentions</p>
        </div>
      )}

      {/* Channel members */}
      {inChannel.map((member) => {
        const isSelected = selectedIndex === currentIndex++;
        const avatarColor = getAvatarColor(member.id);
        return (
          <div
            key={`member-${member.id}`}
            onClick={() => handleSelect({ type: 'user', member })}
            className={`px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-100  ${isSelected ? 'bg-gray-100 ' : ''}`}
          >
            <div className="relative">
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-md ${avatarColor} flex items-center justify-center text-white font-semibold text-[10px] md:text-xs`}>
                {member.firstName[0]}{member.lastName[0]}
              </div>
              {member.isOnline && (
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full border-2 border-white " />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900  truncate">{member.firstName} {member.lastName}</p>
              <p className="text-[10px] md:text-xs text-gray-500  truncate">{member.email}</p>
            </div>
          </div>
        );
      })}

      {/* NOT IN THIS CHANNEL section - Only for admins */}
      {Boolean(isAdmin) && notInChannel.length > 0 && (
        <>
          <div key="not-in-channel-header" className="px-2 md:px-3 py-1.5 md:py-2 bg-gray-50  border-t border-gray-200 ">
            <p className="text-[10px] md:text-xs font-semibold text-gray-500  uppercase">NOT IN THIS CHANNEL</p>
          </div>
          {notInChannel.map((member) => {
            const isSelected = selectedIndex === currentIndex++;
            const avatarColor = getAvatarColor(member.id);
            return (
              <div
                key={`not-in-${member.id}`}
                className={`px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 ${isSelected ? 'bg-gray-100 ' : ''}`}
              >
                <div className="relative">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-md ${avatarColor} flex items-center justify-center text-white font-semibold text-[10px] md:text-xs`}>
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  {member.isOnline && (
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-500 rounded-full border-2 border-white " />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900  truncate">{member.firstName} {member.lastName}</p>
                  <p className="text-[10px] md:text-xs text-gray-500  truncate">{member.email}</p>
                </div>
                <button 
                  onClick={(e) => handleAddMember(e, member.id)}
                  disabled={isAdding}
                  className="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-medium text-green-600  border border-green-600  rounded hover:bg-green-50  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}