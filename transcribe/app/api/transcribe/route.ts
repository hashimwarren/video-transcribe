import { NextRequest, NextResponse } from 'next/server';
import { transcribeVideoWithOpenAI } from '../../../src/mastra/tools/video-transcription-tool';
import { z } from 'zod';

const requestSchema = z.object({
  sourceType: z.enum(['url', 'file']),
  url: z.string().url().optional(),
  path: z.string().optional(),
  prompt: z.string().optional(),
}).refine(
  (data) => {
    if (data.sourceType === 'url') return !!data.url;
    if (data.sourceType === 'file') return !!data.path;
    return false;
  },
  {
    message: 'URL is required for url sourceType, path is required for file sourceType',
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    const validatedData = requestSchema.parse(body);
    
    let transcriptionInput;
    if (validatedData.sourceType === 'url' && validatedData.url) {
      transcriptionInput = {
        sourceType: 'url' as const,
        url: validatedData.url,
        prompt: validatedData.prompt,
      };
    } else if (validatedData.sourceType === 'file' && validatedData.path) {
      transcriptionInput = {
        sourceType: 'file' as const,
        path: validatedData.path,
        prompt: validatedData.prompt,
      };
    } else {
      throw new Error('Invalid input data');
    }

    const result = await transcribeVideoWithOpenAI(transcriptionInput);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe video' },
      { status: 500 }
    );
  }
}
