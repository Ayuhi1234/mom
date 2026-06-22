let mediaRecorder = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'offscreen-start-recording') {
    startRecording(message.streamId);
    sendResponse({ status: 'started' });
  } else if (message.action === 'offscreen-stop-recording') {
    stopRecording();
    sendResponse({ status: 'stopped' });
  }
  return true;
});

async function startRecording(streamId) {
  try {
    const tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
    });

    let combinedStream = tabStream;

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const audioContext = new AudioContext();
      const tabSource = audioContext.createMediaStreamSource(tabStream);
      const micSource = audioContext.createMediaStreamSource(micStream);
      const destination = audioContext.createMediaStreamDestination();

      tabSource.connect(destination);
      micSource.connect(destination);

      combinedStream = destination.stream;

      combinedStream._micStream = micStream;
      combinedStream._tabStream = tabStream;
      combinedStream._audioContext = audioContext;
    } catch (micErr) {
      console.warn('Mic access denied, recording tab audio only:', micErr.message);
    }

    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const buffer = await event.data.arrayBuffer();
        const binary = Array.from(new Uint8Array(buffer))
          .map((b) => String.fromCharCode(b))
          .join('');
        const base64 = btoa(binary);

        chrome.runtime.sendMessage({
          action: 'recording-data',
          data: base64,
          mimeType: event.data.type,
        });
      }
    };

    mediaRecorder.onstop = () => {
      if (combinedStream._micStream) {
        combinedStream._micStream.getTracks().forEach((t) => t.stop());
      }
      if (combinedStream._tabStream) {
        combinedStream._tabStream.getTracks().forEach((t) => t.stop());
      }
      if (combinedStream._audioContext) {
        combinedStream._audioContext.close();
      }
      tabStream.getTracks().forEach((t) => t.stop());
      chrome.runtime.sendMessage({ action: 'recording-stopped' });
    };

    mediaRecorder.start(10000);
  } catch (err) {
    console.error('Offscreen recording error:', err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
