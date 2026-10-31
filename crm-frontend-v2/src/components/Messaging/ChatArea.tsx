import { useRef, useEffect, useState } from "react";
import { Hash, X, Users, UserPlus, PhoneCall, Video, Bell } from "lucide-react";
import ChatBubble from "./ChatBubble";
import MessageDivider from "./MessageDivider";
import MentionDropdown from "./MentionDropdown";
import ChannelInfoDropdown from "./ChannelInfoDropdown";
import DMInfoDropdown from "./DMInfoDropdown";
import { addDateTimeDividers } from "../../utils/messageDividers";
import { Channel, ChannelMessage } from "../../types/channels";
import { Message, Conversation } from "../../types/messaging";
import { getAvatarColor } from "../../utils/avatarColors";
import { useReactions, Reaction } from "../../hooks/Reactions/useReactions";
import RichTextInput, { RichTextInputRef } from "./RichTextInput";
import { useCall } from "../../hooks/Calls/useCall";
import { IncomingCallModal } from "../Calls/IncomingCallModal";
import { ActiveCallScreen } from "../Calls/ActiveCallScreen";
import { useMessaging } from "../../hooks/Messaging/useMessaging";
import { useChannels } from "../../hooks/Channels/useChannels";
import usePrivateService from "../../hooks/Auth/usePrivateService";

interface ChatAreaProps {
  selectedChat: (Channel | Conversation) | null;
  selectedChatType: 'dm' | 'channel';
  messages: ChannelMessage[] | Message[];
  currentUserId: number;
  currentUserProfilePic?: string | null;
  currentUserFirstName?: string;
  currentUserLastName?: string;
  messageInput: string;
  isConnected: boolean;
  isTyping: boolean;
  typingUsers?: Array<{ id?: number; firstName: string; lastName: string }>;
  channelMembers?: any[];
  onlineUsers?: Set<number>;
  allStaff?: any[];
  selectedUserStatus?: string;
  selectedUserCustomStatus?: string | null;
  selectedUserPhone?: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: (replyToId?: number, attachment?: { data: string; name: string; type: string } | null) => void;
  onOpenSettings?: () => void;
  onAddChannelMember?: (userId: number) => Promise<void>;
  onPinChat?: (type: 'dm' | 'channel', id: number) => void;
  onLeaveChannel?: () => void;
  onPromoteToAdmin?: (userId: number) => void;
  onDemoteFromAdmin?: (userId: number) => void;
  onRemoveMember?: (userId: number) => void;
  onUpdateAvatar?: () => void;
  onSetPurpose?: (purpose: string) => Promise<void>;
  onMemberClick?: (userId: number) => void;
  onSetReminder?: (reminderMessage: string) => void;
}

interface ReplyState {
  messageId: number;
  message: string;
  senderName: string;
}

