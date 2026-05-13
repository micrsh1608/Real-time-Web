const express = require('express');
const router = express.Router();
const { addSSEClient, removeSSEClient } = require('../services/sseService');

// GET /api/sse/:roomId — subscribe to room notifications
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.flushHeaders();

  // Send initial ping
  res.write(`event: connected\ndata: {"roomId":"${roomId}"}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  addSSEClient(roomId, res);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeSSEClient(roomId, res);
  });
});

module.exports = router;
