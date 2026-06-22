const express = require('express');
const Meeting = require('../models/Meeting');
const recallService = require('../services/recallService');
const claudeService = require('../services/claudeService');
const MOM = require('../models/MOM');

const router = express.Router();

router.post('/recall', async (req, res) => {
  try {
    const { event, data } = req.body;
    const io = req.app.get('io');

    switch (event) {
      case 'bot.status_change': {
        const meeting = await Meeting.findOne({ botId: data.bot_id });
        if (!meeting) break;

        if (data.status === 'in_meeting') {
          meeting.status = 'in_progress';
          meeting.startTime = meeting.startTime || new Date();
        } else if (data.status === 'done') {
          meeting.status = 'completed';
          meeting.endTime = new Date();
        } else if (data.status === 'fatal') {
          meeting.status = 'failed';
        }

        await meeting.save();

        io.to(`meeting:${meeting._id}`).emit('bot-status', {
          meetingId: meeting._id,
          status: meeting.status,
        });
        break;
      }

      case 'bot.transcription': {
        const meeting = await Meeting.findOne({ botId: data.bot_id });
        if (!meeting) break;

        const entry = {
          speaker: data.speaker,
          text: data.words?.map((w) => w.text).join(' ') || data.text,
          timestamp: data.start_time,
        };

        meeting.transcript.push(entry);
        await meeting.save();

        io.to(`meeting:${meeting._id}`).emit('transcript-update', {
          meetingId: meeting._id,
          entry,
        });
        break;
      }

      case 'bot.done': {
        const meeting = await Meeting.findOne({ botId: data.bot_id });
        if (!meeting) break;

        try {
          const fullTranscript = await recallService.getBotTranscript(data.bot_id);
          meeting.transcript = fullTranscript.map((entry) => ({
            speaker: entry.speaker,
            text: entry.words?.map((w) => w.text).join(' ') || entry.text,
            timestamp: entry.start_time,
          }));
          meeting.status = 'completed';
          meeting.endTime = new Date();
          await meeting.save();

          if (meeting.transcript.length > 0) {
            const momData = await claudeService.generateMOM(
              meeting.transcript,
              meeting.title
            );

            await MOM.findOneAndUpdate(
              { meeting: meeting._id },
              { meeting: meeting._id, ...momData, generatedAt: new Date() },
              { upsert: true, new: true }
            );

            io.to(`meeting:${meeting._id}`).emit('mom-generated', {
              meetingId: meeting._id,
            });
          }
        } catch (err) {
          console.error('Error processing completed meeting:', err);
        }

        io.to(`meeting:${meeting._id}`).emit('meeting-completed', {
          meetingId: meeting._id,
        });
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/recall/transcription', async (req, res) => {
  try {
    const data = req.body;
    const io = req.app.get('io');

    const meeting = await Meeting.findOne({ botId: data.bot_id });
    if (meeting) {
      const entry = {
        speaker: data.speaker,
        text: data.words?.map((w) => w.text).join(' ') || data.text || '',
        timestamp: data.start_time,
      };

      meeting.transcript.push(entry);
      await meeting.save();

      io.to(`meeting:${meeting._id}`).emit('transcript-update', {
        meetingId: meeting._id,
        entry,
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Transcription webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
