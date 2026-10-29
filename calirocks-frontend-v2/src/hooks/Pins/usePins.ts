import { useState, useEffect, useCallback } from 'react';
import usePrivateService from '../Auth/usePrivateService';

interface PinnedChat {
  id: number;
  user_id: number;
  companyId: number;
  chat_type: 'dm' | 'channel';
  chat_id: number;
  pinned_at: string;
  display_order?: number | null;
}

export function usePins() {
  const privateService = usePrivateService();
  const [pinnedChats, setPinnedChats] = useState<Map<string, boolean>>(new Map());
  const [pinnedChatsOrder, setPinnedChatsOrder] = useState<Array<{ chat_type: 'dm' | 'channel'; chat_id: number; display_order: number | null }>>([]); // ADD THIS LINE
  const [loading, setLoading] = useState(true);

  const fetchPinnedChats = useCallback(async () => {
    try {
      const response = await privateService.get("/pins");
      
      const pinsMap = new Map<string, boolean>();
      const pinsOrderArray: Array<{ chat_type: 'dm' | 'channel'; chat_id: number; display_order: number | null }> = []; // ADD THIS
      
      // Check if response.data exists and has data property
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((pin: PinnedChat) => {
          const key = `${pin.chat_type}-${pin.chat_id}`;
          pinsMap.set(key, true);
          pinsOrderArray.push({  // ADD THIS
            chat_type: pin.chat_type,
            chat_id: pin.chat_id,
            display_order: pin.display_order ?? null
          });
        });
      }

      setPinnedChats(pinsMap);
      setPinnedChatsOrder(pinsOrderArray); // ADD THIS
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pinned chats:', error);
      // If 404 or error, just set empty map
      setPinnedChats(new Map());
      setPinnedChatsOrder([]); // ADD THIS
      setLoading(false);
    }
  }, [privateService]);

  useEffect(() => {
    fetchPinnedChats();
  }, [fetchPinnedChats]);

  const pinChat = useCallback(async (chatType: 'dm' | 'channel', chatId: number) => {
    try {
      await privateService.post("/pins/pin", { chatType, chatId });

      const key = `${chatType}-${chatId}`;
      setPinnedChats((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, true);
        return newMap;
      });
    } catch (error) {
      console.error('Error pinning chat:', error);
      throw error;
    }
  }, [privateService]);

  const unpinChat = useCallback(async (chatType: 'dm' | 'channel', chatId: number) => {
    try {
      await privateService.post("/pins/unpin", { chatType, chatId });

      const key = `${chatType}-${chatId}`;
      setPinnedChats((prev) => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    } catch (error) {
      console.error('Error unpinning chat:', error);
      throw error;
    }
  }, [privateService]);

  const togglePin = useCallback(async (chatType: 'dm' | 'channel', chatId: number) => {
    const key = `${chatType}-${chatId}`;
    if (pinnedChats.has(key)) {
      await unpinChat(chatType, chatId);
    } else {
      await pinChat(chatType, chatId);
    }
  }, [pinnedChats, pinChat, unpinChat]);

  const isPinned = useCallback((chatType: 'dm' | 'channel', chatId: number): boolean => {
    const key = `${chatType}-${chatId}`;
    return pinnedChats.has(key);
  }, [pinnedChats]);

  const reorderPins = useCallback(async (orderedPins: Array<{ chat_type: 'dm' | 'channel'; chat_id: number; order: number }>) => {
    try {
      // Optimistic update - update UI immediately
      const newOrder = orderedPins.map(pin => ({
        chat_type: pin.chat_type,
        chat_id: pin.chat_id,
        display_order: pin.order
      }));
      setPinnedChatsOrder(newOrder);
      
      // Save to backend in background
      await privateService.post("/pins/reorder", { orderedPins });
    } catch (error) {
      console.error('Error reordering pins:', error);
      // Revert on error
      await fetchPinnedChats();
      throw error;
    }
  }, [privateService, fetchPinnedChats]);

  return {
    pinnedChats,
    pinnedChatsOrder,
    loading,
    pinChat,
    unpinChat,
    togglePin,
    isPinned,
    fetchPinnedChats,
    reorderPins,
  };
}