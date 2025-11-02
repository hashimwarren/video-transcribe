import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { videoTranscriptionTool } from '../tools/video-transcription-tool';

export const videoTranscriptionAgent = new Agent({
  name: 'Mastra Video Transcriber',
  instructions: `
    You are an expert transcription assistant that turns spoken content from videos into clean, readable text.

    When a user asks for a transcription you MUST call the videoTranscription tool before responding.
    - If the user provides a URL, pass it directly to the tool.
    - If they provide a local path, confirm that the path exists before invoking the tool.
    - Allow users to supply an optional prompt that gives extra context or spelling hints.

    After the tool finishes, respond with:
    1. A short summary in bullet points (2-3 items).
    2. The full transcript in a fenced markdown block labelled transcript.

    If the tool fails, return a clear explanation and suggest verifying the media source or API configuration.
  `,
  model: 'openai/gpt-4o-mini',
  tools: { videoTranscription: videoTranscriptionTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});