export default function ChatArea({
  selectedChat,
  selectedChatType,
  messages,
  currentUserId,
  currentUserProfilePic,
  currentUserFirstName,
  currentUserLastName,
  messageInput,
  isConnected,
  isTyping,
  typingUsers = [],
  channelMembers = [],
  onlineUsers = new Set(),
  allStaff = [],
  selectedUserStatus,
  selectedUserCustomStatus,
  selectedUserPhone,
  onMessageInputChange,
  onSendMessage,
  onOpenSettings,
  onAddChannelMember,
  onPinChat,
  onLeaveChannel,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onRemoveMember,
  onUpdateAvatar,
  onSetPurpose,
  onMemberClick,
  onSetReminder,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const richTextInputRef = useRef<RichTextInputRef>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyState | null>(null);
  const [messageReactions, setMessageReactions] = useState<Map<number, Reaction[]>>(new Map());
  const { editMessage, deleteMessage } = useMessaging();
  const { editChannelMessage, deleteChannelMessage } = useChannels();
  const privateService = usePrivateService();

  // Use the reactions hook
  const {
    getDMMessageReactions,
    getChannelMessageReactions,
    addDMMessageReaction,
    addChannelMessageReaction,
    removeDMMessageReaction,
    removeChannelMessageReaction
  } = useReactions();
  
  // Use the call hook
  const {
    callStatus,
    currentCall,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callStartTime,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  // Mention dropdown state - KEEPING YOUR ORIGINAL FUNCTIONALITY
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [_cursorPosition, setCursorPosition] = useState(0);

  // New dropdown and modal states
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  // const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [expandedSystemGroups, setExpandedSystemGroups] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load reactions for all messages when messages change (IN PARALLEL - FAST!)
  useEffect(() => {
    const loadReactions = async () => {
      if (messages.length === 0) return;

      // Fetch all reactions in parallel instead of one by one
      const reactionPromises = messages.map(async (message) => {
        try {
          const reactions = selectedChatType === 'dm'
            ? await getDMMessageReactions(message.id)
            : await getChannelMessageReactions(message.id);
          
          return { messageId: message.id, reactions };
        } catch (error) {
          console.error(`Error loading reactions for message ${message.id}:`, error);
          return { messageId: message.id, reactions: [] };
        }
      });

      // Wait for all reactions to load at once
      const results = await Promise.all(reactionPromises);
      
      // Build the reactions map
      const reactionsMap = new Map<number, Reaction[]>();
      results.forEach(({ messageId, reactions }) => {
        if (reactions && reactions.length > 0) {
          reactionsMap.set(messageId, reactions);
        }
      });
      
      setMessageReactions(reactionsMap);
    };

    loadReactions();
  }, [messages, selectedChatType, getDMMessageReactions, getChannelMessageReactions]);

  const handleReply = (messageId: number, message: string, senderName: string) => {
    setReplyingTo({ messageId, message, senderName });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleTranslate = async (text: string): Promise<string> => {
    const response = await privateService.post('/translation', {
      text,
      targetLang: 'EN'
    });
    return response.data.data.translatedText;
  };

  const handleEditMessage = (messageId: number, newMessage: string) => {
    if (selectedChatType === 'channel' && selectedChat) {
      editChannelMessage((selectedChat as Channel).id, messageId, newMessage);
    } else if (selectedChatType === 'dm' && selectedChat) {
      editMessage(messageId, newMessage, (selectedChat as Conversation).other_user_id);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (selectedChatType === 'channel' && selectedChat) {
      deleteChannelMessage((selectedChat as Channel).id, messageId);
    } else if (selectedChatType === 'dm' && selectedChat) {
      deleteMessage(messageId, (selectedChat as Conversation).other_user_id);
    }
  };

  const handleReact = async (messageId: number, emoji: string) => {
    try {
      // Get current reactions for this message
      const currentReactions = messageReactions.get(messageId) || [];
      const userReaction = currentReactions.find(r => r.users.includes(currentUserId));

      if (userReaction && userReaction.emoji === emoji) {
        // User clicked the same emoji - remove reaction
        if (selectedChatType === 'dm') {
          await removeDMMessageReaction(messageId);
        } else {
          await removeChannelMessageReaction(messageId);
        }
      } else {
        // User clicked a different emoji or has no reaction - add/update reaction
        if (selectedChatType === 'dm') {
          await addDMMessageReaction(messageId, emoji);
        } else {
          await addChannelMessageReaction(messageId, emoji);
        }
      }

      // Reload reactions for this message
      let updatedReactions: Reaction[];
      if (selectedChatType === 'dm') {
        updatedReactions = await getDMMessageReactions(messageId);
      } else {
        updatedReactions = await getChannelMessageReactions(messageId);
      }

      setMessageReactions(prev => {
        const newMap = new Map(prev);
        if (updatedReactions.length > 0) {
          newMap.set(messageId, updatedReactions);
        } else {
          newMap.delete(messageId);
        }
        return newMap;
      });

    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleScrollToMessage = (messageId: number) => {
    const element = messageRefs.current.get(messageId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message briefly
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
      }, 2000);
    }
  };

  // KEEPING YOUR ORIGINAL handleInputChange - WITH MENTION DETECTION
  const handleInputChange = (value: string) => {
    onMessageInputChange(value);
    
    // Extract plain text from HTML for mention detection
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // For contentEditable, we check at the end of the text
    const cursorPos = plainText.length;
    setCursorPosition(cursorPos);
    
    // Check if @ was typed
    const textBeforeCursor = plainText.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      
      // Only show dropdown if no space after @
      if (!searchText.includes(' ') && searchText.length >= 0) {
        setShowMentionDropdown(true);
        setMentionSearch(searchText);
        
        // Get position from the RichTextInput editor
        const editor = richTextInputRef.current?.getEditorElement();
        if (editor) {
          const rect = editor.getBoundingClientRect();
          setMentionPosition({
            top: rect.top - 320,
            left: rect.left + 10,
          });
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // KEEPING YOUR ORIGINAL handleMentionSelect
  const handleMentionSelect = (mention: { type: 'all' | 'online' | 'user'; userId?: number; displayName?: string }) => {
    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageInput;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const lastAtIndex = plainText.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = plainText.slice(0, lastAtIndex);
      const mentionText = `@${mention.displayName} `;
      const newText = beforeMention + mentionText;
      
      onMessageInputChange(newText);
      setShowMentionDropdown(false);
    }
  };

  // KEEPING YOUR ORIGINAL handleAddMember
  const handleAddMember = async (userId: number) => {
    if (onAddChannelMember) {
      await onAddChannelMember(userId);
    }
  };

  const handleAddMemberFromHeader = async (userId: number) => {
    await handleAddMember(userId);
    setIsAddMode(false);
    setAddMemberSearch('');
  };

  const handleSetPurpose = async (purpose: string) => {
    if (onSetPurpose) {
      await onSetPurpose(purpose);
    }
  };

  const handlePinChat = () => {
    if (onPinChat && selectedChat) {
      const id = selectedChatType === 'dm' 
        ? (selectedChat as Conversation).other_user_id 
        : (selectedChat as Channel).id;
      onPinChat(selectedChatType, id);
    }
  };

  const handleLeaveChannel = () => {
    if (onLeaveChannel) {
      onLeaveChannel();
    }
  };

  const handleSendMail = () => {
    console.log('Send mail to channel members');
    // TODO: Connect to backend API
  };

  const handleMakeAdmin = (userId: number) => {
    if (onPromoteToAdmin) {
      onPromoteToAdmin(userId);
    }
  };

  const handleRemoveAdmin = (userId: number) => {
    if (onDemoteFromAdmin) {
      onDemoteFromAdmin(userId);
    }
  };

  const handleRemoveMember = (userId: number) => {
    if (onRemoveMember) {
      onRemoveMember(userId);
    }
  };

  const handleAudioCall = () => {
    if (selectedChatType === 'dm' && selectedChat) {
      const dmChat = selectedChat as Conversation;
      initiateCall(dmChat.other_user_id, 'voice', {
        userId: dmChat.other_user_id,
        firstName: dmChat.firstName,
        lastName: dmChat.lastName,
        profilePicUrl: dmChat.profilePicUrl,
      });
    } else if (selectedChatType === 'channel') {
      console.log('Channel calls coming soon!');
      // TODO: Implement channel calls
    }
  };

  const handleVideoCall = () => {
    if (selectedChatType === 'dm' && selectedChat) {
      const dmChat = selectedChat as Conversation;
      initiateCall(dmChat.other_user_id, 'video', {
        userId: dmChat.other_user_id,
        firstName: dmChat.firstName,
        lastName: dmChat.lastName,
        profilePicUrl: dmChat.profilePicUrl,
      });
    } else if (selectedChatType === 'channel') {
      console.log('Channel calls coming soon!');
      // TODO: Implement channel calls
    }
  };

  const handleNotificationToggle = () => {
    console.log('Toggle notifications');
    // TODO: Implement notification toggle
  };

  const groupSystemMessages = (msgs: any[]) => {
    const groups: Array<{ messages: any[]; firstIndex: number }> = [];
    let currentGroup: any[] = [];
    let firstIndex = -1;

    msgs.forEach((msg, index) => {
      if ('senderId' in msg && (msg.senderId === null || msg.senderId === 0)) {
        if (currentGroup.length === 0) {
          firstIndex = index;
        }
        currentGroup.push(msg);
      } else {
        if (currentGroup.length > 0) {
          groups.push({ messages: [...currentGroup], firstIndex });
          currentGroup = [];
          firstIndex = -1;
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ messages: [...currentGroup], firstIndex });
    }

    return groups;
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white  overflow-hidden">
        <div className="text-center text-gray-500">
          <p className="text-base">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const isChannel = 'channel_type' in selectedChat;
  const isReadOnlyChannel = isChannel && (selectedChat as Channel).channel_access_type === 'read-only';
  const canViewChannelInfo = isChannel && ((selectedChat as Channel).is_admin || (selectedChat as Channel).created_by === currentUserId);
  const shouldShowChannelInfo = !isReadOnlyChannel || canViewChannelInfo;
  const chatName = isChannel ? selectedChat.name : `${selectedChat.firstName} ${selectedChat.lastName}`;

  const messagesWithDividers = addDateTimeDividers(messages as any[]);

  // Check if current user can send messages in this channel
  const canSendMessage = selectedChatType === 'dm' 
    ? true 
    : selectedChatType === 'channel' && selectedChat && 'channel_access_type' in selectedChat
      ? selectedChat.channel_access_type === 'read-write' || selectedChat.is_admin || selectedChat.created_by === currentUserId
      : true;

  // Filter staff for add member dropdown
  const filteredStaff = allStaff.filter(staff =>
    !channelMembers.some(m => m.userId === staff.id) &&
    (staff.firstName.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
     staff.lastName.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
     staff.email.toLowerCase().includes(addMemberSearch.toLowerCase()))
  );
      
  return (
    <div className="flex-1 flex flex-col bg-white  overflow-hidden relative">
      {/* Header */}
      <div className="bg-white  border-b border-gray-200  p-2 md:p-4 flex items-center justify-between flex-shrink-0">
        {/* Left side */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 relative min-w-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              {/* Avatar - Clickable for Info Dropdown */}
              <button
                onClick={() => shouldShowChannelInfo && setShowInfoDropdown(!showInfoDropdown)}
                className={`${shouldShowChannelInfo ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} transition-opacity flex-shrink-0`}
              >
                {isChannel ? (
                  (() => {
                    const channel = selectedChat as Channel;
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
                    const bgColorClass = channel.channel_emoji && channel.channel_emoji_color 
                      ? (bgColorMap[channel.channel_emoji_color] || 'bg-indigo-500')
                      : 'bg-indigo-500';

                    return (
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-md ${bgColorClass} flex items-center justify-center`}>
                        {channel.channel_emoji ? (
                          <span className="text-2xl">{channel.channel_emoji}</span>
                        ) : channel.channel_avatar_url ? (
                          <img 
                            src={channel.channel_avatar_url}
                            alt="channel" 
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <Hash className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    {selectedChat.profilePicUrl ? (
                      <img 
                        src={selectedChat.profilePicUrl}
                        alt={`${selectedChat.firstName} ${selectedChat.lastName}`}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-md ${getAvatarColor(selectedChat.other_user_id || 0)} flex items-center justify-center text-white font-semibold text-xs md:text-sm`}>
                        {selectedChat.firstName?.[0]}{selectedChat.lastName?.[0]}
                      </div>
                    )}
                  </div>
                )}
              </button>

              {/* Name and Info - NOT clickable */}
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900  text-sm md:text-base truncate">{chatName}</p>
                {isChannel && (
                  <div className="text-xs md:text-sm text-gray-500  flex items-center gap-1 md:gap-2 flex-1 min-w-0 relative">
                    {!isAddMode ? (
                      // Normal view: member count, Add button, and purpose
                      <>
                        {shouldShowChannelInfo && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            <span>{(selectedChat as Channel).member_count}</span>
                            {!!(selectedChat as Channel).is_admin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAddMode(true);
                                }}
                                className="ml-1 flex items-center gap-0.5 text-red-600  hover:text-red-700 "
                              >
                                <UserPlus className="w-3 h-3" />
                                <span className="text-xs hidden sm:inline">Add</span>
                              </button>
                            )}
                          </span>
                        )}
                        {/* Channel Purpose */}
                        {(selectedChat as Channel).channel_purpose && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] md:max-w-xs">{(selectedChat as Channel).channel_purpose}</span>
                          </>
                        )}
                      </>
                    ) : (
                      // Add mode: inline search input (keep member count visible)
                      <>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Users className="w-3 h-3" />
                          <span>{(selectedChat as Channel).member_count}</span>
                        </span>
                        {/* <span>•</span> */}
                        <div className="flex items-center gap-2 min-w-0 relative max-w-[200px] md:max-w-[280px]">
                          <input
                            type="text"
                            placeholder="Search to add..."
                            value={addMemberSearch}
                            onChange={(e) => setAddMemberSearch(e.target.value)}
                            onBlur={() => {
                              // Delay to allow clicking on dropdown items
                              setTimeout(() => {
                                setIsAddMode(false);
                                setAddMemberSearch('');
                              }, 200);
                            }}
                            autoFocus
                            className="flex-1 px-2 md:px-3 py-0 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-gray-300 bg-white text-gray-900 min-w-0 h-5 leading-tight placeholder:text-xs"
                          />
                          
                          {/* Dropdown results */}
                          {addMemberSearch && (
                            <div className="absolute top-full left-0 mt-1 bg-white  border border-gray-200  rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto w-64">
                              {filteredStaff.length > 0 ? (
                                filteredStaff.map((staff) => (
                                  <button
                                    key={staff.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleAddMemberFromHeader(staff.id);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100  transition-colors flex items-center gap-2"
                                  >
                                    {staff.profilePicUrl ? (
                                      <img
                                        src={staff.profilePicUrl}
                                        alt={`${staff.firstName} ${staff.lastName}`}
                                        className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900  truncate">
                                        {staff.firstName} {staff.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500  truncate">{staff.email}</p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500  text-center py-3">No results</p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Right side icons - Smaller on mobile */}
        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
          <button
            onClick={handleAudioCall}
            className="p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors"
            title="Start an audio conference"
          >
            <PhoneCall className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors"
            title="Start a video conference"
          >
            <Video className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
          </button>

          {isChannel && (
            <button
              onClick={handleNotificationToggle}
              className="p-1.5 md:p-2 hover:bg-gray-100  rounded-md transition-colors hidden sm:flex"
              title="All new messages will notify you"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600 " />
            </button>
          )}
        </div>
      </div>

      {/* Info Dropdowns */}
      {isChannel ? (
        <ChannelInfoDropdown
          isOpen={showInfoDropdown}
          onClose={() => setShowInfoDropdown(false)}
          channelName={chatName}
          channelAvatar={(selectedChat as Channel).channel_avatar_url || undefined}
          channelEmoji={(selectedChat as Channel).channel_emoji || undefined}
          channelEmojiColor={(selectedChat as Channel).channel_emoji_color || undefined}
          channelPurpose={(selectedChat as Channel).channel_purpose || undefined}
          memberCount={(selectedChat as Channel).member_count || 0}
          members={channelMembers}
          isAdmin={(selectedChat as Channel).is_admin || false}
          currentUserId={currentUserId}
          onUpdateAvatar={() => onUpdateAvatar?.()}
          onSetPurpose={handleSetPurpose}
          onOpenSettings={() => {
            if (onOpenSettings) onOpenSettings();
            setShowInfoDropdown(false);
          }}
          onPinChannel={handlePinChat}
          onLeaveChannel={handleLeaveChannel}
          onSendMail={handleSendMail}
          onMakeAdmin={handleMakeAdmin}
          onRemoveAdmin={handleRemoveAdmin}
          onRemoveMember={handleRemoveMember}
          onMemberClick={(userId) => {
            onMemberClick?.(userId);
            setShowInfoDropdown(false);
          }}
        />
      ) : (
        <DMInfoDropdown
          isOpen={showInfoDropdown}
          onClose={() => setShowInfoDropdown(false)}
          firstName={(selectedChat as Conversation).firstName}
          lastName={(selectedChat as Conversation).lastName}
          profilePicUrl={(selectedChat as Conversation).profilePicUrl || undefined}
          status={selectedUserStatus || 'available'}
          customStatusText={selectedUserCustomStatus || undefined}
          email={(selectedChat as Conversation).email || ''}
          phoneNumber={selectedUserPhone || undefined}
          userId={(selectedChat as Conversation).other_user_id}
          onPinChat={handlePinChat}
          onAudioCall={handleAudioCall}
          onVideoCall={handleVideoCall}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white  [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 &::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-300 &::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 &::-webkit-scrollbar-thumb]:hover:bg-gray-500">
        <div className="min-h-full flex flex-col justify-end">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-base">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messagesWithDividers.map((item, index) => {
              if (item.type === 'date-divider') {
                return (
                  <MessageDivider
                    key={`date-${index}`}
                    text={item.dividerText!}
                    type="date"
                    date={item.dividerDate}
                  />
                );
              }
              if (item.type === 'time-divider') {
                return (
                  <MessageDivider
                    key={`time-${index}`}
                    text={item.dividerText!}
                    type="time"
                  />
                );
              }

              const message = item.data;
              if (!message) return null;

              // System message
              if ('senderId' in message && (message.senderId === null || message.senderId === 0)) {
                // Find if this message is part of a group
                const systemGroups = groupSystemMessages(messages);
                const messageGroup = systemGroups.find(g => 
                  g.messages.some(m => m.id === message.id)
                );

                if (messageGroup && messageGroup.messages.length > 1) {
                  // This is part of a group - only render once for the last message
                  const isLastInGroup = messageGroup.messages[messageGroup.messages.length - 1].id === message.id;
                  
                  if (!isLastInGroup) {
                    return null; // Skip rendering non-last messages
                  }

                  const groupKey = messageGroup.firstIndex;
                  const isExpanded = expandedSystemGroups.has(groupKey);

                  return (
                    <div key={`system-group-${groupKey}`} className="flex justify-center my-2 px-2">
                      <div className="text-center">
                        {isExpanded ? (
                          // Show all messages when expanded
                          <>
                            {messageGroup.messages.map((msg, idx) => {
                              const isLast = idx === messageGroup.messages.length - 1;
                              return (
                                <div key={msg.id} className={`flex items-center justify-center gap-2 ${isLast ? '' : 'py-0.5'}`}>
                                  <p className="text-[11px] text-gray-500 ">
                                    {msg.message}
                                  </p>
                                  {isLast && (
                                    <button
                                      onClick={() => {
                                        const newSet = new Set(expandedSystemGroups);
                                        newSet.delete(groupKey);
                                        setExpandedSystemGroups(newSet);
                                      }}
                                      className="text-[11px] text-gray-600  hover:underline"
                                    >
                                      Hide All
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          // Show only last message with Show All link on same row
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-[11px] text-gray-500 ">
                              {message.message}
                            </p>
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedSystemGroups);
                                newSet.add(groupKey);
                                setExpandedSystemGroups(newSet);
                              }}
                              className="text-[11px] text-gray-600  hover:underline"
                            >
                              Show All ({messageGroup.messages.length})
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // Single system message (not part of a group)
                  return (
                    <div key={message.id} className="flex justify-center my-2 px-2">
                      <p className="text-[11px] text-gray-500  text-center py-0.5">
                        {message.message}
                      </p>
                    </div>
                  );
                }
              }

              const isOwnMessage =
                'senderId' in message ? message.senderId === currentUserId : (message as any).senderId === currentUserId;

              // Get reply info from backend data (already included in message)
              let replyToInfo = undefined;
              const replyToId = (message as any).replyToId;
              const replyToMessage = (message as any).replyToMessage;
              const replyToSenderId = (message as any).replyToSenderId;
              const replyToSenderFirstName = (message as any).replyToSenderFirstName;
              const replyToSenderLastName = (message as any).replyToSenderLastName;

              if (replyToId && replyToMessage) {
                // Backend provides the full reply details
                const isRepliedOwn = replyToSenderId === currentUserId;
                replyToInfo = {
                  id: replyToId,
                  message: replyToMessage,
                  senderName: isRepliedOwn 
                    ? 'Me' 
                    : (replyToSenderFirstName && replyToSenderLastName)
                      ? `${replyToSenderFirstName} ${replyToSenderLastName}`
                      : 'Unknown'
                };
              }

              return (
                <div 
                  key={message.id}
                  ref={(el) => {
                    if (el) messageRefs.current.set(message.id, el);
                    else messageRefs.current.delete(message.id);
                  }}
                  className="transition-colors duration-500"
                >
                  <ChatBubble
                    message={message.message || ''}
                    isOwn={isOwnMessage}
                    senderId={'senderId' in message ? message.senderId : (message as any).senderId}
                    messageId={message.id}
                    senderName={
                      isChannel
                        ? // For channels, show everyone's name from message data
                        (message as any).firstName && (message as any).lastName
                        ? `${(message as any).firstName} ${(message as any).lastName}`
                        : undefined
                        : // For DMs, show appropriate name
                        isOwnMessage && currentUserFirstName && currentUserLastName
                        ? `${currentUserFirstName} ${currentUserLastName}`
                        : !isOwnMessage && selectedChat.firstName && selectedChat.lastName
                        ? `${selectedChat.firstName} ${selectedChat.lastName}`
                        : undefined
                    }
                    senderInitials={
                      isChannel
                        ? // For channels, use message data
                        (message as any).firstName && (message as any).lastName
                        ? `${(message as any).firstName[0]}${(message as any).lastName[0]}`
                        : undefined
                        : // For DMs, use selectedChat data
                        !isOwnMessage && selectedChat.firstName && selectedChat.lastName
                        ? `${selectedChat.firstName[0]}${selectedChat.lastName[0]}`
                        : undefined
                    }
                    senderProfilePic={
                      isOwnMessage
                        ? currentUserProfilePic  // Show current user's profile pic for own messages
                        : isChannel
                        ? (message as any).profilePicUrl || null
                        : selectedChat.profilePicUrl || null
                    }
                    timestamp={message.createdAt}
                    updatedAt={(message as any).updatedAt} 
                    isRead={'isRead' in message ? (message as any).isRead : undefined}
                    isChannelMessage={isChannel}
                    channelName={isChannel ? (selectedChat as Channel).name : undefined}
                    reactions={messageReactions.get(message.id) || []}
                    replyTo={replyToInfo}
                    attachmentUrl={(message as any).attachmentUrl || null}  
                    attachmentType={(message as any).attachmentType || null}  
                    attachmentName={(message as any).attachmentName || null}
                    currentUserId={currentUserId}
                    onReply={handleReply}
                    onReact={handleReact}
                    onScrollToMessage={handleScrollToMessage}
                    onProfileClick={(senderId) => {
                      if (onMemberClick && selectedChatType === 'channel') {
                        onMemberClick(senderId);
                      }
                    }}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onTranslate={handleTranslate}
                    onSetReminder={onSetReminder}
                  />
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 px-4 py-2">
                <div className={`w-8 h-8 rounded-md ${typingUsers[0]?.id ? getAvatarColor(typingUsers[0].id) : 'bg-gray-300 '} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                  {typingUsers[0]?.firstName[0]}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-gray-600  mb-1">
                    {typingUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')} typing...
                  </p>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      </div>

      {/* Input */}
      <div className="bg-white p-2 md:p-4 flex-shrink-0">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-100  rounded-md flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-xs font-semibold text-red-600 ">
                Replying to {replyingTo.senderName}
              </p>
              <p className="text-xs md:text-sm text-gray-600  truncate">
                {replyingTo.message.replace(/<[^>]*>/g, '')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelReply}
              className="ml-2 p-1 hover:bg-gray-200  rounded"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 text-gray-500 " />
            </button>
          </div>
        )}

        {/* Check if user can send messages (read-only channel check) */}
        {!canSendMessage && selectedChatType === 'channel' ? (
          <div className="flex items-center gap-2 p-2 md:p-3 bg-gray-100  rounded-lg">
            <div className="text-xs md:text-sm text-gray-500 ">
              This is a read-only channel. Only admins can send messages.
            </div>
          </div>
        ) : (
          <RichTextInput
            ref={richTextInputRef}
            value={messageInput}
            onChange={handleInputChange}
            onSend={(attachment) => {
              if (messageInput.trim() || attachment) {
                onSendMessage(replyingTo?.messageId, attachment);
                setReplyingTo(null);
              }
            }}
            disabled={!isConnected}
            placeholder="Type a message..."
          />
        )}

        {/* KEEPING YOUR ORIGINAL MENTION DROPDOWN */}
        {showMentionDropdown && selectedChatType === 'channel' && (
          <MentionDropdown
            channelMembers={channelMembers.map(m => ({
              id: m.userId || m.user_id,
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email,
              isOnline: onlineUsers?.has(m.userId || m.user_id),
              isInChannel: true,
            }))}
            allStaff={allStaff.map(s => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              email: s.email,
              isOnline: onlineUsers?.has(s.id),
            }))}
            searchQuery={mentionSearch}
            isAdmin={selectedChat && 'is_admin' in selectedChat ? selectedChat.is_admin : false}
            onSelect={handleMentionSelect}
            onAddMember={handleAddMember}
            onClose={() => setShowMentionDropdown(false)}
            position={mentionPosition}
          />
        )}
      </div>
      {/* Call Modals */}
      {callStatus === 'ringing' && (
        <IncomingCallModal
          incomingCall={currentCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {(callStatus === 'calling' || callStatus === 'active') && remoteUser && (
        <ActiveCallScreen
          callType={callType!}
          remoteUser={remoteUser}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          callStartTime={callStartTime}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
        />
      )}
    </div>
  );
}