const form = document.getElementById('transcribe-form');
const serverInput = document.getElementById('server-url');
const agentInput = document.getElementById('agent-id');
const videoInput = document.getElementById('video-input');
const statusEl = document.getElementById('status');
const transcriptOutput = document.getElementById('transcript-output');
const copyButton = document.getElementById('copy-button');

const MASRA_VOICE_ENDPOINT = '/mastra/agents/{agentId}/voice/listen';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('status--error', isError);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function sendForTranscription(event) {
  event.preventDefault();

  const file = videoInput.files?.[0];
  if (!file) {
    setStatus('Please select a video file before submitting.', true);
    return;
  }

  const serverUrl = serverInput.value.trim().replace(/\/$/, '');
  const agentId = agentInput.value.trim();

  if (!serverUrl || !agentId) {
    setStatus('Please provide both the server URL and agent id.', true);
    return;
  }

  try {
    setStatus('Preparing video upload…');
    const arrayBuffer = await file.arrayBuffer();
    const base64Payload = arrayBufferToBase64(arrayBuffer);

    const endpoint = `${serverUrl}${MASRA_VOICE_ENDPOINT.replace('{agentId}', encodeURIComponent(agentId))}`;

    setStatus('Sending video to Mastra…');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Payload,
        options: {
          mimeType: file.type,
          fileName: file.name,
          encoding: 'base64',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    const transcript = result?.text ?? '';

    if (!transcript) {
      setStatus('The server responded but no transcript was returned.', true);
      transcriptOutput.value = '';
      return;
    }

    transcriptOutput.value = transcript;
    setStatus('Transcription completed successfully.');
    videoInput.value = '';
  } catch (error) {
    console.error(error);
    setStatus(`Something went wrong: ${error.message}`, true);
  }
}

async function copyTranscript() {
  const text = transcriptOutput.value.trim();
  if (!text) {
    setStatus('There is no transcript to copy yet.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Transcript copied to your clipboard.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to copy to clipboard. Please copy manually.', true);
  }
}

form.addEventListener('submit', sendForTranscription);
copyButton.addEventListener('click', copyTranscript);

videoInput.addEventListener('change', () => {
  if (videoInput.files?.length) {
    const file = videoInput.files[0];
    setStatus(`Ready to upload “${file.name}”.`);
  }
});
