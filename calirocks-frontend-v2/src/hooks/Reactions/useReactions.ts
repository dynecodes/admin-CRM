import { useState, useCallback } from 'react';
import usePrivateService from '../Auth/usePrivateService';

export interface Reaction {
  emoji: string;
  count: number;
  users: number[];
}

export function useReactions() {
  const privateService = usePrivateService();
  const [messageReactions, setMessageReactions] = useState<Map<number, Reaction[]>>(new Map());

  // Get reactions for a DM message
  const getDMMessageReactions = useCallback(async (messageId: number): Promise<Reaction[]> => {
    try {
      const response = await privateService.get(`/messageReactions/dm/${messageId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching DM reactions:', error);
      return [];
    }
  }, [privateService]);

  // Get reactions for a channel message
  const getChannelMessageReactions = useCallback(async (messageId: number): Promise<Reaction[]> => {
    try {
      const response = await privateService.get(`/messageReactions/channel/${messageId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching channel reactions:', error);
      return [];
    }
  }, [privateService]);

  // Add/update DM message reaction
  const addDMMessageReaction = useCallback(async (messageId: number, emoji: string): Promise<void> => {
    try {
      await privateService.post(`/messageReactions/dm/${messageId}`, { emoji });
    } catch (error) {
      console.error('Error adding DM reaction:', error);
      throw error;
    }
  }, [privateService]);

  // Add/update channel message reaction
  const addChannelMessageReaction = useCallback(async (messageId: number, emoji: string): Promise<void> => {
    try {
      await privateService.post(`/messageReactions/channel/${messageId}`, { emoji });
    } catch (error) {
      console.error('Error adding channel reaction:', error);
      throw error;
    }
  }, [privateService]);

  // Remove DM message reaction
  const removeDMMessageReaction = useCallback(async (messageId: number): Promise<void> => {
    try {
      await privateService.delete(`/messageReactions/dm/${messageId}`);
    } catch (error) {
      console.error('Error removing DM reaction:', error);
      throw error;
    }
  }, [privateService]);

  // Remove channel message reaction
  const removeChannelMessageReaction = useCallback(async (messageId: number): Promise<void> => {
    try {
      await privateService.delete(`/messageReactions/channel/${messageId}`);
    } catch (error) {
      console.error('Error removing channel reaction:', error);
      throw error;
    }
  }, [privateService]);

  return {
    messageReactions,
    setMessageReactions,
    getDMMessageReactions,
    getChannelMessageReactions,
    addDMMessageReaction,
    addChannelMessageReaction,
    removeDMMessageReaction,
    removeChannelMessageReaction
  };
}