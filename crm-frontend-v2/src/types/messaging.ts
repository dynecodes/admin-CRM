export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  companyId: number;
  message: string;
  replyToId?: number | null;
  attachmentUrl?: string | null;  
  attachmentType?: 'image' | 'video' | 'audio' | 'file' | null; 
  attachmentName?: string | null;  
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  replyToMessage?: string | null;
  replyToSenderId?: number | null;
  replyToSenderFirstName?: string | null;
  replyToSenderLastName?: string | null;
}

export interface Conversation {
  other_user_id: number;
  firstName: string;
  lastName: string;
  role: string;
  profilePicUrl: string | null;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  isPinned?: boolean;
  email?: string;
}

export interface TypingStatus {
  userId: number;
  isTyping: boolean;
}

export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
}