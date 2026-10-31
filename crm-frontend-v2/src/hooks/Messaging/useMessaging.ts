import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketProvider';
import usePrivateService from '../Auth/usePrivateService';
import { Message, Conversation } from '../../types/messaging';

export const useMessaging = (reopenChat?: (type: 'dm' | 'channel', id: number) => Promise<void>) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const { socket, isConnected } = useSocket();
  const privateService = usePrivateService();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await privateService.get('/messages/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (otherUserId: number) => {
    try {
      setLoading(true);
      const response = await privateService.get(`/messages/conversations/${otherUserId}`);
      if (response.data.success) {
        setMessages(response.data.data);
        setActiveConversationId(otherUserId);
        
        // Mark unread messages as read
        const unreadMessages = response.data.data.filter(
          (msg: Message) => !msg.isRead && msg.recipientId !== otherUserId
        );
        
        unreadMessages.forEach((msg: Message) => {
          markAsRead(msg.id);
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  // Send message via Socket.io (with optional reply support)
  const sendMessage = useCallback((recipientId: number, message: string, replyToId?: number, attachment?: { data: string; name: string; type: string } | null) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }
    
    socket.emit('message:send', {
      recipientId,
      message,
      replyToId: replyToId || null,
      attachment: attachment || null
    });
  }, [socket, isConnected]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await privateService.put(`/messages/${messageId}/read`);
      if (socket && isConnected) {
        socket.emit('message:markRead', { messageId });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [privateService, socket, isConnected]);

  // Start typing indicator
  const startTyping = useCallback((recipientId: number) => {
    if (!socket || !isConnected) return;
    socket.emit('typing:start', { recipientId });
  }, [socket, isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((recipientId: number) => {
    if (!socket || !isConnected) return;
    socket.emit('typing:stop', { recipientId });
  }, [socket, isConnected]);

  // Edit message via Socket.io
  const editMessage = useCallback((messageId: number, newMessage: string, recipientId: number) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('message:edit', { messageId, newMessage, recipientId });
  }, [socket, isConnected]);

  // Delete message via Socket.io
  const deleteMessage = useCallback((messageId: number, recipientId: number) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('message:delete', { messageId, recipientId });
  }, [socket, isConnected]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // New message received
    socket.on('message:new', (newMessage: Message) => {
      // Add to messages if in active conversation
      if (
        newMessage.senderId === activeConversationId || 
        newMessage.recipientId === activeConversationId
      ) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });

        // Auto-mark as read if we're viewing the conversation
        if (newMessage.senderId === activeConversationId) {
          markAsRead(newMessage.id);
        }
        
        // Update conversation list and sort
        setConversations((prev) => {
          const updated = prev.map((conv) =>
            conv.other_user_id === activeConversationId
              ? {
                  ...conv,
                  last_message: newMessage.message,
                  last_message_time: newMessage.createdAt
                }
              : conv
          );
          
          // Sort by last_message_time (most recent first)
          return updated.sort((a, b) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
            return timeB - timeA;
          });
        });
      } else {
        // Reopen closed chat if it receives a new message
        if (reopenChat) {
          (async () => {
            await reopenChat('dm', newMessage.senderId).catch(err =>
              console.error('Error reopening closed chat:', err)
            );
            // Refresh conversations after reopening completes
            fetchConversations();
          })();
          return; // Exit early, fetchConversations will be called after reopenChat
        }
        
        // Update conversation list for other conversations and sort
        setConversations((prev) => {
          const otherUserId = newMessage.senderId;
          const updated = prev.map((conv) =>
            conv.other_user_id === otherUserId
              ? {
                  ...conv,
                  unread_count: conv.unread_count + 1,
                  last_message: newMessage.message,
                  last_message_time: newMessage.createdAt
                }
              : conv
          );
          
          // Sort by last_message_time (most recent first)
          return updated.sort((a, b) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    });

    // Message edited
    socket.on('message:edited', ({ messageId, newMessage }: { messageId: number; newMessage: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, message: newMessage, updatedAt: new Date().toISOString() } : msg))
      );
    });

    // Message deleted
    socket.on('message:deleted', ({ messageId }: { messageId: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    // Message read receipt
    socket.on('message:read', ({ messageId }: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
      );
    });

    // User online status
    socket.on('user:online', ({ userId }: { userId: number }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    // User offline status
    socket.on('user:offline', ({ userId }: { userId: number }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Typing indicators
    socket.on('typing:start', ({ userId }: { userId: number }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('typing:stop', ({ userId }: { userId: number }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off('message:new');
      socket.off('message:read');
      socket.off('message:edited');  
      socket.off('message:deleted');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, activeConversationId, fetchConversations, markAsRead, reopenChat]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    activeConversationId,
    onlineUsers,
    typingUsers,
    isConnected,
    fetchMessages,
    sendMessage,
    markAsRead,
    fetchConversations,
    startTyping,
    stopTyping,
    editMessage,  
    deleteMessage,
  };
};