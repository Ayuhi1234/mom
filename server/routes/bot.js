const express = require('express');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const recallService = require('../services/recallService');

const router = express.Router();

router.post('/send', auth, async (req, res) => {
  try {
    const { meetingUrl, title, platform } = req.body;

    if (!meetingUrl) {
      return res.status(400).json({ error: 'Meeting URL is required' });
    }

    const detectedPlatform = platform || detectPlatform(meetingUrl);

    let meeting = await Meeting.findOne({
      meetingUrl,
      hostUser: req.user._id,
    });

    if (!meeting) {
      meeting = await Meeting.create({
        title: title || 'Untitled Meeting',
        platform: detectedPlatform,
        meetingUrl,
        hostUser: req.user._id,
        status: 'bot_joining',
      });
    } else {
      meeting.status = 'bot_joining';
      await meeting.save();
    }

    const bot = await recallService.sendBotToMeeting(meetingUrl);

    meeting.botId = bot.id;
    await meeting.save();

    const io = req.app.get('io');
    io.to(`meeting:${meeting._id}`).emit('bot-status', {
      meetingId: meeting._id,
      status: 'bot_joining',
      botId: bot.id,
    });

    res.json({ meeting, botId: bot.id });
  } catch (error) {
    console.error('Error sending bot:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status/:botId', auth, async (req, res) => {
  try {
    const status = await recallService.getBotStatus(req.params.botId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/remove/:botId', auth, async (req, res) => {
  try {
    await recallService.removeBotFromMeeting(req.params.botId);

    const meeting = await Meeting.findOne({ botId: req.params.botId });
    if (meeting) {
      meeting.status = 'completed';
      await meeting.save();
    }

    res.json({ message: 'Bot removed from meeting' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function detectPlatform(url) {
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('meet.google.com')) return 'google_meet';
  return 'zoom';
}

module.exports = router;
