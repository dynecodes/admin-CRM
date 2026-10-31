import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketProvider';
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/notificationPreferences';
import { getDoNotDisturb, updateDoNotDisturb } from '../../api/userStatus';
import { getGlobalUnreadCount } from '../../api/unreadCount';
import { playNotificationSound } from '../../utils/notificationSounds';
import usePrivateService from '../Auth/usePrivateService';
import useAuth from '../Auth/useAuth';

interface NotificationPreferences {
  popupNotifications: boolean;
  notificationSound: boolean;
  selectedSound: string;
}

interface NotificationBannerData {
  id: string;
  type: 'dm' | 'channel';
  chatId: number;
  chatName: string;
  message: string;
  senderName: string;
  senderProfilePic?: string;
}

interface UnreadCount {
  total: number;
  dm: number;
  channels: number;
}

export const useNotifications = () => {
  const { socket } = useSocket();
  const privateService = usePrivateService();
  const { auth }: any = useAuth();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    popupNotifications: true,
    notificationSound: true,
    selectedSound: 'Ta-da-dum'
  });
  
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [notificationBanners, setNotificationBanners] = useState<NotificationBannerData[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({ total: 0, dm: 0, channels: 0 });

    // Load preferences on mount - ONLY when socket is connected AND auth token exists
    useEffect(() => {
    if (!socket || !auth?.accessToken) {
        // Socket not connected yet or no auth token, skip loading
        return;
    }

    // Small delay to ensure axios interceptors are set up
    const timer = setTimeout(() => {
        loadPreferences();
        loadDoNotDisturb();
        loadUnreadCount();
    }, 500);

    return () => clearTimeout(timer);
    }, [socket, auth?.accessToken]);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error: any) {
      // Silently fail on 401 (not authenticated), log other errors
      if (error?.response?.status !== 401) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  };

  const loadDoNotDisturb = async () => {
    try {
      const data = await getDoNotDisturb(privateService);
      setDoNotDisturb(data.doNotDisturb);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to load DND status:', error);
      }
    }
  };

    const loadUnreadCount = useCallback(async () => {
    try {
        console.log('Loading unread count...');
        const count = await getGlobalUnreadCount();
        console.log('Unread count loaded:', count);
        setUnreadCount(count);
    } catch (error: any) {
        if (error?.response?.status !== 401) {
        console.error('Failed to load unread count:', error);
        }
    }
    }, []);

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  const toggleDoNotDisturb = async (value: boolean) => {
    try {
      await updateDoNotDisturb(privateService, value);
      setDoNotDisturb(value);
    } catch (error) {
      console.error('Failed to update DND status:', error);
    }
  };

  // Listen for notification events from socket
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      const { type, messageData, senderName, senderProfilePic, chatName, shouldShowPopup, shouldPlaySound, soundName } = data;

      // Play sound if enabled
      if (shouldPlaySound) {
        playNotificationSound(soundName);
      }

      // Show popup if enabled
      if (shouldShowPopup) {
        const banner: NotificationBannerData = {
            id: `${Date.now()}-${Math.random()}`,
            type,
            chatId: type === 'dm' ? messageData.senderId : messageData.channelId, // ADD THIS
            chatName,
            message: messageData.message,
            senderName,
            senderProfilePic
        };

        setNotificationBanners(prev => [...prev, banner]);
      }

      // Refresh unread count
      loadUnreadCount();
    };

    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket]);

    // Also refresh unread count when messages are marked as read
    useEffect(() => {
    if (!socket) return;

    const handleMessageRead = () => {
        console.log('MESSAGE READ EVENT RECEIVED - Refreshing unread count');
        loadUnreadCount();
    };

    socket.on('message:read', handleMessageRead);

    return () => {
        socket.off('message:read', handleMessageRead);
    };
    }, [socket, loadUnreadCount]);

  const removeBanner = useCallback((bannerId: string) => {
    setNotificationBanners(prev => prev.filter(b => b.id !== bannerId));
  }, []);

  return {
    preferences,
    savePreferences,
    doNotDisturb,
    toggleDoNotDisturb,
    notificationBanners,
    removeBanner,
    unreadCount,
    refreshUnreadCount: loadUnreadCount
  };
};