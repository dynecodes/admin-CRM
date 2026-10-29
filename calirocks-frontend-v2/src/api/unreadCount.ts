import { privateService } from './api';

interface UnreadCount {
  total: number;
  dm: number;
  channels: number;
}

export const getGlobalUnreadCount = async (): Promise<UnreadCount> => {
  const response = await privateService.get("/unread-count");
  return response.data.data;
};