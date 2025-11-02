# Copilot Instructions for Video Transcription Project

## Project Architecture

This is a **Mastra-based video transcription application** that uses OpenAI's Whisper API to convert video audio into text. The project follows Mastra's opinionated structure with three core components:

- **Tool** (`src/mastra/tools/video-transcription-tool.ts`): Core business logic for transcribing videos
- **Workflow** (`src/mastra/workflows/video-transcription-workflow.ts`): Single-step orchestration wrapping the tool
- **Agent** (`src/mastra/agents/video-transcription-agent.ts`): Conversational interface with memory for interactive use
- **Entry Point** (`src/mastra/index.ts`): Registers all components and configures the server on port 4111

### Data Flow

1. Client sends video path (file or URL) to workflow API endpoint
2. Workflow executes `transcribeVideoStep` which calls `transcribeVideoWithOpenAI()`
3. Tool handles video resolution (downloads URLs to temp files, validates local paths)
4. OpenAI API call made with `gpt-4o-mini-transcribe` model
5. Results returned synchronously via API response

## Critical Configuration

### OpenAI API Compatibility

⚠️ **IMPORTANT**: The OpenAI model `gpt-4o-mini-transcribe` only accepts `response_format` values of `'json'` or `'text'`, NOT `'verbose_json'`. This was recently fixed in the codebase (line 83 of `video-transcription-tool.ts`).

### Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=sk-...
```

## Developer Workflows

### Running the Application

```bash
npm run dev        # Start dev server with hot reload on port 4111
npm run build      # Build Mastra bundle to .mastra/output/
npm run start      # Run production build
```

The Mastra dev server auto-rebuilds on file changes in `src/mastra/`.

### API Endpoints

**Correct workflow invocation pattern** (not `/invoke` - that's incorrect):

```bash
# Start async transcription (returns immediately with status)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"sourceType": "file", "path": "/absolute/path/to/video.mp4"}}' \
  http://localhost:4111/api/workflows/videoTranscriptionWorkflow/start-async

# Check workflow run status (use runId from response)
curl http://localhost:4111/api/workflows/videoTranscriptionWorkflow/runs/{runId}

# List all registered workflows
curl http://localhost:4111/api/workflows
```

**Key gotcha**: Workflow is registered as `videoTranscriptionWorkflow` (camelCase key) in the API, even though its ID is `'video-transcription-workflow'` (kebab-case).

### Input Schema Pattern

The tool uses **discriminated unions** for flexible video sources:

```typescript
// File-based transcription
{
  "inputData": {
    "sourceType": "file",
    "path": "C:/Users/username/video.mp4"  // Absolute path required
  }
}

// URL-based transcription
{
  "inputData": {
    "sourceType": "url",
    "url": "https://example.com/video.mp4",
    "filename": "optional-name.mp4"  // Optional
  }
}

// Optional prompt for context/hints
{
  "inputData": {
    "sourceType": "file",
    "path": "/path/to/video.mp4",
    "prompt": "Technical terms: Mastra, evals, workflows"
  }
}
```

## Project Conventions

### File Organization

- All Mastra code lives in `src/mastra/` (agents, tools, workflows, services)
- Frontend lives in `src/frontend/` but is **not currently served** (merge conflict remnants exist)
- Video files for testing are in project root (`evals-debate.mp4`, `code-4-tasks.mp4`)

### TypeScript Configuration

- Uses `"moduleResolution": "bundler"` for modern ESM resolution
- `"allowImportingTsExtensions": true` but `"noEmit": true` (Mastra handles bundling)
- Node >= 20.9.0 required

### Error Handling Pattern

Tools throw descriptive errors that bubble up through workflow execution:

```typescript
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required to transcribe videos.');
}
```

Failed workflows return `{"status": "failed", "error": "..."}` in API responses.

## Common Tasks

### Adding New Video Sources

1. Extend the discriminated union in `video-transcription-tool.ts`:
   ```typescript
   const newSourceSchema = z.object({
     sourceType: z.literal('s3'),
     bucket: z.string(),
     key: z.string()
   });
   
   export const videoSourceSchema = z.discriminatedUnion('sourceType', [
     urlSourceSchema,
     fileSourceSchema,
     newSourceSchema  // Add here
   ]);
   ```

2. Handle in `resolveVideoSource()` switch statement

### Modifying Transcription Output

Edit the OpenAI request in `transcribeVideoWithOpenAI()` (line ~75):
- Change `model` field for different Whisper variants
- Add `language` parameter to force specific language detection
- Adjust `response_format` (remember: only `'json'` or `'text'` allowed)

### Debugging Workflow Execution

Check the terminal running `npm run dev` - Mastra logs all step executions with timestamps and payloads. Failed steps show full stack traces.

## Frontend (Currently Broken)

The `src/frontend/index.html` file contains **merge conflict markers** from multiple attempted implementations. It references:
- A hardcoded path to `evals-debate.mp4`
- Incorrect API endpoint `/api/workflows/video-transcription-workflow/invoke`
- Mastra doesn't serve static files from `src/frontend/` by default

To fix: Either use `src/mastra/public/` for Mastra's built-in static serving, or configure a custom Hono route in `src/mastra/index.ts`.

## Integration Points

- **OpenAI API**: Direct fetch to `https://api.openai.com/v1/audio/transcriptions`
- **File System**: Node.js `fs.promises` for reading local videos, `fs.createWriteStream` for URL downloads
- **Temp Files**: Downloads URLs to `os.tmpdir()` with cleanup callbacks
- **Memory**: Agent uses LibSQL for conversation history (`mastra.db` file in parent directory)
