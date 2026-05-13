const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userId: String,
  userName: String,
  text: String,
  type: { type: String, enum: ['chat', 'system', 'ai'], default: 'chat' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
