import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ChatListItem from './ChatListItem';
import { Channel } from '../../types/channels';
import { Conversation } from '../../types/messaging';

interface SortableChatListItemProps {
  id: string;
  chat: Channel | (Conversation & { type?: 'dm' | 'channel' });
  selectedChatId: number | null;
  selectedChatType: 'dm' | 'channel';
  onlineUsers: Set<number>;
  onSelect: () => void;
  onPin: () => void;
  onClose: () => void;
}

export default function SortableChatListItem({
  id,
  chat,
  selectedChatId,
  selectedChatType,
  onlineUsers,
  onSelect,
  onPin,
  onClose,
}: SortableChatListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isChannel = 'channel_type' in chat;
  const chatId = isChannel ? chat.id : chat.other_user_id;
  const isSelected =
    selectedChatId === chatId &&
    selectedChatType === (isChannel ? 'channel' : 'dm');

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChatListItem
        id={chatId}
        type={isChannel ? 'channel' : 'dm'}
        other_user_id={!isChannel ? chat.other_user_id : undefined}
        name={isChannel ? chat.name : `${chat.firstName} ${chat.lastName}`}
        subtitle={''}
        lastMessage={chat.last_message}
        lastMessageTime={chat.last_message_time}
        unreadCount={chat.unread_count || 0}
        isPinned={true}
        isSelected={isSelected}
        isOnline={!isChannel && onlineUsers.has(chat.other_user_id)}
        initials={
          isChannel
            ? chat.name.substring(0, 1).toUpperCase()
            : `${chat.firstName[0]}${chat.lastName[0]}`
        }
        onSelect={onSelect}
        onPin={onPin}
        onClose={onClose}
        channelIcon={
          isChannel && 'channel_emoji' in chat
            ? (chat as Channel).channel_emoji || undefined
            : undefined
        }
        channelAvatarUrl={
          isChannel && 'channel_avatar_url' in chat
            ? (chat as Channel).channel_avatar_url || undefined
            : undefined
        }
        channelEmojiColor={
          isChannel && 'channel_emoji_color' in chat
            ? (chat as Channel).channel_emoji_color || undefined
            : undefined
        }
        userProfilePic={
          !isChannel && 'profilePicUrl' in chat
            ? (chat as Conversation).profilePicUrl || undefined
            : undefined
        }
      />
    </div>
  );
}