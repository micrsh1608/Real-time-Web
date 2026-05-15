const Room = require('../models/Room');
const Message = require('../models/Message');
const { broadcastSSE } = require('./sseService');
const { generateDrawingCommands } = require("./aiService");

const userColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63'];
let colorIndex = 0;

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- JOIN ROOM ---
    socket.on('join-room', async ({ roomId, userName }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.color = userColors[colorIndex++ % userColors.length];

      // Load or create room
      let room = await Room.findOne({ roomId });
      if (!room) room = await Room.create({ roomId, name: `Room ${roomId}` });

      // Add user to room
      await Room.updateOne({ roomId }, {
        $push: { activeUsers: { userId: socket.id, userName, color: socket.data.color } }
      });

      // Send existing canvas state to new user
      socket.emit('canvas-state', { strokes: room.strokes, bgColor: room.bgColor });

      // Notify others
      socket.to(roomId).emit('user-joined', { userId: socket.id, userName, color: socket.data.color });

      // SSE broadcast: user count update
      const updatedRoom = await Room.findOne({ roomId });
      broadcastSSE(roomId, 'user-count', { count: updatedRoom.activeUsers.length, userName });

      // System message
      const sysMsg = await Message.create({ roomId, userName, text: `${userName} joined the room`, type: 'system' });
      io.to(roomId).emit('chat-message', sysMsg);
    });

    // --- DRAW STROKE ---
    socket.on('draw-stroke', async ({ roomId, stroke }) => {
      // Broadcast to others in room instantly
      socket.to(roomId).emit('draw-stroke', stroke);

      // Save to DB
      await Room.updateOne({ roomId }, { $push: { strokes: stroke } });
    });

    // --- DRAW POINT (live cursor drawing) ---
    socket.on('draw-point', ({ roomId, point, color, width }) => {
      socket.to(roomId).emit('draw-point', { userId: socket.id, point, color, width });
    });

    // --- CURSOR MOVE ---
    socket.on('cursor-move', ({ roomId, x, y }) => {
      socket.to(roomId).emit('cursor-move', {
        userId: socket.id,
        userName: socket.data.userName,
        color: socket.data.color,
        x, y
      });
    });

    // --- CLEAR CANVAS ---
    socket.on('clear-canvas', async ({ roomId }) => {
      await Room.updateOne({ roomId }, { $set: { strokes: [] } });
      io.to(roomId).emit('clear-canvas');
    });

    // --- CHANGE BACKGROUND COLOR ---
    socket.on('change-bg-color', async ({ roomId, color }) => {
      await Room.updateOne({ roomId }, { $set: { bgColor: color } });
      io.to(roomId).emit('bg-color-change', { color });
    });

    // --- CHAT MESSAGE ---
    socket.on('chat-message', async ({ roomId, text }) => {
      const msg = await Message.create({
        roomId,
        userId: socket.id,
        userName: socket.data.userName,
        text,
        type: 'chat'
      });
      io.to(roomId).emit('chat-message', msg);

      // AI command: /ai <prompt>
      if (text.startsWith('/ai ')) {
        const prompt = text.slice(4);
        const aiReply = await generateDrawingCommands(prompt);
        const aiMsg = await Message.create({ roomId, userName: 'AI Assistant', text: aiReply, type: 'ai' });
        io.to(roomId).emit('chat-message', aiMsg);

        // If AI returns draw commands, broadcast them
        if (aiReply.startsWith('DRAW:')) {
          const drawData = JSON.parse(aiReply.slice(5));
          io.to(roomId).emit('ai-draw', drawData);
          await Room.updateOne({ roomId }, { $push: { strokes: { $each: drawData.strokes } } });
        }
      }
    });

    // --- TYPING INDICATOR ---
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user-typing', {
        userId: socket.id,
        userName: socket.data.userName,
        isTyping
      });
    });

    // --- UNDO ---
    socket.on('undo', async ({ roomId, userId }) => {
      const room = await Room.findOne({ roomId });
      if (!room || !room.strokes || room.strokes.length === 0) return;

      // Find the last stroke created by this user
      const lastStroke = [...room.strokes].reverse().find(s => s.userId === userId);
      
      if (lastStroke) {
        await Room.updateOne(
          { roomId },
          { $pull: { strokes: { _id: lastStroke._id } } }
        );
        
        // Fetch the updated room state to broadcast
        const updatedRoom = await Room.findOne({ roomId });
        io.to(roomId).emit('canvas-state', { 
          strokes: updatedRoom.strokes, 
          bgColor: updatedRoom.bgColor 
        });
      }
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      const { roomId, userName } = socket.data;
      if (!roomId) return;

      await Room.updateOne({ roomId }, {
        $pull: { activeUsers: { userId: socket.id } }
      });

      socket.to(roomId).emit('user-left', { userId: socket.id, userName });

      const room = await Room.findOne({ roomId });
      if (room) broadcastSSE(roomId, 'user-count', { count: room.activeUsers.length, userName });

      const sysMsg = await Message.create({ roomId, userName, text: `${userName} left the room`, type: 'system' });
      io.to(roomId).emit('chat-message', sysMsg);

      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSocket };
