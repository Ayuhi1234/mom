const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_FILE_SIZE = 24 * 1024 * 1024; // 24MB to stay under 25MB limit

async function splitAudio(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size <= MAX_FILE_SIZE) return [filePath];

  const numChunks = Math.ceil(stats.size / MAX_FILE_SIZE);
  const duration = await getAudioDuration(filePath);
  const chunkDuration = Math.ceil(duration / numChunks);

  const chunks = [];
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);

  for (let i = 0; i < numChunks; i++) {
    const chunkPath = path.join(dir, `chunk-${i}-${Date.now()}${ext}`);
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(i * chunkDuration)
        .setDuration(chunkDuration)
        .output(chunkPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    chunks.push(chunkPath);
  }

  return chunks;
}

function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 600);
    });
  });
}

async function transcribeAudio(filePath) {
  const chunks = await splitAudio(filePath);
  const allSegments = [];
  let timeOffset = 0;

  for (const chunkPath of chunks) {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
    });

    const segments = (transcription.segments || []).map((seg) => ({
      speaker: 'Speaker',
      text: seg.text.trim(),
      timestamp: (seg.start || 0) + timeOffset,
    }));

    if (segments.length > 0) {
      allSegments.push(...segments);
      const lastSeg = transcription.segments[transcription.segments.length - 1];
      timeOffset += lastSeg?.end || 0;
    } else if (transcription.text) {
      allSegments.push({ speaker: 'Speaker', text: transcription.text, timestamp: timeOffset });
    }

    if (chunkPath !== filePath) {
      fs.unlink(chunkPath, () => {});
    }
  }

  return allSegments.length > 0
    ? allSegments
    : [{ speaker: 'Speaker', text: 'No speech detected', timestamp: 0 }];
}

async function generateMOM(transcript, meetingTitle) {
  const transcriptText = transcript
    .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.speaker}: ${entry.text}`)
    .join('\n');

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `You are a professional meeting secretary. Generate structured Minutes of Meeting (MOM) from the following transcript.

Meeting Title: ${meetingTitle}

Transcript:
${transcriptText}

Generate the MOM in the following JSON format:
{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "agendaItems": ["List of topics discussed"],
  "keyDiscussionPoints": ["Key points from discussions"],
  "decisions": ["Decisions that were made"],
  "actionItems": [
    {
      "description": "What needs to be done",
      "assignee": "Person responsible (from the transcript speakers)",
      "dueDate": null
    }
  ],
  "nextSteps": ["Follow-up items and next steps"]
}

Return ONLY valid JSON, no markdown formatting or code blocks.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

function formatTimestamp(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

module.exports = { generateMOM, transcribeAudio };
