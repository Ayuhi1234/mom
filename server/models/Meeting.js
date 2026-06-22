const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, enum: ['zoom', 'google_meet', 'upload'], required: true },
  meetingUrl: { type: String, required: true },
  meetingId: { type: String },
  hostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['scheduled', 'bot_joining', 'in_progress', 'completed', 'failed'],
    default: 'scheduled',
  },
  botId: { type: String },
  transcript: [{
    speaker: String,
    text: String,
    timestamp: Number,
  }],
  participants: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
