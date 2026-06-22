let recording = false;
let mediaRecorder = null;
let recordedChunks = [];
let meetingTitle = '';
let offscreenReady = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start-recording') {
    startRecording(message.tabId, message.title);
    sendResponse({ status: 'starting' });
  } else if (message.action === 'stop-recording') {
    stopRecording();
    sendResponse({ status: 'stopping' });
  } else if (message.action === 'get-status') {
    sendResponse({ recording });
  } else if (message.action === 'recording-data') {
    handleRecordingData(message.data, message.mimeType);
    sendResponse({ status: 'received' });
  } else if (message.action === 'recording-stopped') {
    handleRecordingStopped();
    sendResponse({ status: 'ok' });
  }
  return true;
});

async function startRecording(tabId, title) {
  meetingTitle = title || 'Google Meet Recording';
  recording = true;
  recordedChunks = [];

  try {
    await ensureOffscreenDocument();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    chrome.runtime.sendMessage({
      action: 'offscreen-start-recording',
      streamId,
      tabId,
    });

    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  } catch (err) {
    console.error('Failed to start recording:', err);
    recording = false;
  }
}

function stopRecording() {
  chrome.runtime.sendMessage({ action: 'offscreen-stop-recording' });
  recording = false;
  chrome.action.setBadgeText({ text: '' });
}

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording tab audio for meeting transcription',
  });
}

function handleRecordingData(base64Data, mimeType) {
  recordedChunks.push({ data: base64Data, mimeType });
}

async function handleRecordingStopped() {
  if (recordedChunks.length === 0) return;

  try {
    const binaryChunks = recordedChunks.map((chunk) => {
      const binary = atob(chunk.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    });

    const blob = new Blob(binaryChunks, { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('recording', blob, `meeting-${Date.now()}.webm`);
    formData.append('title', meetingTitle);
    formData.append('platform', 'google_meet');

    const cookies = await chrome.cookies?.getAll({ url: 'http://localhost:5000' }) || [];
    const tokenCookie = cookies.find((c) => c.name === 'token');

    const headers = {};
    if (tokenCookie) {
      headers['Cookie'] = `token=${tokenCookie.value}`;
    }

    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'MOM Generator',
        message: 'Meeting recorded! Generating MOM...',
      });
    } else {
      const err = await response.json();
      console.error('Upload failed:', err);
    }
  } catch (err) {
    console.error('Failed to upload recording:', err);
  }

  recordedChunks = [];
}
