import { useState } from "react";
import { Plus, MessageCircle, Pin, FolderOpen } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import StatusModal from "./StatusModal";
import BrowseChatsPanel from "./BrowseChatsPanel";
import ChatListItem from "./ChatListItem";
import { Channel } from "../../types/channels";
import { Conversation } from "../../types/messaging";
import { getAvatarColor } from "../../utils/avatarColors";
import ProfileDropdown from "./ProfileDropdown";
import PreferencesModal from "./PreferencesModal";
import SortableChatListItem from "./SortableChatListItem";

interface LeftSidebarProps {
  currentUserId: number;
  userName: string;
  userInitials: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  userProfilePic?: string;
  currentStatus: string;
  customStatusText?: string;
  onStatusChange: (status: string, customText?: string) => void;
  pinnedChats: (Channel | (Conversation & { type: 'dm' | 'channel' }))[];
  openChats: (Channel | (Conversation & { type: 'dm' | 'channel' }))[];
  conversations: (Conversation & { id?: number })[];
  channels: Channel[];
  selectedChatId: number | null;
  selectedChatType: 'dm' | 'channel';
  staffMembers: Array<{ Uid: number; firstName: string; lastName: string; email: string }>;
  allStaff: Array<{ id: number; firstName: string; lastName: string; email: string }>;
  onlineUsers: Set<number>;
  onSelectChat: (type: 'dm' | 'channel', id: number) => void;
  onPinChat: (type: 'dm' | 'channel', id: number) => void;
  onCloseChat: (type: 'dm' | 'channel', id: number) => void;
  onShowCreateChannel: () => void;
  onReorderPins: (reorderedChats: (Channel | (Conversation & { type: 'dm' | 'channel' }))[]) => void;
  doNotDisturb: boolean;
  onToggleDoNotDisturb: (value: boolean) => void;
  notificationPreferences: {
    popupNotifications: boolean;
    notificationSound: boolean;
    selectedSound: string;
  };
  onSaveNotificationPreferences: (prefs: {
    popupNotifications: boolean;
    notificationSound: boolean;
    selectedSound: string;
  }) => void;
  onSaveProfile: (data: { firstName: string; lastName: string; phone: string }) => void;
  onProfilePictureUpdate: () => void;
}

