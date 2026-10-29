import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../../context/SocketProvider";
import usePrivateService from "../Auth/usePrivateService";
import { closedChatsApi } from '../../api/closedChats';
import {
  Channel,
  ChannelMessage,
  ChannelMember,
  CreateChannelData,
  ChannelTypingUser
} from "../../types/channels";

export function useChannels() {
  const { socket, isConnected } = useSocket();
  const privateService = usePrivateService();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [typingUsersDetails, setTypingUsersDetails] = useState<ChannelTypingUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's channels
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await privateService.get("/channels");
      if (response.data.success) {
        setChannels(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  }, [privateService]);

  // Fetch public channels for browsing
  const fetchPublicChannels = useCallback(async () => {
    try {
      const response = await privateService.get("/channels/browse");
      if (response.data.success) {
        setPublicChannels(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching public channels:", error);
    }
  }, [privateService]);

  // Fetch messages for a specific channel
  const fetchChannelMessages = useCallback(
    async (channelId: number) => {
      try {
        setLoading(true);
        const response = await privateService.get(`/channels/${channelId}/messages`);
        if (response.data.success) {
          setChannelMessages(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching channel messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [privateService]
  );

  // Fetch channel members
  const fetchChannelMembers = useCallback(
    async (channelId: number) => {
      try {
        const response = await privateService.get(`/channels/${channelId}/members`);
        if (response.data.success) {
          setChannelMembers(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching channel members:", error);
      }
    },
    [privateService]
  );

  // Create a new channel
  const createChannel = useCallback(
    async (data: CreateChannelData) => {
      try {
        const response = await privateService.post("/channels", data);
        if (response.data.success) {
          await fetchChannels();
          return response.data.data;
        }
      } catch (error) {
        console.error("Error creating channel:", error);
        throw error;
      }
    },
    [privateService, fetchChannels]
  );

  const updateChannel = useCallback(
    async (channelId: number, data: { name?: string; channel_purpose?: string | null }) => {
      try {
        const response = await privateService.put(`/channels/${channelId}`, data);
        if (response.data.success) {
          // Update local state
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId
                ? { ...ch, name: data.name || ch.name, channel_purpose: data.channel_purpose ?? ch.channel_purpose }
                : ch
            )
          );
          return response.data.data;
        }
      } catch (error) {
        console.error("Error updating channel:", error);
        throw error;
      }
    },
    [privateService]
  );

  const updateChannelAvatar = useCallback(
    async (channelId: number, data: {
      type: 'image' | 'emoji';
      imageFile?: string;
      emoji?: string;
      emojiColor?: string;
    }) => {
      try {
        const response = await privateService.put(`/channels/${channelId}/avatar`, data);
        if (response.data.success) {
          // Update local state
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channelId
                ? {
                    ...ch,
                    channel_avatar_url: data.type === 'image' ? data.imageFile : null,
                    channel_emoji: data.type === 'emoji' ? data.emoji : null,
                    channel_emoji_color: data.type === 'emoji' ? data.emojiColor : null
                  }
                : ch
            )
          );
          return response.data.data;
        }
      } catch (error) {
        console.error("Error updating channel avatar:", error);
        throw error;
      }
    },
    [privateService]
  );

  // Join a public channel
  const joinChannel = useCallback(
    async (channelId: number) => {
        try {
        const response = await privateService.post(`/channels/${channelId}/join`);
        if (response.data.success) {
            // Emit system message about joining
            if (socket && response.data.userId && response.data.userName) {
            const systemMessage = {
                id: Date.now(),
                channelId: channelId,
                senderId: 0,
                message: `${response.data.userName} joined the channel`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                firstName: 'System',
                lastName: '',
                profilePicUrl: null,
                isSystemMessage: true
            };
            socket.emit("channel:system:message", { channelId, message: systemMessage });
            }
            
            await fetchChannels();
            await fetchPublicChannels();
            socket?.emit("channel:join", { channelId });
        }
        } catch (error) {
        console.error("Error joining channel:", error);
        throw error;
        }
    },
    [privateService, fetchChannels, fetchPublicChannels, socket]
    );

  // Leave a channel
  const leaveChannel = useCallback(
    async (channelId: number) => {
        try {
        const response = await privateService.post(`/channels/${channelId}/leave`);
        if (response.data.success) {
            // Emit system message about leaving
            if (socket && response.data.userId && response.data.userName) {
            const systemMessage = {
                id: Date.now(),
                channelId: channelId,
                senderId: 0, // System message
                message: `${response.data.userName} left the channel`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                firstName: 'System',
                lastName: '',
                profilePicUrl: null,
                isSystemMessage: true
            };
            socket.emit("channel:system:message", { channelId, message: systemMessage });
            }
            
            await fetchChannels();
            // Leave the socket room
            socket?.emit("channel:leave", { channelId });
            if (activeChannelId === channelId) {
            setActiveChannelId(null);
            setChannelMessages([]);
            }
        }
        } catch (error) {
        console.error("Error leaving channel:", error);
        throw error;
        }
    },
    [privateService, fetchChannels, socket, activeChannelId]
    );

  // Send a message to a channel
  const sendChannelMessage = useCallback((channelId: number, message: string, replyToId?: number, attachment?: { data: string; name: string; type: string } | null) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }
    
    socket.emit('channel:message:send', {
      channelId,
      message,
      replyToId: replyToId || null,
      attachment: attachment || null
    });
  }, [socket, isConnected]);

  // Start typing indicator
  const startTyping = useCallback(
    (channelId: number) => {
      if (!socket) return;
      socket.emit("channel:typing:start", { channelId });
    },
    [socket]
  );

  // Stop typing indicator
  const stopTyping = useCallback(
    (channelId: number) => {
      if (!socket) return;
      socket.emit("channel:typing:stop", { channelId });
    },
    [socket]
  );

  // Edit channel message via Socket.io
  const editChannelMessage = useCallback((channelId: number, messageId: number, newMessage: string) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('channel:message:edit', { channelId, messageId, newMessage });
  }, [socket, isConnected]);

  // Delete channel message via Socket.io
  const deleteChannelMessage = useCallback((channelId: number, messageId: number) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('channel:message:delete', { channelId, messageId });
  }, [socket, isConnected]);

  // Update last read timestamp
  const markChannelAsRead = useCallback(
    async (channelId: number) => {
      try {
        await privateService.put(`/channels/${channelId}/read`);
        // Update local state to reset unread count
        setChannels((prev) =>
          prev.map((channel) =>
            channel.id === channelId ? { ...channel, unread_count: 0 } : channel
          )
        );
      } catch (error) {
        console.error("Error marking channel as read:", error);
      }
    },
    [privateService]
  );

  // Add members to a channel (admin only)
  const addChannelMembers = useCallback(
    async (channelId: number, memberIds: number[]) => {
        try {
        const response = await privateService.post(`/channels/${channelId}/members`, {
            memberIds
        });
        if (response.data.success && response.data.addedMembers) {
            // Emit system messages for each added member
            if (socket) {
            response.data.addedMembers.forEach((member: any) => {
                const systemMessage = {
                id: Date.now() + member.userId,
                channelId: channelId,
                senderId: 0,
                message: `${member.userName} was added to the channel`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                firstName: 'System',
                lastName: '',
                profilePicUrl: null,
                isSystemMessage: true
                };
                socket.emit("channel:system:message", { channelId, message: systemMessage });
            });
            }
            
            await fetchChannelMembers(channelId);
        }
        } catch (error) {
        console.error("Error adding channel members:", error);
        throw error;
        }
    },
    [privateService, fetchChannelMembers, socket]
    );

  // Remove a member from a channel (admin only)
  const removeChannelMember = useCallback(
    async (channelId: number, memberId: number) => {
        try {
        const response = await privateService.delete(
            `/channels/${channelId}/members/${memberId}`
        );
        if (response.data.success) {
            // Emit system message about removal
            if (socket && response.data.userId && response.data.userName) {
            const systemMessage = {
                id: Date.now(),
                channelId: channelId,
                senderId: 0, // System message
                message: `${response.data.userName} was removed from the channel`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                firstName: 'System',
                lastName: '',
                profilePicUrl: null,
                isSystemMessage: true
            };
            socket.emit("channel:system:message", { channelId, message: systemMessage });
            }
            
            await fetchChannelMembers(channelId);
        }
        } catch (error) {
        console.error("Error removing channel member:", error);
        throw error;
        }
    },
    [privateService, fetchChannelMembers, socket]
    );

    const deleteChannel = useCallback(
        async (channelId: number) => {
            try {
            const response = await privateService.delete(`/channels/${channelId}`);
            if (response.data.success) {
                await fetchChannels();
                if (activeChannelId === channelId) {
                setActiveChannelId(null);
                setChannelMessages([]);
                }
                socket?.emit("channel:leave", { channelId });
            }
            } catch (error) {
            console.error("Error deleting channel:", error);
            throw error;
            }
        },
        [privateService, fetchChannels, socket, activeChannelId]
        );

  // Promote a member to admin (admin only)
  const promoteToAdmin = useCallback(
    async (channelId: number, memberId: number) => {
      try {
        const response = await privateService.put(
          `/channels/${channelId}/members/${memberId}/promote`
        );
        if (response.data.success) {
          await fetchChannelMembers(channelId);
        }
      } catch (error) {
        console.error("Error promoting member:", error);
        throw error;
      }
    },
    [privateService, fetchChannelMembers]
  );

  const demoteFromAdmin = useCallback(async (channelId: number, memberId: number) => {
    try {
      await privateService.put(`/channels/${channelId}/members/${memberId}/demote`);
      
      // Refresh channel members to show updated admin status
      await fetchChannelMembers(channelId);
    } catch (error) {
      console.error('Error demoting member from admin:', error);
      throw error;
    }
  }, [privateService, fetchChannelMembers]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new channel messages
    const handleNewChannelMessage = (message: ChannelMessage) => {
      // Add to messages if viewing this channel
      if (message.channelId === activeChannelId) {
        setChannelMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        // Mark as read automatically if user is viewing - inline to avoid dependency
        privateService.put(`/channels/${message.channelId}/read`).catch(err =>
          console.error('Error marking channel as read:', err)
        );
        // Update local state immediately and sort
        setChannels((prev) => {
          const updated = prev.map((channel) =>
            channel.id === message.channelId 
              ? { 
                  ...channel, 
                  unread_count: 0,
                  last_message: message.message,
                  last_message_time: message.createdAt
                } 
              : channel
          );
          
          // Sort by last_message_time (most recent first)
          return updated.sort((a, b) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
            return timeB - timeA;
          });
        });
      } else {
        // Reopen closed channel if it receives a new message
        closedChatsApi.reopenChat('channel', message.channelId).catch(err =>
          console.error('Error reopening closed channel:', err)
        );
        
        // Increment unread count for other channels and move to top
        setChannels((prev) => {
          const updated = prev.map((channel) =>
            channel.id === message.channelId
              ? { 
                  ...channel, 
                  unread_count: (channel.unread_count || 0) + 1,
                  last_message: message.message,
                  last_message_time: message.createdAt
                }
              : channel
          );
          
          // Sort by last_message_time (most recent first)
          return updated.sort((a, b) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
            return timeB - timeA;
          });
        });
      }
    };

    // Listen for typing indicators
    const handleTypingStart = (data: ChannelTypingUser) => {
      setTypingUsers((prev) => new Set(prev).add(data.userId));
      setTypingUsersDetails((prev) => {
        const exists = prev.find(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleTypingStop = (data: { userId: number }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      setTypingUsersDetails((prev) => prev.filter(u => u.userId !== data.userId));
    };

    const handleSystemMessage = (message: ChannelMessage) => {
        if (message.channelId === activeChannelId) {
            setChannelMessages((prev) => [...prev, message]);
        }
    };

    socket.on("channel:message:new", handleNewChannelMessage);
    socket.on("channel:typing:start", handleTypingStart);
    socket.on("channel:typing:stop", handleTypingStop);
    socket.on("channel:system:message", handleSystemMessage);

    // Channel message edited
    socket.on('channel:message:edited', ({ messageId, newMessage, channelId }: { messageId: number; newMessage: string; channelId: number }) => {
      if (channelId === activeChannelId) {
        setChannelMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, message: newMessage, updatedAt: new Date().toISOString() } : msg))
        );
      }
    });

    // Channel message deleted
    socket.on('channel:message:deleted', ({ messageId, channelId }: { messageId: number; channelId: number }) => {
      if (channelId === activeChannelId) {
        setChannelMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    });

    return () => {
      socket.off("channel:message:new", handleNewChannelMessage);
      socket.off("channel:message:edited");  
      socket.off("channel:message:deleted");
      socket.off("channel:typing:start", handleTypingStart);
      socket.off("channel:typing:stop", handleTypingStop);
      socket.off("channel:system:message", handleSystemMessage);
    };
  }, [socket, activeChannelId, privateService]);

  // Join ALL channel socket rooms to receive notifications
  useEffect(() => {
    if (!socket || channels.length === 0) return;

    // Join all channels the user is a member of
    channels.forEach((channel) => {
      socket.emit("channel:join", { channelId: channel.id });
    });

    return () => {
      // Leave all channels on cleanup
      channels.forEach((channel) => {
        socket.emit("channel:leave", { channelId: channel.id });
      });
    };
  }, [socket, channels]);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    // State
    channels,
    publicChannels,
    activeChannelId,
    channelMessages,
    channelMembers,
    typingUsers,
    typingUsersDetails,
    loading,

    // Actions
    setActiveChannelId,
    fetchChannels,
    fetchPublicChannels,
    fetchChannelMessages,
    fetchChannelMembers,
    createChannel,
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    startTyping,
    stopTyping,
    markChannelAsRead,
    addChannelMembers,
    removeChannelMember,
    promoteToAdmin,
    demoteFromAdmin,
    deleteChannel,
    updateChannel,
    updateChannelAvatar,
    editChannelMessage,  
    deleteChannelMessage,
  };
}