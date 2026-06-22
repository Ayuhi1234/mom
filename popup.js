const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const meetingInfo = document.getElementById('meeting-info');
const meetingTitle = document.getElementById('meeting-title');
const notMeeting = document.getElementById('not-meeting');
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');

let timerInterval = null;
let startTime = null;

init();

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  const isMeeting = url.includes('meet.google.com') || url.includes('zoom.us');

  const response = await chrome.runtime.sendMessage({ action: 'get-status' });
  const isRecording = response?.recording;

  if (isRecording) {
    showRecordingState(tab);
  } else if (isMeeting) {
    showReadyState(tab);
  } else {
    showNotMeetingState();
  }
}

function showNotMeetingState() {
  notMeeting.style.display = 'block';
  btnRecord.style.display = 'none';
  btnStop.style.display = 'none';
  meetingInfo.style.display = 'none';
}

function showReadyState(tab) {
  notMeeting.style.display = 'none';
  btnRecord.style.display = 'flex';
  btnStop.style.display = 'none';

  const title = extractMeetingTitle(tab);
  meetingInfo.style.display = 'block';
  meetingTitle.textContent = title;

  btnRecord.onclick = () => startRecording(tab);
}

function showRecordingState(tab) {
  notMeeting.style.display = 'none';
  btnRecord.style.display = 'none';
  btnStop.style.display = 'flex';
  statusBar.className = 'status-bar recording';
  statusText.textContent = 'Recording...';
  statusBar.querySelector('.dot').classList.add('pulse');
  timerEl.style.display = 'inline';

  const title = extractMeetingTitle(tab);
  if (title) {
    meetingInfo.style.display = 'block';
    meetingTitle.textContent = title;
  }

  const saved = localStorage.getItem('recording-start');
  startTime = saved ? parseInt(saved) : Date.now();
  startTimer();

  btnStop.onclick = () => stopRecording();
}

function extractMeetingTitle(tab) {
  const url = tab?.url || '';
  if (url.includes('meet.google.com')) {
    return tab.title?.replace(' - Google Meet', '').trim() || 'Google Meet';
  }
  if (url.includes('zoom.us')) {
    return tab.title?.replace(' - Zoom', '').trim() || 'Zoom Meeting';
  }
  return 'Meeting Recording';
}

async function startRecording(tab) {
  btnRecord.disabled = true;
  btnRecord.textContent = 'Starting...';

  const title = extractMeetingTitle(tab);
  startTime = Date.now();
  localStorage.setItem('recording-start', startTime);

  await chrome.runtime.sendMessage({
    action: 'start-recording',
    tabId: tab.id,
    title,
  });

  setTimeout(() => {
    showRecordingState(tab);
  }, 500);
}

async function stopRecording() {
  btnStop.disabled = true;
  btnStop.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
    </svg>
    Uploading...
  `;

  statusBar.className = 'status-bar uploading';
  statusText.textContent = 'Uploading & generating MOM...';
  statusBar.querySelector('.dot').classList.remove('pulse');
  clearInterval(timerInterval);

  localStorage.removeItem('recording-start');

  await chrome.runtime.sendMessage({ action: 'stop-recording' });
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}
