import { useState, useEffect, useCallback } from 'react';
import { userStatusApi, UserStatus } from '../../api/userStatus';
import { useSocket } from '../../context/SocketProvider';

export const useUserStatus = () => {
  const [currentStatus, setCurrentStatus] = useState<UserStatus>({
    status_type: 'available',
    custom_status: null
  });
  const [loading, setLoading] = useState(false);
  const { socket, isConnected } = useSocket();

  // Fetch current user's status
  const fetchUserStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await userStatusApi.getUserStatus();
      setCurrentStatus(status);
    } catch (error) {
      console.error('Error fetching user status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user status
  const updateStatus = useCallback(async (statusType: string, customStatus?: string) => {
    try {
      setLoading(true);
      const updatedStatus = await userStatusApi.updateUserStatus(statusType, customStatus);
      setCurrentStatus(updatedStatus);

      // Emit socket event to notify others
      if (socket && isConnected) {
        socket.emit('user:status:update', {
          status_type: statusType,
          custom_status: customStatus || null
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setLoading(false);
    }
  }, [socket, isConnected]);

  // Listen for status updates from other users via socket
  useEffect(() => {
    if (!socket) return;

    socket.on('user:status:changed', ({ userId, status_type, custom_status }) => {
      console.log('User status changed:', userId, status_type, custom_status);
      // You can update a global state or cache here if needed
    });

    return () => {
      socket.off('user:status:changed');
    };
  }, [socket]);

  // Fetch status on mount
  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  return {
    currentStatus,
    loading,
    updateStatus,
    fetchUserStatus
  };
};