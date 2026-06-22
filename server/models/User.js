const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  googleTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
  },
  zoomTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
