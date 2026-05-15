require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const roomRoutes = require('./routes/roomRoutes');
const sseRoutes = require('./routes/sseRoutes');
const { initSocket } = require('./services/socketService');
const { sseClients } = require('./services/sseService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/sse', sseRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Init Socket.io
initSocket(io);

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log("Kiểm tra API Key:", process.env.GEMINI_API_KEY ? "Đã nhận" : "Trống");
