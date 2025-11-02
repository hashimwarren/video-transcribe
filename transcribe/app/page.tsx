'use client';

import { useState } from 'react';
import { z } from 'zod';

const urlFormSchema = z.object({
  sourceType: z.literal('url'),
  url: z.string().url('Please enter a valid URL'),
  prompt: z.string().optional(),
});

const fileFormSchema = z.object({
  sourceType: z.literal('file'),
  file: z.instanceof(File, { message: 'Please select a file' }),
  prompt: z.string().optional(),
});

type InputMode = 'url' | 'file';

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Enter a video URL or upload a file to get started.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTranscript('');
    
    try {
      let requestBody;
      
      if (inputMode === 'url') {
        // Validate URL form data
        const formData = urlFormSchema.parse({
          sourceType: 'url',
          url,
          prompt: prompt || undefined,
        });
        requestBody = formData;
      } else {
        // Validate file form data
        if (!file) {
          throw new z.ZodError([{
            code: 'custom',
            path: ['file'],
            message: 'Please select a file',
          }]);
        }
        
        // For file upload, we'll need to handle it differently
        // Since the API expects a path, we'll show an error for now
        setError('File upload requires server-side file handling. Please use a URL instead.');
        setStatus('');
        return;
      }
      
      setIsLoading(true);
      setStatus('Transcribing video...');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              value="url"
              checked={inputMode === 'url'}
              onChange={(e) => setInputMode(e.target.value as InputMode)}
              disabled={isLoading}
            />
            Video URL
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              value="file"
              checked={inputMode === 'file'}
              onChange={(e) => setInputMode(e.target.value as InputMode)}
              disabled={isLoading}
            />
            Upload File
          </label>
        </div>

        {inputMode === 'url' ? (
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
        ) : (
          <label>
            Video File
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isLoading}
            />
          </label>
        )}

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
