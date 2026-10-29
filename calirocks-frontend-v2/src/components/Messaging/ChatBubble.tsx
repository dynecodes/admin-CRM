import { useState, useRef, useEffect } from "react";
import { Reply, Smile, Copy, MoreVertical, Download, FileText, Music, Edit2, Trash2, Star, Pin, Clock, Calendar, Eye } from "lucide-react";
import { getAvatarColor } from "../../utils/avatarColors";
import DOMPurify from 'dompurify';
import RichTextInput from "./RichTextInput"; 
import { format } from "date-fns";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import { Languages } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  users: number[];
}

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  senderName?: string;
  senderInitials?: string;
  senderProfilePic?: string | null;
  timestamp: string;
  isRead?: boolean;
  isChannelMessage?: boolean;
  senderId?: number;
  messageId?: number;
  reactions?: Reaction[];
  replyTo?: {
    id: number;
    message: string;
    senderName: string;
  };
  attachmentUrl?: string | null; 
  attachmentType?: 'image' | 'video' | 'audio' | 'file' | null; 
  attachmentName?: string | null;  
  currentUserId?: number;
  updatedAt?: string;
  channelName?: string;
  onReply?: (messageId: number, message: string, senderName: string) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onScrollToMessage?: (messageId: number) => void;
  onProfileClick?: (senderId: number) => void;
  onEdit?: (messageId: number, newMessage: string) => void; 
  onDelete?: (messageId: number) => void;
  onTranslate?: (text: string) => Promise<string>;
  onSetReminder?: (reminderMessage: string) => void;
}

