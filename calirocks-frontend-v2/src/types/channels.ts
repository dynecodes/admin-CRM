export type ChannelType = 'project' | 'department' | 'interest' | 'other';
export type ChannelAccessType = 'read-only' | 'read-write';

export interface Channel {
  id: number;
  name: string;
  description: string | null;
  channel_type: ChannelType;
  channel_access_type: ChannelAccessType;
  created_by: number;
  created_at: string;
  is_member: boolean;
  is_admin: boolean;
  member_count: number;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  channel_avatar_url?: string | null;
  channel_emoji?: string | null;
  channel_emoji_color?: string | null;
  channel_purpose?: string | null;
  isPinned?: boolean;
}

export interface ChannelMember {
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
  profilePicUrl: string | null;
  isAdmin: boolean;
  joinedAt: string;
}

export interface ChannelMessage {
  id: number;
  channelId: number;
  senderId: number | null;
  message: string;
  replyToId?: number | null;
  attachmentUrl?: string | null; 
  attachmentType?: 'image' | 'video' | 'audio' | 'file' | null; 
  attachmentName?: string | null; 
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  profilePicUrl?: string | null;
  replyToMessage?: string | null;
  replyToSenderId?: number | null;
  replyToSenderFirstName?: string | null;
  replyToSenderLastName?: string | null;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  channel_type: ChannelType;
  channel_access_type: ChannelAccessType;
  memberIds?: number[];
}

export interface ChannelTypingUser {
  userId: number;
  firstName: string;
  lastName: string;
}