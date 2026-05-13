const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');

// GET /api/rooms/:roomId — load room info + history
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:roomId/messages — chat history
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — create new room
router.post('/', async (req, res) => {
  try {
    const { roomId, name } = req.body;
    const room = await Room.create({ roomId, name });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
