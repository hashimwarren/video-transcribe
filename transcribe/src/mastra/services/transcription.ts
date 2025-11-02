type TranscriptionRequest = {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
};

export async function transcribeVideo({ buffer, filename, mimeType }: TranscriptionRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not configured.');
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType ?? 'application/octet-stream' });

  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI transcription failed: ${errorBody || response.statusText}`);
  }

  const data: { text?: string } = await response.json();

  if (data.text && data.text.trim().length > 0) {
    return data.text.trim();
  }

  throw new Error('Unable to parse transcription response.');
}

