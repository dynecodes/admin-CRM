import { privateService } from './api';

export interface ClosedChat {
  chat_type: 'dm' | 'channel';
  chat_id: number;
  closed_at: string;
}

export const closedChatsApi = {
  // Get all closed chats for current user
  getClosedChats: async (): Promise<ClosedChat[]> => {
    const response = await privateService.get('/closed-chats');
    return response.data.data;
  },

  // Close a chat
  closeChat: async (chatType: 'dm' | 'channel', chatId: number): Promise<void> => {
    await privateService.post('/closed-chats/close', {
      chatType,
      chatId
    });
  },

  // Reopen a chat
  reopenChat: async (chatType: 'dm' | 'channel', chatId: number): Promise<void> => {
    await privateService.post('/closed-chats/reopen', {
      chatType,
      chatId
    });
  }
};