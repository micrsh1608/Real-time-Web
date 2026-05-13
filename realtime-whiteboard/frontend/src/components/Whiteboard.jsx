import { useEffect, useRef, useCallback } from 'react';

export default function Whiteboard({ socket, roomId, color, brushSize, tool }) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const cursorsRef = useRef({});

  const drawStroke = useCallback((ctx, stroke) => {
    if (!stroke.points || stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const [p1, p2] = stroke.points;

    if (stroke.type === 'rect') {
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (stroke.type === 'circle') {
      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p2.y) / 2;
      const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.type === 'line') {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    } else {
      // Default: pencil/eraser
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('canvas-state', ({ strokes, bgColor: remoteBgColor }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (remoteBgColor) canvas.style.background = remoteBgColor;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(s => drawStroke(ctx, s));
    });

    socket.on('bg-color-change', ({ color: c }) => {
      if (canvasRef.current) canvasRef.current.style.background = c;
    });

    socket.on('draw-stroke', (stroke) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawStroke(ctx, stroke);
      if (cursorsRef.current[stroke.userId]) {
        cursorsRef.current[stroke.userId].lastPoint = null;
      }
    });

    socket.on('ai-draw', ({ strokes }) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) strokes.forEach(s => drawStroke(ctx, s));
    });

    socket.on('clear-canvas', () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('draw-point', ({ userId, point, color: c, width: w }) => {
      if (!cursorsRef.current[userId]) cursorsRef.current[userId] = { lastPoint: null };
      const last = cursorsRef.current[userId].lastPoint;
      if (last) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      }
      cursorsRef.current[userId].lastPoint = point;
    });

    return () => {
      socket.off('canvas-state');
      socket.off('draw-stroke');
      socket.off('ai-draw');
      socket.off('clear-canvas');
      socket.off('bg-color-change');
      socket.off('draw-point');
    };
  }, [socket, drawStroke]);

  // Export functionality
  useEffect(() => {
    window.exportCanvasAsPNG = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}.png`;
      
      // Create a temporary canvas to include the background color
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.fillStyle = canvas.style.background || '#0f0f1a';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(canvas, 0, 0);
      
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    };
  }, [roomId]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    isDrawing.current = true;
    currentStroke.current = [];
    const pos = getPos(e, canvasRef.current);
    currentStroke.current.push(pos);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    
    if (tool === 'pencil' || tool === 'eraser') {
      currentStroke.current.push(pos);
      const pts = currentStroke.current;
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? canvas.style.background : color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      socket?.emit('draw-point', { roomId, point: pos, color: tool === 'eraser' ? canvas.style.background : color, width: brushSize });
    } else {
      // Shapes: Preview on the preview canvas
      const pCanvas = previewCanvasRef.current;
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      
      const startPos = currentStroke.current[0];
      currentStroke.current[1] = pos;
      
      const tempStroke = {
        type: tool,
        color,
        width: brushSize,
        points: [startPos, pos]
      };
      drawStroke(pCtx, tempStroke);
    }

    socket?.emit('cursor-move', {
      roomId,
      x: pos.x / canvas.width,
      y: pos.y / canvas.height
    });
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    
    // Clear preview canvas
    const pCanvas = previewCanvasRef.current;
    if (pCanvas) pCanvas.getContext('2d').clearRect(0, 0, pCanvas.width, pCanvas.height);

    if (currentStroke.current.length < 2) return;

    const stroke = {
      userId: socket?.id,
      userName: 'me',
      color: tool === 'eraser' ? canvasRef.current.style.background : color,
      width: brushSize,
      points: currentStroke.current,
      type: tool
    };

    if (tool !== 'pencil' && tool !== 'eraser') {
      // Draw the final shape locally on main canvas
      drawStroke(canvasRef.current.getContext('2d'), stroke);
    }

    socket?.emit('draw-stroke', { roomId, stroke });
    currentStroke.current = [];
  };

  return (
    <div style={{ position: 'relative', width: '1200px', height: '700px', maxWidth: '100%', maxHeight: '100%' }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <canvas
        ref={previewCanvasRef}
        width={1200}
        height={700}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
