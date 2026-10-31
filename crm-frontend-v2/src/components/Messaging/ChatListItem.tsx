import { useState } from "react";
import { Pin, X } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
import { getAvatarColor } from "../../utils/avatarColors";

interface ChatListItemProps {
  id: number;
  type: 'dm' | 'channel';
  name: string;
  subtitle: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isPinned: boolean;
  isSelected: boolean;
  initials: string;
  userProfilePic?: string | null;
  isOnline?: boolean;
  channelIcon?: string | null;
  channelAvatarUrl?: string | null;  // ADD THIS
  channelEmojiColor?: string | null; // ADD THIS
  other_user_id?: number;
  onSelect: () => void;
  onPin: () => void;
  onClose: () => void;
}

export default function ChatListItem({
  // id,
  type,
  name,
  subtitle,
  lastMessage,
  // lastMessageTime,
  unreadCount,
  isPinned,
  isSelected,
  initials,
  // isOnline = false,
  userProfilePic,
  channelIcon,
  channelAvatarUrl,   
  channelEmojiColor,    
  other_user_id,
  onSelect,
  onPin,
  onClose,
}: ChatListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getChannelColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarColor = type === 'dm' && other_user_id 
    ? getAvatarColor(other_user_id) 
    : type === 'channel' 
    ? getChannelColor(name) 
    : 'bg-red-600';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full px-1 md:px-2.5 py-2 flex flex-col md:flex-row items-center md:items-start gap-0 md:gap-2.5 transition-colors relative group rounded-md cursor-pointer ${
        isSelected
          ? 'bg-gray-200 '
          : 'hover:bg-gray-150 '
      }`}
    >
      {/* Avatar - Always visible */}
      <div className="relative flex-shrink-0">
        {type === 'channel' ? (
          (() => {
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
            const bgColorClass = channelIcon && channelEmojiColor 
              ? (bgColorMap[channelEmojiColor] || avatarColor)
              : avatarColor;

            return (
              <div className={`w-10 h-10 rounded-md ${bgColorClass} flex items-center justify-center text-white font-semibold text-sm`}>
                {channelAvatarUrl ? (
                  <img src={channelAvatarUrl} alt={name} className="w-full h-full object-cover rounded-md" />
                ) : channelIcon ? (
                  <span className="text-2xl">{channelIcon}</span>
                ) : (
                  initials
                )}
              </div>
            );
          })()
        ) : (
          <div>
            {userProfilePic ? (
              <img 
                src={userProfilePic} 
                alt={name}
                className="w-10 h-10 rounded-md object-cover"
              />
            ) : (
              <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
                {initials}
              </div>
            )}
          </div>
        )}
        {/* Unread badge on mobile - positioned on avatar */}
        {unreadCount > 0 && (
          <span className="md:hidden absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

        {/* Mobile: Name below avatar - ONLY ON MOBILE */}
      <p className="md:hidden text-[10px] text-gray-700  text-center max-w-[60px] truncate mt-1">
        {name}
      </p>

      {/* Desktop: Full info */}
      <div className="hidden md:block flex-1 min-w-0 text-left">
        <div className="flex items-baseline gap-1 mb-0.5">
            <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-900 ' : 'font-medium text-gray-900 '}`}>
                {name}
            </p>
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-700  font-semibold' : 'text-gray-500 '}`}>
          {subtitle}
        </p>
        {lastMessage && (
          <p className={`text-sm truncate mt-1 ${unreadCount > 0 ? 'text-gray-800  font-bold' : 'text-gray-600 '}`}>
            {lastMessage.replace(/<[^>]*>/g, '')}
          </p>
        )}
      </div>

      {/* Desktop: Actions and badges on right */}
      <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 self-start mt-0.5">
        {unreadCount > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-sm font-semibold text-white bg-gray-600 rounded-full flex-shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
            </span>
        ) : null}
        
        {isHovered && (
            <div className="flex gap-1">
            <button
                onClick={(e) => {
                e.stopPropagation();
                onPin();
                }}
                className="p-1 hover:bg-gray-200  rounded"
                title={isPinned ? 'Unpin' : 'Pin'}
            >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-red-600 fill-red-600' : 'text-gray-400'}`} />
            </button>
            <button
                onClick={(e) => {
                e.stopPropagation();
                onClose();
                }}
                className="p-1 hover:bg-gray-200  rounded"
                title="Close"
            >
                <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
            </div>
        )}
        </div>
    </div>
  );
}