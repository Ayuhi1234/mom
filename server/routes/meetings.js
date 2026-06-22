const express = require('express');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const googleService = require('../services/googleService');
const zoomService = require('../services/zoomService');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ hostUser: req.user._id })
      .sort({ startTime: -1 })
      .limit(50);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/upcoming', auth, async (req, res) => {
  try {
    const meetings = [];

    if (req.user.googleTokens?.accessToken) {
      try {
        const googleMeetings = await googleService.getUpcomingMeetings(req.user);
        meetings.push(...googleMeetings);
      } catch (err) {
        console.error('Error fetching Google meetings:', err.message);
      }
    }

    if (req.user.zoomTokens?.accessToken) {
      try {
        const zoomMeetings = await zoomService.getUpcomingMeetings(req.user);
        meetings.push(...zoomMeetings);
      } catch (err) {
        console.error('Error fetching Zoom meetings:', err.message);
      }
    }

    meetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      hostUser: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, platform, meetingUrl, startTime } = req.body;

    const meeting = await Meeting.create({
      title,
      platform,
      meetingUrl,
      hostUser: req.user._id,
      startTime,
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      hostUser: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
