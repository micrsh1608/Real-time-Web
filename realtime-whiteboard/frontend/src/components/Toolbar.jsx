const COLORS = ['#fff', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#000'];
const TOOLS = [
  { id: 'pencil', icon: '✏️', label: 'Pencil' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
  { id: 'rect', icon: '⬜', label: 'Rect' },
  { id: 'circle', icon: '⭕', label: 'Circle' },
  { id: 'line', icon: '📏', label: 'Line' },
];

export default function Toolbar({ 
  color, setColor, 
  brushSize, setBrushSize, 
  onClear, onUndo, 
  tool, setTool,
  bgColor, setBgColor,
  onExport
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', background: '#1a1a2e',
      borderBottom: '1px solid #2d2d44',
      flexWrap: 'wrap'
    }}>
      {/* Tools */}
      <div style={{ display: 'flex', gap: 4 }}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            style={btnStyle(tool === t.id ? '#3498db' : '#2d2d44')}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: '#2d2d44' }} />

      {/* Color palette */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 22, height: 22, borderRadius: '50%', background: c, border: 'none',
              cursor: 'pointer',
              outline: color === c ? '2px solid #fff' : '2px solid transparent',
              outlineOffset: 2
            }}
          />
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: '#2d2d44' }} />

      {/* Background Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#888', fontSize: 12 }}>BG</span>
        <input 
          type="color" 
          value={bgColor} 
          onChange={e => setBgColor(e.target.value)}
          style={{ width: 30, height: 24, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
      </div>

      <div style={{ width: 1, height: 24, background: '#2d2d44' }} />

      {/* Brush size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#888', fontSize: 12 }}>Size</span>
        <input
          type="range" min="1" max="50" value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <span style={{ color: '#888', fontSize: 12, minWidth: 20 }}>{brushSize}px</span>
      </div>

      <div style={{ width: 1, height: 24, background: '#2d2d44' }} />

      {/* Actions */}
      <button onClick={onUndo} style={btnStyle('#2d2d44')}>↩ Undo</button>
      <button onClick={onClear} style={btnStyle('#c0392b')}>🗑 Clear</button>
      <button onClick={onExport} style={btnStyle('#27ae60')}>📥 Export PNG</button>
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg, color: '#fff', border: 'none',
    borderRadius: 6, padding: '5px 10px',
    cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s'
  };
}
