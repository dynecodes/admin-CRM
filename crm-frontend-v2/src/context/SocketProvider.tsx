import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/Auth/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { auth }: any = useAuth();

useEffect(() => {
  // ✅ TEMP: Disable Socket.IO safely while backend is not ready
  console.warn("⚠️ Socket.io connection disabled (backend not available)");
  return; // Stop the effect here so no connection attempt is made

  // // --- OLD CODE BELOW ---
  // if (!auth?.accessToken) {
  //   // If no token, disconnect any existing socket
  //   if (socket) {
  //     socket.disconnect();
  //     setSocket(null);
  //     setIsConnected(false);
  //   }
  //   return;
  // }

  // const socketBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v2', '') || 'http://localhost:3000';
  // console.log('🔌 Connecting to Socket.io at:', socketBaseUrl);
  
  // const socketInstance = io(socketBaseUrl, {
  //   auth: {
  //     token: auth.accessToken,
  //   },
  //   transports: ['websocket', 'polling'],
  //   reconnection: true,
  //   reconnectionAttempts: 5,
  //   reconnectionDelay: 1000,
  //   timeout: 180000,
  // });

  // socketInstance.on('connect', () => {
  //   console.log('✅ Socket connected');
  //   setIsConnected(true);
  // });

  // socketInstance.on('disconnect', () => {
  //   console.log('❌ Socket disconnected');
  //   setIsConnected(false);
  // });

  // socketInstance.on('connect_error', (error) => {
  //   console.error('Socket connection error:', error.message);
  //   setIsConnected(false);
  // });

  // socketInstance.on('error', (error: { message: string }) => {
  //   console.error('Socket error:', error.message);
  // });

  // setSocket(socketInstance);

  // return () => {
  //   socketInstance.disconnect();
  // };
}, [auth?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};