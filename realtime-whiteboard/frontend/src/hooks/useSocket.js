import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';

export function useSocket(roomId, userName) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!roomId || !userName) return;

    socketRef.current = io(SERVER_URL);
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, userName });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('user-joined', ({ userId, userName: name, color }) => {
      setUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, userName: name, color }]);
    });

    socket.on('user-left', ({ userId }) => {
      setUsers(prev => prev.filter(u => u.userId !== userId));
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, userName]);

  return { socket: socketRef.current, isConnected, users };
}
