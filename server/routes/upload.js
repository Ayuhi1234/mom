const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meeting = require('../models/Meeting');
const MOM = require('../models/MOM');
const auth = require('../middleware/auth');
const { transcribeAudio, generateMOM } = require('../services/claudeService');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.ogg', '.flac', '.mpeg', '.mpga'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Use: ${allowed.join(', ')}`));
    }
  },
});

router.post('/', auth, upload.single('recording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const title = req.body.title || 'Uploaded Meeting';
    const platform = req.body.platform || 'upload';

    const meeting = await Meeting.create({
      title,
      platform,
      meetingUrl: `upload://${req.file.filename}`,
      hostUser: req.user._id,
      status: 'completed',
      startTime: req.body.date ? new Date(req.body.date) : new Date(),
    });

    const io = req.app.get('io');
    io.emit('upload-status', { meetingId: meeting._id, status: 'transcribing' });

    res.json({ meeting, message: 'File uploaded. Transcribing...' });

    try {
      const transcript = await transcribeAudio(req.file.path);
      meeting.transcript = transcript;
      await meeting.save();

      io.emit('upload-status', { meetingId: meeting._id, status: 'generating_mom' });

      const momData = await generateMOM(transcript, title);
      await MOM.create({ meeting: meeting._id, ...momData });

      io.emit('upload-status', { meetingId: meeting._id, status: 'done' });
    } catch (err) {
      console.error('Processing error:', err);
      meeting.status = 'failed';
      await meeting.save();
      io.emit('upload-status', { meetingId: meeting._id, status: 'error', error: err.message });
    }

    fs.unlink(req.file.path, () => {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
