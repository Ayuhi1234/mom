const axios = require('axios');

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_URL = 'https://api.zoom.us/v2';

function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOOM_CLIENT_ID,
    redirect_uri: process.env.ZOOM_REDIRECT_URI,
  });
  return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

async function getTokensFromCode(code) {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(ZOOM_TOKEN_URL, null, {
    params: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.ZOOM_REDIRECT_URI,
    },
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(ZOOM_TOKEN_URL, null, {
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function getUpcomingMeetings(user) {
  let { accessToken, refreshToken, expiresAt } = user.zoomTokens;

  if (new Date() >= new Date(expiresAt)) {
    const newTokens = await refreshAccessToken(refreshToken);
    user.zoomTokens = newTokens;
    await user.save();
    accessToken = newTokens.accessToken;
  }

  const { data } = await axios.get(`${ZOOM_API_URL}/users/me/meetings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { type: 'upcoming', page_size: 20 },
  });

  return (data.meetings || []).map((meeting) => ({
    title: meeting.topic,
    meetingUrl: meeting.join_url,
    meetingId: String(meeting.id),
    startTime: meeting.start_time,
    duration: meeting.duration,
    platform: 'zoom',
    externalId: String(meeting.id),
  }));
}

module.exports = { getAuthUrl, getTokensFromCode, getUpcomingMeetings };
