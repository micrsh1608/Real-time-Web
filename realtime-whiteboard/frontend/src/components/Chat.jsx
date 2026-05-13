import { useState, useEffect, useRef } from 'react';

export default function Chat({ socket, roomId, userName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user-typing', ({ userId, userName: uName, isTyping }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) next[userId] = uName;
        else delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    socket?.emit('chat-message', { roomId, text: input });
    setInput('');
    handleTyping(false);
  };

  const handleTyping = (isTyping) => {
    socket?.emit('typing', { roomId, isTyping });
  };

  const onInputChange = (val) => {
    setInput(val);
    if (!val.trim()) {
      handleTyping(false);
      return;
    }
    
    handleTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a2e' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2d2d44', fontSize: 13, color: '#888', fontWeight: 500 }}>
        Chat <span style={{ color: '#555', fontWeight: 400 }}>— type /ai &lt;prompt&gt; to ask AI</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ fontSize: 13 }}>
            {msg.type === 'system' ? (
              <span style={{ color: '#555', fontStyle: 'italic' }}>{msg.text}</span>
            ) : msg.type === 'ai' ? (
              <div style={{ background: '#2d1f4e', borderLeft: '3px solid #9b59b6', padding: '6px 10px', borderRadius: 6 }}>
                <span style={{ color: '#9b59b6', fontWeight: 600 }}>🤖 AI: </span>
                <span style={{ color: '#ccc' }}>{msg.text}</span>
              </div>
            ) : (
              <div>
                <span style={{ color: msg.userName === userName ? '#3498db' : '#2ecc71', fontWeight: 600 }}>
                  {msg.userName}:{' '}
                </span>
                <span style={{ color: '#ddd' }}>{msg.text}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* Typing indicator */}
      {Object.values(typingUsers).length > 0 && (
        <div style={{ padding: '4px 12px', fontSize: 11, color: '#2ecc71', fontStyle: 'italic' }}>
          {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, borderTop: '1px solid #2d2d44' }}>
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message or /ai draw a cat..."
          style={{
            flex: 1, background: '#2d2d44', border: 'none', borderRadius: 8,
            padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none'
          }}
        />
        <button onClick={send} style={{
          background: '#3498db', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13
        }}>
          Send
        </button>
      </div>
    </div>
  );
}
