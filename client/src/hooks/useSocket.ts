import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Point exactly to the backend server
    const newSocket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'] // Allow fallback
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setSocket(newSocket);
    });

    return () => {
    newSocket.off('connect'); // Stop listening to events
    newSocket.close();        // Physically close the connection
    setSocket(null);          // Clear the state
  };
  }, [token]);

  return socket;
};