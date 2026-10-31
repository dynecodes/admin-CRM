import { privateService } from './api';

export const channelsApi = {
  updateChannel: async (channelId: number, data: {
    name?: string;
    channel_purpose?: string | null;
  }): Promise<any> => {
    const response = await privateService.put(`/channels/${channelId}`, data);
    return response.data;
  },

  updateChannelAvatar: async (channelId: number, data: {
    type: 'image' | 'emoji';
    imageFile?: string;
    emoji?: string;
    emojiColor?: string;
  }): Promise<any> => {
    const response = await privateService.put(`/channels/${channelId}/avatar`, data);
    return response.data;
  }
};