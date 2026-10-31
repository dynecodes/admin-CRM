import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketProvider';
import * as SimplePeer from 'simple-peer';
import { CallType, CallStatus, IncomingCall, CallUser } from '../../types/calls';

const Peer = (SimplePeer as any).default || SimplePeer;

export const useCall = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [currentCall, setCurrentCall] = useState<IncomingCall | null>(null);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [remoteUser, setRemoteUser] = useState<CallUser | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  
  const { socket, isConnected } = useSocket();
  const peerRef = useRef<any>(null);
  const callIdRef = useRef<string | null>(null);

  // Initiate a call
  const initiateCall = useCallback(async (recipientId: number, type: CallType, recipient: CallUser) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    try {
      // Get media stream
      const constraints = {
        audio: true,
        video: type === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallType(type);
      setRemoteUser(recipient);
      setCallStatus('calling');

      // Create peer connection (initiator)
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (signal: any) => {
        socket.emit('call:initiate', {
          recipientId,
          type,
          signal,
        });
      });

      peer.on('stream', (remoteStream: MediaStream) => {
        setRemoteStream(remoteStream);
        setCallStatus('active');
        setCallStartTime(Date.now());
      });

      peer.on('error', (err: Error) => {
        console.error('Peer error:', err);
        endCall();
      });

      peer.on('close', () => {
        endCall();
      });

      peerRef.current = peer;

    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
      setCallStatus('idle');
    }
  }, [socket, isConnected]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !isConnected || !currentCall) {
      console.error('Cannot accept call');
      return;
    }

    // Cleanup any existing streams before accepting new call
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    try {
      const constraints = {
        audio: true,
        video: currentCall.type === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallStatus('active');
      setCallStartTime(Date.now());

      // Create peer connection (receiver)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (signal: any) => {
        socket.emit('call:accept', {
          callId: currentCall.callId,
          recipientId: currentCall.caller.userId,
          signal,
        });
      });

      peer.on('stream', (remoteStream: MediaStream) => {
        setRemoteStream(remoteStream);
      });

      peer.on('error', (err: Error) => {
        console.error('Peer error:', err);
        endCall();
      });

      peer.on('close', () => {
        endCall();
      });

      // Signal the peer with the incoming signal
      peer.signal(currentCall.signal);

      peerRef.current = peer;
      callIdRef.current = currentCall.callId;

    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
      rejectCall();
    }
  }, [socket, isConnected, currentCall]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !isConnected || !currentCall) {
      return;
    }

    socket.emit('call:reject', {
      callId: currentCall.callId,
      recipientId: currentCall.caller.userId,
    });

    setCurrentCall(null);
    setCallStatus('idle');
  }, [socket, isConnected, currentCall]);

  // End call
  const endCall = useCallback((notifyRemote = true) => {
    if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
    }

    // Only emit socket event if this is a local end call action
    if (notifyRemote && socket && isConnected && remoteUser && callIdRef.current) {
        socket.emit('call:end', {
        callId: callIdRef.current,
        recipientId: remoteUser.userId,
        });
    }

    setCallStatus('idle');
    setCurrentCall(null);
    setRemoteUser(null);
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallStartTime(null);
    callIdRef.current = null;
    }, [socket, isConnected, localStream, remoteStream, remoteUser]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    socket.on('call:incoming', (data: IncomingCall) => {
      setCurrentCall(data);
      setCallType(data.type);
      setRemoteUser(data.caller);
      setCallStatus('ringing');
      callIdRef.current = data.callId;
    });

    // Call accepted
    socket.on('call:accepted', ({ signal }: { signal: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    // Call rejected
    socket.on('call:rejected', () => {
        setCallStatus('declined');
        setTimeout(() => {
            endCall(false); // Don't notify remote since they already rejected
        }, 2000);
    });

    // Call ended
    socket.on('call:ended', () => {
        setCallStatus('ended');
        setTimeout(() => {
            endCall(false); // Don't notify remote since they already ended it
        }, 1000);
    });

    // WebRTC signal
    socket.on('call:signal', ({ signal }: { signal: any }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:signal');
    };
  }, [socket, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    callStatus,
    currentCall,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callStartTime,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};