export default function LeftSidebar({
  currentUserId,
  userName,
  userInitials,
  userFirstName,
  userLastName,
  userEmail,
  userPhone,
  userProfilePic,
  currentStatus,
  customStatusText = '',
  onStatusChange,
  pinnedChats,
  openChats,
  conversations,
  channels,
  selectedChatId,
  selectedChatType,
  allStaff,
  onlineUsers,
  onSelectChat,
  onPinChat,
  onCloseChat,
  onShowCreateChannel,
  onReorderPins,
  doNotDisturb,
  onToggleDoNotDisturb,
  notificationPreferences,
  onSaveNotificationPreferences,
  onSaveProfile, 
  onProfilePictureUpdate,
}: LeftSidebarProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBrowseChats, setShowBrowseChats] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Must move 8px before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pinnedChats.findIndex((chat) => {
        const isChannel = 'channel_type' in chat;
        const chatId = isChannel ? chat.id : chat.other_user_id;
        const key = `${isChannel ? 'channel' : 'dm'}-${chatId}`;
        return key === active.id;
      });

      const newIndex = pinnedChats.findIndex((chat) => {
        const isChannel = 'channel_type' in chat;
        const chatId = isChannel ? chat.id : chat.other_user_id;
        const key = `${isChannel ? 'channel' : 'dm'}-${chatId}`;
        return key === over.id;
      });

      const reorderedChats = arrayMove(pinnedChats, oldIndex, newIndex);
      onReorderPins(reorderedChats);
    }
  };

  const STATUS_COLORS: { [key: string]: string } = {
    available: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    leave: 'bg-gray-500',
    custom: 'bg-purple-500',
  };

  const STATUS_LABELS: { [key: string]: string } = {
    available: 'Available',
    busy: 'Busy',
    away: 'Away',
    leave: 'On leave',
    custom: customStatusText || 'Custom',
  };

  return (
    <div className="w-16 md:w-[255px] bg-gray-100  border-r border-gray-200  flex flex-col overflow-hidden transition-all">
      {/* Header - User Info - ALWAYS VISIBLE */}
      <div className="p-2 md:p-4 border-b border-gray-200  bg-gray-100  flex-shrink-0">
        {/* User Avatar and Info */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 mb-3 md:mb-4">
          <button
            onClick={() => setShowProfileDropdown(true)}
            className="relative flex-shrink-0"
            title={userName}
          >
            {userProfilePic ? (
              <img 
                src={userProfilePic} 
                alt={userName}
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover"
              />
            ) : (
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${getAvatarColor(currentUserId)} flex items-center justify-center text-white font-semibold text-sm md:text-base`}>
                {userInitials}
              </div>
            )}
            {/* Status indicator on mobile */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-100  md:hidden ${STATUS_COLORS[currentStatus] || 'bg-green-500'}`} />
          </button>
          {/* Desktop: Show name and status */}
          <div className="hidden md:block flex-1 min-w-0">
            <p className="font-semibold text-gray-900  text-base truncate">{userName}</p>
            <button
              onClick={() => setShowStatusModal(true)}
              className="text-sm text-gray-500  hover:text-gray-700  text-left flex items-center gap-1 mt-1"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[currentStatus] || 'bg-green-500'}`} />
              {STATUS_LABELS[currentStatus] || 'Set a status...'}
            </button>
          </div>
        </div>

        {/* Mobile: Vertical icon buttons */}
        <div className="flex flex-col md:hidden gap-2">
          <button
            onClick={() => setShowBrowseChats(true)}
            className="p-2.5 text-gray-700  hover:bg-gray-200 cursor-pointer rounded-md transition-colors flex items-center justify-center"
            title="Start a chat"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onShowCreateChannel}
            className="p-2.5 text-gray-700  hover:bg-gray-200 cursor-pointer rounded-md transition-colors flex items-center justify-center"
            title="Create a channel"
          >
            <Plus className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        {/* Desktop: Horizontal search and create - Connected */}
        <div className="hidden md:flex gap-0 border border-gray-300  rounded-md overflow-hidden bg-white ">
          <button
            onClick={() => setShowBrowseChats(true)}
            className="flex-1 px-3 py-2 text-gray-700  text-sm hover:bg-gray-50 text-left flex items-center gap-2 font-medium"
          >
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Start a chat</span>
          </button>
          <div className="border-l border-gray-300 "></div>
          <button
            onClick={onShowCreateChannel}
            title="Create a channel"
            className="px-3 py-2 text-gray-700  hover:bg-gray-50 cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Browse Chats Panel - Shows when clicking start a chat */}
      {showBrowseChats && (
        <div className="flex-1 overflow-hidden min-h-0">
          <BrowseChatsPanel
            conversations={conversations}
            channels={channels}
            allStaff={allStaff}
            onSelectChat={onSelectChat}
            onBack={() => setShowBrowseChats(false)}
          />
        </div>
      )}

      {/* Chats List - Only show when NOT browsing */}
      {!showBrowseChats && (
        <div className="flex-1 overflow-y-auto min-h-0 group [&::-webkit-scrollbar]:w-0 hover:[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 &::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 &::-webkit-scrollbar-thumb]:hover:bg-gray-500 transition-all">
          {/* Pinned Chats */}
          {pinnedChats.length > 0 && (
            <div className="px-1 md:px-3 py-3 md:py-4">
              {/* Mobile: Pin icon only | Desktop: Full text */}
              <div className="mb-2 flex justify-center md:justify-start">
                <div className="md:hidden p-1" title="Pinned chats">
                  <Pin className="w-4 h-4 text-gray-600 " />
                </div>
                <p className="hidden md:block text-xs font-semibold text-gray-600  uppercase px-1">
                  Pinned Chats and Channels
                </p>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pinnedChats.map((chat) => {
                    const isChannel = 'channel_type' in chat;
                    const chatId = isChannel ? chat.id : chat.other_user_id;
                    return `${isChannel ? 'channel' : 'dm'}-${chatId}`;
                  })}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {pinnedChats.map((chat) => {
                      const isChannel = 'channel_type' in chat;
                      const chatId = isChannel ? chat.id : chat.other_user_id;
                      const key = `${isChannel ? 'channel' : 'dm'}-${chatId}`;

                      return (
                        <SortableChatListItem
                          key={key}
                          id={key}
                          chat={chat}
                          selectedChatId={selectedChatId}
                          selectedChatType={selectedChatType}
                          onlineUsers={onlineUsers}
                          onSelect={() =>
                            onSelectChat(
                              isChannel ? 'channel' : 'dm',
                              chatId
                            )
                          }
                          onPin={() =>
                            onPinChat(
                              isChannel ? 'channel' : 'dm',
                              chatId
                            )
                          }
                          onClose={() =>
                            onCloseChat(
                              isChannel ? 'channel' : 'dm',
                              chatId
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Spacing between sections */}
          {pinnedChats.length > 0 && openChats.length > 0 && (
            <div className="h-2 md:h-4"></div>
          )}

          {/* Open Chats */}
          {openChats.length > 0 && (
            <div className="px-1 md:px-3 py-3 md:py-4">
              {/* Mobile: Folder icon only | Desktop: Full text */}
              <div className="mb-2 flex justify-center md:justify-start">
                <div className="md:hidden p-1" title="Open chats">
                  <FolderOpen className="w-4 h-4 text-gray-600 " />
                </div>
                <p className="hidden md:block text-xs font-semibold text-gray-600  uppercase px-1">
                  Open Chats and Channels
                </p>
              </div>
              <div className="space-y-1">
                {openChats.map((chat) => {
                  const isChannel = 'channel_type' in chat;
                  const chatId = isChannel ? chat.id : chat.other_user_id;
                  const isSelected =
                    selectedChatId === chatId &&
                    selectedChatType === (isChannel ? 'channel' : 'dm');

                  return (
                    <ChatListItem
                      key={`open-${isChannel ? 'ch-' + chat.id : 'dm-' + chat.other_user_id}`}
                      id={chatId}
                      type={isChannel ? 'channel' : 'dm'}
                      other_user_id={!isChannel ? chat.other_user_id : undefined}
                      name={isChannel ? chat.name : `${chat.firstName} ${chat.lastName}`}
                      subtitle={''}
                      lastMessage={chat.last_message}
                      lastMessageTime={chat.last_message_time}
                      unreadCount={chat.unread_count || 0}
                      isPinned={chat.isPinned || false}
                      isSelected={isSelected}
                      isOnline={!isChannel && onlineUsers.has(chat.other_user_id)}
                      initials={
                        isChannel
                          ? chat.name.substring(0, 1).toUpperCase()
                          : `${chat.firstName[0]}${chat.lastName[0]}`
                      }
                      onSelect={() =>
                        onSelectChat(
                          isChannel ? 'channel' : 'dm',
                          chatId
                        )
                      }
                      onPin={() =>
                        onPinChat(
                          isChannel ? 'channel' : 'dm',
                          chatId
                        )
                      }
                      onClose={() =>
                        onCloseChat(
                          isChannel ? 'channel' : 'dm',
                          chatId
                        )
                      }
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
                  );
                })}
              </div>
            </div>
          )}

          {pinnedChats.length === 0 && openChats.length === 0 && (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
              <p className="text-sm">No chats yet. Start a conversation!</p>
            </div>
          )}
        </div>
      )}

      {/* Modals and Dropdowns */}
      <ProfileDropdown
        isOpen={showProfileDropdown}
        onClose={() => setShowProfileDropdown(false)}
        onEditStatus={() => setShowStatusModal(true)}
        onOpenPreferences={() => setShowPreferencesModal(true)}
        doNotDisturb={doNotDisturb}
        onToggleDoNotDisturb={onToggleDoNotDisturb}
      />

      <StatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={currentStatus}
        customStatusText={customStatusText}
        onStatusChange={onStatusChange}
      />

      <PreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        userFirstName={userFirstName}
        userLastName={userLastName}
        userPhone={userPhone}
        userEmail={userEmail}
        userProfilePic={userProfilePic}
        currentUserId={currentUserId} 
        onSaveProfile={onSaveProfile}
        onProfilePictureUpdate={onProfilePictureUpdate}
        notificationPreferences={notificationPreferences}
        onSaveNotificationPreferences={onSaveNotificationPreferences}
      />
    </div>
  );
}