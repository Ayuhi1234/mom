const express = require('express');
const Meeting = require('../models/Meeting');
const MOM = require('../models/MOM');
const auth = require('../middleware/auth');
const claudeService = require('../services/claudeService');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const moms = await MOM.find()
      .populate({
        path: 'meeting',
        match: { hostUser: req.user._id },
      })
      .sort({ generatedAt: -1 });

    const userMoms = moms.filter((mom) => mom.meeting !== null);
    res.json(userMoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      hostUser: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const mom = await MOM.findOne({ meeting: meeting._id });

    if (!mom) {
      return res.status(404).json({ error: 'MOM not generated yet' });
    }

    res.json(mom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      hostUser: req.user._id,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const transcript = meeting.transcript;

    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript available for this meeting' });
    }

    const momData = await claudeService.generateMOM(transcript, meeting.title);

    const mom = await MOM.findOneAndUpdate(
      { meeting: meeting._id },
      {
        meeting: meeting._id,
        ...momData,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const io = req.app.get('io');
    io.to(`meeting:${meeting._id}`).emit('mom-generated', {
      meetingId: meeting._id,
      mom,
    });

    res.json(mom);
  } catch (error) {
    console.error('Error generating MOM:', error);
    res.status(500).json({ error: error.message });
  }
});

// Edit MOM fields
router.put('/:momId', auth, async (req, res) => {
  try {
    const { summary, agendaItems, keyDiscussionPoints, decisions, actionItems, nextSteps } = req.body;

    const mom = await MOM.findById(req.params.momId);
    if (!mom) return res.status(404).json({ error: 'MOM not found' });

    if (summary !== undefined) mom.summary = summary;
    if (agendaItems !== undefined) mom.agendaItems = agendaItems;
    if (keyDiscussionPoints !== undefined) mom.keyDiscussionPoints = keyDiscussionPoints;
    if (decisions !== undefined) mom.decisions = decisions;
    if (actionItems !== undefined) mom.actionItems = actionItems;
    if (nextSteps !== undefined) mom.nextSteps = nextSteps;

    await mom.save();
    res.json(mom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/action-item/:momId/:itemId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const mom = await MOM.findById(req.params.momId);

    if (!mom) {
      return res.status(404).json({ error: 'MOM not found' });
    }

    const actionItem = mom.actionItems.id(req.params.itemId);
    if (!actionItem) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    actionItem.status = status;
    await mom.save();

    res.json(mom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update speaker names in transcript
router.put('/speakers/:meetingId', auth, async (req, res) => {
  try {
    const { speakerMap } = req.body;
    const meeting = await Meeting.findOne({
      _id: req.params.meetingId,
      hostUser: req.user._id,
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    meeting.transcript = meeting.transcript.map((entry) => ({
      ...entry.toObject ? entry.toObject() : entry,
      speaker: speakerMap[entry.speaker] || entry.speaker,
    }));

    await meeting.save();
    res.json(meeting.transcript);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
