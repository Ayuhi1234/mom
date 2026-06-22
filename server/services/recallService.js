const axios = require('axios');

const RECALL_API_URL = 'https://api.recall.ai/api/v1';

function getHeaders() {
  return {
    Authorization: `Token ${process.env.RECALL_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sendBotToMeeting(meetingUrl, botName = 'MOM Bot') {
  const { data } = await axios.post(
    `${RECALL_API_URL}/bot`,
    {
      meeting_url: meetingUrl,
      bot_name: botName,
      transcription_options: {
        provider: 'default',
      },
      real_time_transcription: {
        destination_url: `${process.env.RECALL_WEBHOOK_URL || 'https://your-server.com'}/api/webhooks/recall/transcription`,
        partial_results: true,
      },
    },
    { headers: getHeaders() }
  );
  return data;
}

async function getBotStatus(botId) {
  const { data } = await axios.get(
    `${RECALL_API_URL}/bot/${botId}`,
    { headers: getHeaders() }
  );
  return data;
}

async function getBotTranscript(botId) {
  const { data } = await axios.get(
    `${RECALL_API_URL}/bot/${botId}/transcript`,
    { headers: getHeaders() }
  );
  return data;
}

async function removeBotFromMeeting(botId) {
  const { data } = await axios.post(
    `${RECALL_API_URL}/bot/${botId}/leave`,
    {},
    { headers: getHeaders() }
  );
  return data;
}

module.exports = { sendBotToMeeting, getBotStatus, getBotTranscript, removeBotFromMeeting };
