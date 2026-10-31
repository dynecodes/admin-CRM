import { useState, useEffect, useCallback } from 'react';
import { closedChatsApi } from '../../api/closedChats';

export const useClosedChats = () => {
  const [closedChats, setClosedChats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch closed chats
  const fetchClosedChats = useCallback(async () => {
    try {
      setLoading(true);
      const chats = await closedChatsApi.getClosedChats();
      const closedSet = new Set(
        chats.map(chat => `${chat.chat_type}-${chat.chat_id}`)
      );
      setClosedChats(closedSet);
    } catch (error) {
      console.error('Error fetching closed chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Close a chat
  const closeChat = useCallback(async (type: 'dm' | 'channel', id: number) => {
    try {
      await closedChatsApi.closeChat(type, id);
      const key = `${type}-${id}`;
      setClosedChats(prev => new Set(prev).add(key));
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  }, []);

  // Reopen a chat
  const reopenChat = useCallback(async (type: 'dm' | 'channel', id: number) => {
    try {
      await closedChatsApi.reopenChat(type, id);
      const key = `${type}-${id}`;
      setClosedChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } catch (error) {
      console.error('Error reopening chat:', error);
    }
  }, []);

  // Fetch closed chats on mount
  useEffect(() => {
    fetchClosedChats();
  }, [fetchClosedChats]);

  return {
    closedChats,
    loading,
    closeChat,
    reopenChat,
    fetchClosedChats
  };
};