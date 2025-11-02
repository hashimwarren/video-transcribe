'use client';

import { useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
  sourceType: z.enum(['url']),
  url: z.string().url('Please enter a valid URL'),
  prompt: z.string().optional(),
});

export default function Home() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Enter a video URL to get started.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTranscript('');
    
    try {
      // Validate form data
      const formData = formSchema.parse({
        sourceType: 'url',
        url,
        prompt: prompt || undefined,
      });
      
      setIsLoading(true);
      setStatus('Transcribing video...');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe video');
      }
      
      setTranscript(data.transcript || '');
      setStatus('Transcription complete.');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Invalid input');
        setStatus('');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStatus('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Transcript downloaded.');
  };

  return (
    <main>
      <h1>Video Transcriber</h1>
      <p>Enter a video URL to transcribe it using AI</p>

      <form onSubmit={handleSubmit}>
        <label>
          Video URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            required
            disabled={isLoading}
          />
        </label>

        <label>
          Prompt (optional)
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add context or spelling hints..."
            disabled={isLoading}
          />
        </label>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Transcribing...' : 'Transcribe Video'}
        </button>
        
        <div className={`status ${error ? 'status--error' : ''}`}>
          {error || status}
        </div>
      </form>

      {transcript && (
        <div className="result-section">
          <div className="result-header">
            <h2>Transcript</h2>
            <button
              type="button"
              className="download-button"
              onClick={handleDownload}
            >
              Download as .txt
            </button>
          </div>
          <textarea
            value={transcript}
            readOnly
            rows={12}
          />
        </div>
      )}
    </main>
  );
}