export default function ChatBubble({
  message,
  isOwn,
  senderName,
  senderInitials,
  senderProfilePic,
  timestamp,
  isChannelMessage = false,
  senderId,
  messageId,
  reactions = [],
  replyTo,
  attachmentUrl, 
  attachmentType,  
  attachmentName,  
  currentUserId,
  updatedAt,
  channelName,
  onReply,
  onReact,
  onScrollToMessage,
  onProfileClick,
  onEdit,
  onDelete,
  onTranslate,
  onSetReminder
}: ChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editedMessage, setEditedMessage] = useState(message);  
  const moreDropdownRef = useRef<HTMLDivElement>(null); 
  const [translatedMessage, setTranslatedMessage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'down' | 'up'>('down');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleReact = (emoji: string) => {
    if (messageId && onReact) {
      onReact(messageId, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleReply = () => {
    if (messageId && onReply) {
      onReply(messageId, message, senderName || "User");
    }
  };

  const handleDownload = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedMessage(message); // Keep the HTML formatting
    setShowMoreDropdown(false);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (messageId && onEdit && editedMessage.trim() !== '') {
      onEdit(messageId, editedMessage);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMessage(message);
  };

  const handleTranslate = async () => {
    if (!onTranslate || isTranslating) return;
    
    setIsTranslating(true);
    try {
      const translated = await onTranslate(message);
      setTranslatedMessage(translated);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleTranslation = () => {
    if (translatedMessage) {
      setShowTranslation(!showTranslation);
    } else {
      handleTranslate();
    }
  };

  const handleSetReminder = () => {
    if (!onSetReminder) return;
    
    // Strip HTML tags from message for plain text
    const plainMessage = message.replace(/<[^>]*>/g, '');
    
    // Format: "Sender Name in Channel Name: Message In reply to Reply Name"
    let reminderText = '';
    
    if (channelName) {
      reminderText = `${senderName || 'User'} in ${channelName}: ${plainMessage}`;
    } else {
      reminderText = `${senderName || 'User'}: ${plainMessage}`;
    }
    
    if (replyTo) {
      reminderText += ` In reply to ${replyTo.senderName}`;
    }
    
    onSetReminder(reminderText);
    setShowMoreDropdown(false);
    setShowActions(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false);
      }
    };

    if (showMoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreDropdown]);

  const displayInitials = 
  senderName === "Reminder Bot" 
    ? "RB"  // Reminder Bot initials
    : isOwn && !isChannelMessage 
      ? "Me" 
      : senderInitials;
  const avatarColor = senderId ? getAvatarColor(senderId) : 'bg-red-600';

  const renderAttachment = () => {
    if (!attachmentUrl || !attachmentType) return null;

    switch (attachmentType) {
      case 'image':
        return (
          <div className="mt-2 max-w-[200px] md:max-w-sm">
            <img 
              src={attachmentUrl} 
              alt={attachmentName || 'Image attachment'} 
              className="rounded-lg border border-gray-200  cursor-pointer hover:opacity-90 transition-opacity w-full"
              onClick={handleDownload}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-2 max-w-[200px] md:max-w-sm">
            <video 
              controls 
              className="rounded-lg border border-gray-200  w-full"
            >
              <source src={attachmentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="mt-2 flex items-center gap-2 p-2 md:p-3 bg-gray-100  rounded-lg border border-gray-200  w-full max-w-[250px] md:max-w-xs">
            <Music className="w-4 h-4 md:w-5 md:h-5 text-gray-600  flex-shrink-0" />
            <audio controls className="flex-1 min-w-0 h-8">
              <source src={attachmentUrl} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      
      case 'file':
        return (
          <div 
            className="mt-2 flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-100  rounded-lg border border-gray-200  cursor-pointer hover:bg-gray-200  transition-colors max-w-[250px] md:max-w-xs"
            onClick={handleDownload}
          >
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-600  flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900  truncate">
                {attachmentName || 'File attachment'}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 ">
                Click to download
              </p>
            </div>
            <Download className="w-4 h-4 md:w-5 md:h-5 text-gray-600  flex-shrink-0" />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowEmojiPicker(false);
        setShowMoreDropdown(false); 
        setShowActions(false);      
      }}
      onClick={(e) => {
        // Only toggle on mobile if clicking the message area directly
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.group > div:first-child')) {
          setShowActions(!showActions);
        }
      }}
    >
      <div className="flex gap-2 md:gap-3 px-2 md:px-4 py-2 hover:bg-gray-50 ">
        {/* Avatar */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (senderId && onProfileClick && !isOwn) {
              onProfileClick(senderId);
            }
          }}
          className={!isOwn && senderId ? "cursor-pointer" : ""}
        >
          {senderProfilePic ? (
            <img 
              src={senderProfilePic}
              alt={senderName || 'User'}
              className="w-8 h-8 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-xs ${avatarColor}`}>
              {displayInitials}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 relative">
          {/* Sender name */}
          {isChannelMessage && senderName && (
            <p className="text-xs md:text-sm font-semibold text-gray-900  mb-1">
              {senderName}
            </p>
          )}
          
          {!isChannelMessage && (
          <p className="text-xs md:text-sm font-semibold text-gray-900  mb-1">
            {senderName === "Reminder Bot" 
              ? "Reminder Bot" 
              : isOwn 
                ? "Me" 
                : (senderName || "User")}
          </p>
        )}

          {/* Reply Context */}
          {replyTo && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onScrollToMessage && onScrollToMessage(replyTo.id);
              }}
              className="mb-2 pl-2 border-l-2 border-red-500 bg-gray-50  rounded p-1.5 md:p-2 cursor-pointer hover:bg-gray-100 "
            >
              <p className="text-[10px] md:text-xs font-semibold text-red-600 ">
                {replyTo.senderName}
              </p>
              <p className="text-[10px] md:text-xs text-gray-600  truncate">
                {replyTo.message.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {/* Message text or edit input */}
          {message && !isEditing && (
            <div className="inline-block">
              <div 
                className="text-xs md:text-sm text-gray-900 break-words rich-text-message inline"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(
                    showTranslation && translatedMessage ? translatedMessage : message,
                    {
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'a', 'font', 'strike'],
                      ALLOWED_ATTR: ['style', 'href', 'target', 'rel', 'color']
                    }
                  ).replace(/(@all|@online|@[A-Za-z]+(?:\s+[A-Za-z]+)?)/g, 
                    '<span class="font-bold text-red-600">$1</span>'
                  )
                }}
              />
              {showTranslation && translatedMessage && (
                <span className="ml-1 text-[9px] md:text-[10px] italic text-red-500">(translated)</span>
              )}
              {updatedAt && timestamp && (() => {
                const updatedTime = new Date(updatedAt).getTime();
                const createdTime = new Date(timestamp).getTime();
                return Math.abs(updatedTime - createdTime) > 1000;
              })() && !showTranslation && (
                <span className="ml-1 text-[9px] md:text-[10px] italic text-gray-400">(edited)</span>
              )}
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="space-y-2">
              <RichTextInput
                value={editedMessage}
                onChange={(value) => setEditedMessage(value)}
                onSend={() => {
                  if (editedMessage.trim() !== '') {
                    handleSaveEdit();
                  }
                }}
                placeholder="Edit your message..."
                disabled={false}
                hideAttachment={true}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Attachment */}
          {renderAttachment()}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction, idx) => {
                const userReacted = currentUserId && reaction.users.includes(currentUserId);
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(reaction.emoji);
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs border transition-colors ${
                      userReacted
                        ? 'bg-red-100  border-red-500'
                        : 'bg-gray-100  border-gray-300  hover:bg-gray-200 '
                    }`}
                  >
                    <span className="text-xs md:text-sm">{reaction.emoji}</span>
                    <span className="font-medium text-gray-700 ">
                      {reaction.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Timestamp - absolute positioned bottom right on hover */}
          {(isHovered || showActions) && !isEditing && (
            <span className="absolute bottom-0 right-0 text-[9px] md:text-[11px] text-gray-500 bg-white/80 px-1 rounded">
              {format(new Date(timestamp), "h:mm a")}
            </span>
          )}
        </div>

        {/* Hover/Click Actions - Desktop: hover, Mobile: click */}
        {(isHovered || showActions) && !isEditing && (
          <div className="absolute top-1 right-1 md:right-2 flex items-center gap-0.5 md:gap-1 bg-white  border border-gray-200  rounded-lg shadow-lg px-0.5 md:px-1 py-0.5 md:py-1">
            {/* Reply Button - FIRST for all messages */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReply();
                setShowActions(false);
              }}
              className="p-1 md:p-1.5 hover:bg-gray-100  rounded transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
            </button>

            {/* React Button - SECOND for all messages */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="p-1 md:p-1.5 hover:bg-gray-100  rounded transition-colors"
              title="React"
            >
              <Smile className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
            </button>

            {/* THIRD Button - Edit for own messages, Copy for others */}
            {isOwn ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="p-1 md:p-1.5 hover:bg-gray-100  rounded transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="p-1 md:p-1.5 hover:bg-gray-100  rounded transition-colors relative"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
                {showCopied && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900  text-white text-[10px] md:text-xs px-2 py-1 rounded whitespace-nowrap">
                    Copied!
                  </div>
                )}
              </button>
            )}

            {/* Translate Button */}
            {onTranslate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTranslation();
                }}
                className="p-1 md:p-1.5 hover:bg-gray-100 rounded transition-colors"
                title={showTranslation ? "Show Original" : "Translate"}
                disabled={isTranslating}
              >
                {isTranslating ? (
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Languages className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
                )}
              </button>
            )}

            {/* More Button - FOURTH (with dropdown) */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Calculate if dropdown should go up or down based on chat container
                  if (moreDropdownRef.current) {
                    const rect = moreDropdownRef.current.getBoundingClientRect();
                    const dropdownHeight = 280;
                    
                    // Find the chat container (the scrollable message area)
                    const chatContainer = moreDropdownRef.current.closest('.overflow-y-auto') || 
                                          moreDropdownRef.current.closest('[class*="overflow-auto"]');
                    
                    if (chatContainer) {
                      const containerRect = chatContainer.getBoundingClientRect();
                      const spaceBelow = containerRect.bottom - rect.bottom;
                      
                      if (spaceBelow < dropdownHeight) {
                        setDropdownPosition('up');
                      } else {
                        setDropdownPosition('down');
                      }
                    } else {
                      // Fallback to window calculation
                      const spaceBelow = window.innerHeight - rect.bottom;
                      if (spaceBelow < dropdownHeight) {
                        setDropdownPosition('up');
                      } else {
                        setDropdownPosition('down');
                      }
                    }
                  }
                  
                  setShowMoreDropdown(!showMoreDropdown);
                }}
                className="hidden md:block p-1 md:p-1.5 hover:bg-gray-100  rounded transition-colors"
                title="More"
              >
                <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 " />
              </button>

              {/* More Dropdown Menu */}
              {showMoreDropdown && (
                <div className={`absolute ${dropdownPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px] z-20`}>
                  {/* Different options for own messages vs others */}
                  {isOwn ? (
                    <>
                      {/* Own Message Dropdown */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy();
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(true);
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Favorite clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        <span>Favorite</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Pin clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pin className="w-4 h-4" />
                        <span>Pin this item</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetReminder();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Set Reminder</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Add to calendar clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Add to calendar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Read by clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Read by</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Other's Message Dropdown */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Favorite clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        <span>Favorite</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Pin clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pin className="w-4 h-4" />
                        <span>Pin this item</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetReminder();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Set Reminder</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Add to calendar clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Add to calendar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Read by clicked');
                          setShowMoreDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Read by</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute top-8 md:top-10 right-1 md:right-2 bg-white  border border-gray-200  rounded-lg shadow-xl p-1.5 md:p-2 flex gap-0.5 md:gap-1 z-10">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                  setShowActions(false);
                }}
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-gray-100  rounded transition-colors text-base md:text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (onDelete && messageId) {
            onDelete(messageId);
          }
          setShowDeleteModal(false);
        }}
        itemName="this message"
        itemType="message"
        message="Are you sure you want to delete this message? This action cannot be undone."
      />
    </div>
  );
}