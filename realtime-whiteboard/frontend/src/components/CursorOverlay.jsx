import { useEffect, useState, useRef } from 'react';

export default function CursorOverlay({ socket }) {
  const [cursors, setCursors] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('cursor-move', ({ userId, userName, color, x, y }) => {
      // x, y là tọa độ normalized (0~1), nhân với kích thước container thật
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setCursors(prev => ({
        ...prev,
        [userId]: {
          userName, color,
          x: x * rect.width,
          y: y * rect.height
        }
      }));
    });

    socket.on('user-left', ({ userId }) => {
      setCursors(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('cursor-move');
      socket.off('user-left');
    };
  }, [socket]);

  return (
    <div ref={containerRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      {Object.entries(cursors).map(([userId, { userName, color, x, y }]) => (
        <div key={userId} style={{ position:'absolute', left: x, top: y, transform:'translate(-2px,-2px)', zIndex:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M2 2L2 16L6 12L9 18L11 17L8 11L14 11Z" fill={color} stroke="#fff" strokeWidth="1"/>
          </svg>
          <div style={{ background:color, color:'#fff', fontSize:11, fontWeight:600, padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', marginTop:-4, marginLeft:14 }}>
            {userName}
          </div>
        </div>
      ))}
    </div>
  );
}