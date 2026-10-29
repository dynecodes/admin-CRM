import { privateService } from './api';

interface NotificationPreferences {
  popupNotifications: boolean;
  notificationSound: boolean;
  selectedSound: string;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await privateService.get("/notification-preferences");
  return response.data.data;
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  const response = await privateService.put("/notification-preferences", preferences);
  return response.data.data;
};