import { useEffect, useState } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSSE(roomId) {
  const [userCount, setUserCount] = useState(0);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    const eventSource = new EventSource(`${SERVER_URL}/api/sse/${roomId}`);

    eventSource.addEventListener('connected', () => {
      console.log('SSE connected to room:', roomId);
    });

    // Listen for user count updates
    eventSource.addEventListener('user-count', (e) => {
      const data = JSON.parse(e.data);
      setUserCount(data.count);
      setNotification(`${data.userName} ${data.count > userCount ? 'joined' : 'left'}`);
      setTimeout(() => setNotification(null), 3000);
    });

    eventSource.onerror = () => {
      console.warn('SSE connection error, retrying...');
    };

    return () => eventSource.close();
  }, [roomId]);

  return { userCount, notification };
}
