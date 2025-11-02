import { Mastra } from '@mastra/core';
import { videoTranscriptionAgent } from './agents/video-transcription-agent';
import { videoTranscriptionWorkflow } from './workflows/video-transcription-workflow';

export const mastra = new Mastra({
  agents: {
    videoTranscriptionAgent,
  },
  workflows: {
    videoTranscriptionWorkflow,
  },
  server: {
    port: 4111,
    host: '0.0.0.0',
  },
});
