const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  color: String,
  width: Number,
  points: [{ x: Number, y: Number }],
  createdAt: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Untitled Room' },
  strokes: [strokeSchema],
  activeUsers: [{ userId: String, userName: String, color: String }],
  bgColor: { type: String, default: '#0f0f1a' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
