import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useSSE } from './hooks/useSSE';
import Whiteboard from './components/Whiteboard';
import Chat from './components/Chat';
import Toolbar from './components/Toolbar';
import CursorOverlay from './components/CursorOverlay';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [color, setColor] = useState('#fff');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pencil');
  const [bgColor, setBgColor] = useState('#0f0f1a');

  const { socket, isConnected, users } = useSocket(joined ? roomId : null, userName);
  const { userCount, notification } = useSSE(joined ? roomId : null);

  const handleJoin = () => {
    if (!roomId.trim() || !userName.trim()) return;
    setJoined(true);
  };

  const handleClear = () => socket?.emit('clear-canvas', { roomId });
  const handleUndo = () => socket?.emit('undo', { roomId, userId: socket.id });
  
  const handleBgChange = (newColor) => {
    setBgColor(newColor);
    socket?.emit('change-bg-color', { roomId, color: newColor });
  };

  const handleExport = () => {
    if (window.exportCanvasAsPNG) window.exportCanvasAsPNG();
  };

  if (!joined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1a1a2e', padding: 40, borderRadius: 16, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <h1 style={{ color: '#fff', margin: '0 0 8px', fontSize: 24 }}>🎨 Whiteboard</h1>
          <p style={{ color: '#888', margin: '0 0 28px', fontSize: 14 }}>Real-time collaborative drawing</p>
          <input placeholder="Your name" value={userName} onChange={e => setUserName(e.target.value)} style={inputStyle} />
          <input placeholder="Room ID (e.g. room-123)" value={roomId} onChange={e => setRoomId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()} style={{ ...inputStyle, marginBottom: 20 }} />
          <button onClick={handleJoin} style={{ width: '100%', padding: '12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>
            Join Room →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#1a1a2e', borderBottom: '1px solid #2d2d44' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>🎨 Whiteboard</span>
          <span style={{ color: '#555', fontSize: 13 }}>#{roomId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {notification && <span style={{ color: '#2ecc71', fontSize: 13 }}>{notification}</span>}
          <span style={{ color: '#888', fontSize: 13 }}>
            <span style={{ color: isConnected ? '#2ecc71' : '#e74c3c' }}>●</span> {userCount} online
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
             {users.map(u => (
               <div key={u.userId} title={u.userName} style={{ width: 24, height: 24, borderRadius: '50%', background: u.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, border: '2px solid #1a1a2e' }}>
                 {u.userName.charAt(0).toUpperCase()}
               </div>
             ))}
          </div>
          <span style={{ color: '#666', fontSize: 13 }}>👤 {userName}</span>
        </div>
      </div>
      <Toolbar 
        color={color} setColor={setColor} 
        brushSize={brushSize} setBrushSize={setBrushSize} 
        onClear={handleClear} onUndo={handleUndo} 
        tool={tool} setTool={setTool}
        bgColor={bgColor} setBgColor={handleBgChange}
        onExport={handleExport}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, background: '#111', position: 'relative', overflow: 'hidden' }}>
          <Whiteboard socket={socket} roomId={roomId} color={color} brushSize={brushSize} tool={tool} />
          <CursorOverlay socket={socket} />
        </div>
        <div style={{ width: 280, borderLeft: '1px solid #2d2d44', display: 'flex', flexDirection: 'column' }}>
          <Chat socket={socket} roomId={roomId} userName={userName} />
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 14px', background: '#2d2d44', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' };