import { useState, useRef, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { userStatusApi } from '../../api/userStatus';
import { useMessaging } from '../../hooks/Messaging/useMessaging';
import { useChannels } from '../../hooks/Channels/useChannels';
import { useStaffs } from '../../hooks/Staffs/useStaffs';
import { usePins } from '../../hooks/Pins/usePins';
import { useUserStatus } from '../../hooks/UserStatus/useUserStatus';
import { useClosedChats } from '../../hooks/ClosedChats/useClosedChats';
import useAuth from '../../hooks/Auth/useAuth';
import LeftSidebar from '../../components/Messaging/LeftSidebar';
import ChatArea from '../../components/Messaging/ChatArea';
import ChannelSettingsModalSimple from '../../components/Messaging/ChannelSettingsModalSimple';
import UpdateChannelAvatarModal from '../../components/Messaging/UpdateChannelAvatarModal';
import CreateChannelModal from '../../components/Channels/CreateChannelModal';
import { Channel } from '../../types/channels';
import { Conversation } from '../../types/messaging';
import RightSidebar from '../../components/Messaging/RightSidebar';
import RemindersPanel from '../../components/Messaging/RemindersPanel';
import useReminders from '../../hooks/Reminders/useReminders';
import { ReminderTarget } from '../../types/reminders';

type ChatItem = (Conversation & { type: 'dm'; id: number }) | (Channel & { type: 'channel' });

interface MessagingPageProps {
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
  doNotDisturb: boolean;
  onToggleDoNotDisturb: (value: boolean) => void;
}

const MessagingPage: React.FC = () => {
  // Get notification data from Layout via Outlet context
  const {
    notificationPreferences,
    onSaveNotificationPreferences,
    doNotDisturb,
    onToggleDoNotDisturb,
  } = useOutletContext<MessagingPageProps>();

  const {
    channels,
    channelMessages,
    activeChannelId,
    typingUsersDetails: channelTypingUsers,
    loading: _channelLoading,
    channelMembers,
    setActiveChannelId,
    fetchChannelMessages,
    fetchChannelMembers,
    createChannel,
    sendChannelMessage,
    startTyping: startChannelTyping,
    stopTyping: stopChannelTyping,
    addChannelMembers,
    removeChannelMember,
    promoteToAdmin,
    demoteFromAdmin,
    deleteChannel,
    leaveChannel,
    fetchChannels,
    updateChannel,
    updateChannelAvatar,
    markChannelAsRead,
  } = useChannels();

  const { staffs, fetchStaffs } = useStaffs();
  const { auth }: any = useAuth();
  const { pinnedChats, pinnedChatsOrder, togglePin, reorderPins: reorderPinsApi } = usePins();
  const { currentStatus, updateStatus } = useUserStatus();
  const { closedChats, closeChat, reopenChat, fetchClosedChats } = useClosedChats();

  const {
    conversations,
    messages,
    loading: _dmLoading,
    onlineUsers,
    typingUsers: dmTypingUsers,
    isConnected,
    fetchMessages,
    sendMessage,
    startTyping: startDMTyping,
    stopTyping: stopDMTyping,
    fetchConversations,
  } = useMessaging(reopenChat);
  
  const [showRemindersPanel, setShowRemindersPanel] = useState(false);
  const [reminderInitialMessage, setReminderInitialMessage] = useState<string | undefined>(undefined);
  const {
    upcomingReminders,
    completedReminders,
    createReminder,
    completeReminder,
  } = useReminders();
  const [selectedChatType, setSelectedChatType] = useState<'dm' | 'channel'>('dm');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const [userStatuses, setUserStatuses] = useState<Map<number, { status_type: string; custom_status?: string | null }>>(new Map());
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Refetch closed chats periodically to catch reopened chats
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClosedChats();
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [fetchClosedChats]);

  // Handle URL parameters to open specific chat
  useEffect(() => {
    const chatId = searchParams.get('chat');
    const chatType = searchParams.get('type');
    
    if (chatId && chatType) {
      const numericChatId = parseInt(chatId, 10);
      
      if (chatType === 'dm') {
        setSelectedChatType('dm');
        setSelectedUserId(numericChatId);
        fetchMessages(numericChatId);
      } else if (chatType === 'channel') {
        // Wait for channels to load before selecting one
        if (channels.length > 0) { // ADD THIS CHECK
          setSelectedChatType('channel');
          setActiveChannelId(numericChatId);
          fetchChannelMessages(numericChatId);
          fetchChannelMembers(numericChatId);
        }
      }
      
      // Clear URL parameters after handling them
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, fetchMessages, fetchChannelMessages, fetchChannelMembers, setActiveChannelId, channels]);

  // Fetch all user statuses from database
  useEffect(() => {
    const fetchAllStatuses = async () => {
      try {
        const statuses = await userStatusApi.getAllUserStatuses();
        const statusMap = new Map<number, { status_type: string; custom_status?: string | null }>();
        statuses.forEach(status => {
          statusMap.set(status.user_id, {
            status_type: status.status_type,
            custom_status: status.custom_status
          });
        });
        setUserStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching user statuses:', error);
      }
    };

    fetchAllStatuses();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Find current user
  const currentStaff = staffs.find((s: any) => s.email === auth?.user?.username);
  const currentUserId = currentStaff?.id;
  // const userInitials = currentStaff
  //   ? `${currentStaff.firstName[0]}${currentStaff.lastName[0]}`
  //   : 'U';
  const userName = currentStaff
    ? `${currentStaff.firstName} ${currentStaff.lastName}`
    : 'User';

  // Filter staff (exclude current user)
  const availableStaff = staffs.filter((staff: any) => staff.id !== currentUserId);

  // Build chat lists
  const allChats: ChatItem[] = [
    ...conversations.map((conv): ChatItem & { type: 'dm' } => ({
      ...conv,
      type: 'dm',
      id: conv.other_user_id,
    })),
    ...channels.map((ch): ChatItem & { type: 'channel' } => ({
      ...ch,
      type: 'channel',
    })),
  ];

  const pinnedChatsList = allChats
    .filter((chat) => {
      const key = chat.type === 'dm' ? `dm-${chat.id}` : `channel-${chat.id}`;
      return pinnedChats.has(key);
    })
    .sort((a, b) => {
      // Sort by display_order from backend
      const keyA = a.type === 'dm' ? `dm-${a.id}` : `channel-${a.id}`;
      const keyB = b.type === 'dm' ? `dm-${b.id}` : `channel-${b.id}`;
      
      const orderA = pinnedChatsOrder.find(p => `${p.chat_type}-${p.chat_id}` === keyA)?.display_order ?? 999;
      const orderB = pinnedChatsOrder.find(p => `${p.chat_type}-${p.chat_id}` === keyB)?.display_order ?? 999;
      
      return orderA - orderB;
    });

  const openChatsList = allChats
    .filter((chat) => {
      const key = chat.type === 'dm' ? `dm-${chat.id}` : `channel-${chat.id}`;
      return !closedChats.has(key) && !pinnedChats.has(key);
    })
    .sort((a, b) => {
      const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
      const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
      return timeB - timeA;
    });

  
  // Prepare available targets (staff + channels)
  const availableTargets: ReminderTarget[] = useMemo(() => {
    const targets: ReminderTarget[] = [];

    // Add all confirmed staff as individual targets (excluding current user)
    staffs.forEach((staff: any) => {
      if (staff.confirmed && staff.id !== currentStaff?.id) {
        targets.push({
          id: staff.id,
          type: 'user',
          name: `${staff.firstName} ${staff.lastName}`,
          avatar: staff.profilePicUrl
        });
      }
    });

    // Add all channels user is member of
    channels.forEach((channel) => {
      targets.push({
        id: channel.id,
        type: 'channel',
        name: channel.name,
        avatar: channel.channel_avatar_url || undefined
      });
    });

    return targets;
  }, [staffs, channels, currentStaff]);

  // Auto-select first available chat on load
  useEffect(() => {
    // Only auto-select if nothing is selected yet
    const hasSelection = selectedUserId !== null || activeChannelId !== null;
    
    if (!hasSelection && currentUserId) {
      // Priority 1: First pinned chat
      if (pinnedChatsList.length > 0) {
        const firstPinned = pinnedChatsList[0];
        const chatType = firstPinned.type === 'dm' ? 'dm' : 'channel';
        const chatId = firstPinned.type === 'dm' ? firstPinned.id : firstPinned.id;
        handleSelectChat(chatType, chatId);
      }
      // Priority 2: First open chat
      else if (openChatsList.length > 0) {
        const firstOpen = openChatsList[0];
        const chatType = firstOpen.type === 'dm' ? 'dm' : 'channel';
        const chatId = firstOpen.type === 'dm' ? firstOpen.id : firstOpen.id;
        handleSelectChat(chatType, chatId);
      }
      // If no chats at all, selectedUserId and activeChannelId remain null
      // which will show "select a chat to start messaging"
    }
  }, [pinnedChatsList.length, openChatsList.length, currentUserId]);


  // Prepare staff for modal
  const staffForModal = availableStaff.map((s: any) => ({
    Uid: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
  }));

  // All staff for browse chats
  const allStaffForBrowse = staffs.filter((s: any) => s.id !== currentUserId).map((s: any) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    profilePicUrl: s.profilePicUrl, 
  }));

  // Get selected chat
  let selectedChat: any =
    selectedChatType === 'dm'
      ? conversations.find((c) => c.other_user_id === selectedUserId)
      : channels.find((c) => c.id === activeChannelId);

  // If it's a DM and no conversation exists yet, create a temporary one from staff data
  if (selectedChatType === 'dm' && !selectedChat && selectedUserId) {
    const staffMember = staffs.find((s: any) => s.id === selectedUserId);
    if (staffMember) {
      selectedChat = {
        other_user_id: staffMember.id,
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        last_message: null,
        last_message_time: null,
        unread_count: 0,
      };
    }
  }

  const selectedMessages =
    selectedChatType === 'dm' ? messages : channelMessages;

  const isTyping =
    selectedChatType === 'dm'
      ? dmTypingUsers.has(selectedUserId || 0)
      : channelTypingUsers.length > 0;

  // Get status for DM user
  const selectedUserStatusData = selectedChatType === 'dm' && selectedUserId 
    ? userStatuses.get(selectedUserId)
    : null;
  const selectedUserStatus = selectedUserStatusData?.status_type || 'available';
  const selectedUserCustomStatus = selectedUserStatusData?.custom_status;

  // Get phone number from staffs data
  const selectedUserPhone = selectedChatType === 'dm' && selectedUserId
    ? staffs.find((s: any) => s.id === selectedUserId)?.phone
    : undefined;

  const handleSelectChat = async (type: 'dm' | 'channel', id: number) => {
    setSelectedChatType(type);
    if (type === 'dm') {
      setSelectedUserId(id);
      setActiveChannelId(null);
      await fetchMessages(id);
      // Refresh conversations to update unread count badge
      await fetchConversations();
      // Reopen chat if it was closed
      const key = `dm-${id}`;
      if (closedChats.has(key)) {
        reopenChat('dm', id);
      }
    } else {
      setActiveChannelId(id);
      setSelectedUserId(null);
      await fetchChannelMessages(id);
      await fetchChannelMembers(id);
      // Mark channel as read to clear unread badge immediately
      await markChannelAsRead(id);
      // Reopen chat if it was closed
      const key = `channel-${id}`;
      if (closedChats.has(key)) {
        reopenChat('channel', id);
      }
    }
  };

  const handleMemberClick = async (userId: number) => {
    // Navigate to DM with this user (will create or open existing conversation)
    await handleSelectChat('dm', userId);
  };

  const handleSendMessage = (replyToId?: number, attachment?: { data: string; name: string; type: string } | null) => {
    if (!messageInput.trim() && !attachment) return;

    if (selectedChatType === 'dm' && selectedUserId) {
      sendMessage(selectedUserId, messageInput, replyToId, attachment);
      stopDMTyping(selectedUserId);
    } else if (selectedChatType === 'channel' && activeChannelId) {
      sendChannelMessage(activeChannelId, messageInput, replyToId, attachment);
      stopChannelTyping(activeChannelId);
    }

    setMessageInput('');

    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);

    if (selectedChatType === 'dm' && selectedUserId) {
      startDMTyping(selectedUserId);
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        stopDMTyping(selectedUserId);
      }, 2000);
    } else if (selectedChatType === 'channel' && activeChannelId) {
      startChannelTyping(activeChannelId);
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        stopChannelTyping(activeChannelId);
      }, 2000);
    }
  };

  const handlePinChat = async (type: 'dm' | 'channel', id: number) => {
    try {
      await togglePin(type, id);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleCloseChat = async (type: 'dm' | 'channel', id: number) => {
    try {
      await closeChat(type, id);
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  const handleReorderPins = async (reorderedChats: (Channel | (Conversation & { type: 'dm' | 'channel' }))[]) => {
    try {
      const orderedPins = reorderedChats.map((chat, index) => {
        const isChannel = 'channel_type' in chat;
        return {
          chat_type: isChannel ? 'channel' as const : 'dm' as const,
          chat_id: isChannel ? chat.id : chat.other_user_id,
          order: index
        };
      });

      await reorderPinsApi(orderedPins);
      // No need to refetch - optimistic update handles it
    } catch (error) {
      console.error('Error reordering pins:', error);
    }
  };

  // const handleStatusChange = async (status: string, customText?: string) => {
  //   try {
  //     await updateStatus(status, customText);
  //   } catch (error) {
  //     console.error('Error updating status:', error);
  //   }
  // };

  const handleUpdateAvatar = () => {
    setShowAvatarModal(true);
  };

  const handleCreateChannel = async (data: any) => {
    await createChannel(data);
    setShowCreateChannel(false);
  };

  const handleDeleteChannel = async () => {
    if (activeChannelId) {
      await deleteChannel(activeChannelId);
      setShowChannelSettings(false);
      setSelectedChatType('dm');
      setSelectedUserId(null);
      setActiveChannelId(null);
    }
  };

  const handleLeaveChannel = async () => {
    if (activeChannelId) {
      await leaveChannel(activeChannelId);
      setShowChannelSettings(false);
      setSelectedChatType('dm');
      setSelectedUserId(null);
      setActiveChannelId(null);
    }
  };

  const handleSaveChannelSettings = async (data: { name: string; purpose: string | null }) => {
    try {
      if (activeChannelId) {
        await updateChannel(activeChannelId, {
          name: data.name,
          channel_purpose: data.purpose,
        });
        // Refresh to get updated data
        await fetchChannels();
        await fetchChannelMessages(activeChannelId);
      }
    } catch (error) {
      console.error('Error saving channel settings:', error);
    }
  };

  const handleSaveChannelAvatar = async (data: {
    type: 'image' | 'emoji';
    imageFile?: string;
    emoji?: string;
    emojiColor?: string;
  }) => {
    try {
      if (activeChannelId) {
        await updateChannelAvatar(activeChannelId, data);
        // Refresh to get updated data
        await fetchChannels();
        await fetchChannelMessages(activeChannelId);
      }
    } catch (error) {
      console.error('Error saving channel avatar:', error);
    }
  };

  const handleSaveProfile = async (data: { firstName: string; lastName: string; phone: string }) => {
    try {
      if (!currentStaff?.id) return;
      
      const { staffApi } = await import('../../api/staff');
      await staffApi.update(currentStaff.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      // Refresh staff list
      await fetchStaffs();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleProfilePictureUpdate = async () => {
    try {
      // Refresh staff list to get updated profile pic
      await fetchStaffs();
      
      // Refresh conversations to update profile pics in DM list
      await fetchConversations();
      
      // If there's an active DM, refresh messages to update chat bubbles
      if (selectedChatType === 'dm' && selectedUserId) {
        await fetchMessages(selectedUserId);
      }
      
      // If there's an active channel, refresh channel messages
      if (selectedChatType === 'channel' && activeChannelId) {
        await fetchChannelMessages(activeChannelId);
      }
    } catch (error) {
      console.error('Error refreshing after profile picture update:', error);
    }
  };

  const handleSetReminder = (reminderMessage: string) => {
    setReminderInitialMessage(reminderMessage);
    setShowRemindersPanel(true);
  };

  return (
    <div className="absolute inset-0 flex bg-white light">
      {/* LeftSidebar - Always visible */}
      <LeftSidebar
          currentUserId={currentStaff?.id || 0}
          userName={userName}
          userInitials={`${currentStaff?.firstName?.[0] || ''}${currentStaff?.lastName?.[0] || ''}`}
          userFirstName={currentStaff?.firstName || ''}
          userLastName={currentStaff?.lastName || ''}
          userEmail={auth.user?.email || ''}
          userPhone={currentStaff?.phone || ''}
          userProfilePic={currentStaff?.profilePicUrl}
          currentStatus={currentStatus?.status_type || 'available'}
          customStatusText={currentStatus?.custom_status || ''}
          onStatusChange={updateStatus}
          pinnedChats={pinnedChatsList}
          openChats={openChatsList}
          conversations={conversations.map(c => ({ ...c, id: c.other_user_id }))}
          channels={channels}
          selectedChatId={selectedChatType === 'dm' ? selectedUserId : activeChannelId}
          selectedChatType={selectedChatType}
          staffMembers={[]}
          allStaff={allStaffForBrowse}
          onlineUsers={onlineUsers}
          onSelectChat={handleSelectChat}
          onPinChat={handlePinChat}
          onCloseChat={handleCloseChat}
          onShowCreateChannel={() => setShowCreateChannel(true)}
          onReorderPins={handleReorderPins}
          doNotDisturb={doNotDisturb}
          onToggleDoNotDisturb={onToggleDoNotDisturb}
          notificationPreferences={notificationPreferences}
          onSaveNotificationPreferences={onSaveNotificationPreferences}
          onSaveProfile={handleSaveProfile} 
          onProfilePictureUpdate={handleProfilePictureUpdate} 
        />

      {/* ChatArea Container - Always visible, centers and constrains width */}
      <div className="flex-1 flex justify-center bg-gray-100">
        <div className="w-full max-w-[1100px] flex flex-col">
          <ChatArea
            selectedChat={selectedChat as any}
            selectedChatType={selectedChatType}
            messages={selectedMessages}
            currentUserId={currentUserId || 0}
            currentUserProfilePic={currentStaff?.profilePicUrl}
            messageInput={messageInput}
            isConnected={isConnected}
            isTyping={isTyping}
            typingUsers={
              selectedChatType === 'channel' ? channelTypingUsers : []
            }
            channelMembers={selectedChatType === 'channel' ? channelMembers : []}
            onlineUsers={onlineUsers}
            allStaff={allStaffForBrowse}
            selectedUserStatus={selectedUserStatus}
            selectedUserCustomStatus={selectedUserCustomStatus}
            selectedUserPhone={selectedUserPhone}
            onMessageInputChange={handleTyping}
            onSendMessage={handleSendMessage}
            onOpenSettings={() => setShowChannelSettings(true)}
            onUpdateAvatar={handleUpdateAvatar}
            onAddChannelMember={async (userId: number) => {
              if (activeChannelId) {
                await addChannelMembers(activeChannelId, [userId]);
                // Refresh channel members after adding
                await fetchChannelMembers(activeChannelId);
              }
            }}
            onPinChat={handlePinChat}
            onLeaveChannel={handleLeaveChannel}
            onPromoteToAdmin={(userId) => promoteToAdmin(activeChannelId!, userId)}
            onDemoteFromAdmin={(userId) => demoteFromAdmin(activeChannelId!, userId)}
            onRemoveMember={(userId) => removeChannelMember(activeChannelId!, userId)}
            onSetPurpose={async (purpose: string) => {
              if (activeChannelId) {
                await updateChannel(activeChannelId, { channel_purpose: purpose });
                await fetchChannels();
              }
            }}
            onMemberClick={handleMemberClick}
            onSetReminder={handleSetReminder}
            currentUserFirstName={currentStaff?.firstName}
            currentUserLastName={currentStaff?.lastName}
          />
        </div>
      </div>
      
      {/* Reminders Panel */}
      {showRemindersPanel && (
        <RemindersPanel
          onClose={() => {
            setShowRemindersPanel(false);
            setReminderInitialMessage(undefined);
          }}
          upcomingReminders={upcomingReminders}
          completedReminders={completedReminders}
          onCreateReminder={createReminder}
          onCompleteReminder={completeReminder}
          availableTargets={availableTargets}
          initialMessage={reminderInitialMessage}
        />
      )}

      {/* Right Sidebar */}
      <RightSidebar onReminderClick={() => setShowRemindersPanel(true)} />

      {/* Settings Modal */}
      {selectedChatType === 'channel' && activeChannelId && (
        <ChannelSettingsModalSimple
          isOpen={showChannelSettings}
          onClose={() => setShowChannelSettings(false)}
          channelName={(selectedChat as Channel).name}
          channelPurpose={(selectedChat as Channel).channel_purpose || undefined}
          onSave={handleSaveChannelSettings}
          onDeleteChannel={handleDeleteChannel}
        />
      )}

      {/* Avatar Modal */}
      {selectedChatType === 'channel' && activeChannelId && (
        <UpdateChannelAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          channelName={selectedChat?.name || ''}
          currentAvatar={(selectedChat as Channel).channel_avatar_url || undefined}
          currentEmoji={(selectedChat as Channel).channel_emoji || undefined}
          currentEmojiColor={(selectedChat as Channel).channel_emoji_color || undefined}
          onSave={handleSaveChannelAvatar}
        />
      )}

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreateChannel={handleCreateChannel}
        staffMembers={staffForModal}
      />

    </div>
  );
};

export default MessagingPage;