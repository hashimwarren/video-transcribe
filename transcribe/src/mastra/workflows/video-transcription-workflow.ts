import { createStep, createWorkflow } from '@mastra/core/workflows';
import {
  transcribeVideoWithOpenAI,
  videoTranscriptionInputSchema,
  videoTranscriptionOutputSchema,
} from '../tools/video-transcription-tool';

const transcribeVideoStep = createStep({
  id: 'transcribe-video',
  description: 'Transcribes spoken audio from a video source using OpenAI Whisper.',
  inputSchema: videoTranscriptionInputSchema,
  outputSchema: videoTranscriptionOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Video transcription input is required.');
    }

    return transcribeVideoWithOpenAI(inputData);
  },
});

const videoTranscriptionWorkflow = createWorkflow({
  id: 'video-transcription-workflow',
  inputSchema: videoTranscriptionInputSchema,
  outputSchema: videoTranscriptionOutputSchema,
}).then(transcribeVideoStep);

videoTranscriptionWorkflow.commit();

export { videoTranscriptionWorkflow };
