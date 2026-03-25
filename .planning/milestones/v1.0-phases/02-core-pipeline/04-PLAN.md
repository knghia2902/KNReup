---
phase: 2
plan: 4
title: "FFmpeg Output + SSE Progress + Upload UI"
wave: 2
depends_on: [1, 2, 3]
files_modified:
  - python-sidecar/app/engines/output.py
  - python-sidecar/app/routes/pipeline.py
  - python-sidecar/app/pipeline_runner.py
  - src/hooks/usePipeline.ts
  - src/components/editor/UploadPanel.tsx
  - src/components/editor/UploadPanel.css
  - src/components/editor/ProcessingOverlay.tsx
  - src/components/editor/ProcessingOverlay.css
  - src/App.tsx
requirements_addressed: [R1.8, R2.1]
autonomous: true
---

# Plan 04: FFmpeg Output + SSE Progress + Upload UI

<objective>
Complete the pipeline: FFmpeg merge audio+video+subtitles, SSE progress streaming,
basic upload UI + processing overlay. End result: user uploads video → sees real-time progress → gets dubbed video output.
</objective>

## Tasks

<task id="4.1">
<title>FFmpeg output builder</title>
<read_first>
- python-sidecar/app/utils/gpu_detect.py (ffmpeg detection)
- .planning/references/videotransai-config.md (subtitle config: position, font_size, color, outline_color)
</read_first>
<action>
Tạo `python-sidecar/app/engines/output.py`:
- Class `FFmpegOutputBuilder`:
  - `__init__(self, input_video: str, output_path: str)` — store paths
  - `add_dubbed_audio(self, audio_files: list[str], original_volume: float = 0.1)` — mix dubbed segments with original audio
  - `add_subtitles_ass(self, segments: list[dict], config: dict)` → generate ASS file + burn vào video
    - ASS format: `[Script Info]`, `[V4+ Styles]`, `[Events]`
    - Style config: font_name="Arial", font_size=50, primary_colour="&H0000FFFF" (yellow, từ VideoTransAI default), outline_colour="&H00000000" (black)
    - Position mapping (1-5): Alignment values in ASS format (8=top, 2=bottom, 5=center, etc.)
  - `build(self, codec="libx264", crf=23) -> str` → run ffmpeg command, return output path
    - FFmpeg command construction: `-i input -i dubbed_audio -filter_complex "[1:a]volume=1[dub];[0:a]volume={original_volume}[orig];[dub][orig]amix=inputs=2" -c:v {codec} -crf {crf} -ass subtitle.ass output.mp4`
    - Progress parsing: read stderr for `time=` updates
  - `generate_ass_file(self, segments, config) -> str` → write .ass file, return path

Config dict structure (matching VideoTransAI):
```python
subtitle_config = {
    "enabled": True,
    "position": 2,      # 1-5 (1=top, 5=bottom)
    "font_size": 50,
    "color": "#FFFF00",
    "outline_color": "#000000",
}
```
</action>
<acceptance_criteria>
- `output.py` contains `class FFmpegOutputBuilder`
- `add_subtitles_ass` generates valid ASS content
- ASS file contains `[Script Info]`, `[V4+ Styles]`, `[Events]`
- `build` method constructs ffmpeg command with `-c:v libx264 -crf 23`
- Position mapping 1-5 present
- Default color `#FFFF00` in code
</acceptance_criteria>
</task>

<task id="4.2">
<title>Pipeline runner với SSE progress</title>
<read_first>
- python-sidecar/app/routes/pipeline.py (existing endpoints)
- python-sidecar/app/main.py (app setup)
</read_first>
<action>
Tạo `python-sidecar/app/pipeline_runner.py`:
- Class `PipelineRunner`:
  - Stages: `["upload", "transcribe", "translate", "tts", "merge", "done"]`
  - `async def run(self, video_path, config) -> AsyncGenerator[dict, None]`:
    - Yield progress events: `{"stage": str, "progress": float, "message": str}`
    - Stage 1: Transcribe → yield progress 0-25%
    - Stage 2: Translate → yield progress 25-50%  
    - Stage 3: TTS → yield progress 50-75%
    - Stage 4: Merge → yield progress 75-100%
    - Final: `{"stage": "done", "progress": 100, "output_path": str}`

Add SSE endpoint to `python-sidecar/app/routes/pipeline.py`:
- `POST /api/pipeline/process` — accept video file + config JSON
  - Return: `StreamingResponse` with `text/event-stream` content type
  - Format: `data: {"stage":"transcribe","progress":15,"message":"..."}\n\n`
  - Each stage yields multiple progress updates

- `POST /api/pipeline/process-simple` — Non-streaming version for testing
  - Run full pipeline, return final result JSON
</action>
<acceptance_criteria>
- `pipeline_runner.py` contains `class PipelineRunner`
- `PipelineRunner.run` is an async generator yielding dicts
- SSE endpoint returns `StreamingResponse` with content-type `text/event-stream`
- Progress events have keys `stage`, `progress`, `message`
- Stages list: `upload`, `transcribe`, `translate`, `tts`, `merge`, `done`
- Non-streaming fallback endpoint exists at `/api/pipeline/process-simple`
</acceptance_criteria>
</task>

<task id="4.3">
<title>Frontend upload panel + processing overlay</title>
<read_first>
- src/hooks/useSidecar.ts (existing hook pattern)
- src/lib/sidecar.ts (API base URL)
- src/components/layout/NLELayout.tsx (media bin + preview slots)
- src/styles/design-system.css (design tokens)
- .agent/skills/taste-skill/skills/taste-skill/SKILL.md (design rules)
</read_first>
<action>
1. Tạo `src/hooks/usePipeline.ts`:
   - Hook `usePipeline()` returns: `{ processing, progress, stage, message, error, startPipeline, cancelPipeline }`
   - `startPipeline(file: File, config: PipelineConfig)`:
     - POST to `/api/pipeline/process` with FormData
     - Parse SSE stream: `EventSource` or fetch + ReadableStream
     - Update state on each progress event
   - `cancelPipeline()`: abort fetch, POST to `/api/pipeline/cancel`

2. Tạo `src/components/editor/UploadPanel.tsx` (taste-skill compliant):
   - Drag & drop zone in Media Bin panel
   - File picker button
   - Show uploaded file info (name, size, duration)
   - Phosphor Icons: `Upload, File, VideoCamera`
   - No emojis

3. Tạo `src/components/editor/UploadPanel.css`:
   - Drop zone: dashed border, pulse animation on drag-over
   - Glass panel styling from design system

4. Tạo `src/components/editor/ProcessingOverlay.tsx`:
   - Full-screen overlay khi processing
   - Circular progress indicator (CSS only, no canvas)
   - Stage name + percentage + message
   - Cancel button
   - Phosphor Icons: `CircleNotch, CheckCircle, XCircle`

5. Tạo `src/components/editor/ProcessingOverlay.css`:
   - Overlay with backdrop-blur
   - Progress ring animation (CSS `conic-gradient`)
   - Stage badges with status colors

6. Update `src/App.tsx`:
   - Import usePipeline hook
   - Pass UploadPanel as mediaBin prop
   - Show ProcessingOverlay when processing
</action>
<acceptance_criteria>
- `usePipeline.ts` exports `usePipeline` hook
- `usePipeline` has `startPipeline`, `cancelPipeline` methods
- `UploadPanel.tsx` has drag-drop zone with `onDragOver`, `onDrop` handlers
- `UploadPanel.tsx` imports from `@phosphor-icons/react` (no emojis)
- `ProcessingOverlay.tsx` shows progress percentage and stage name
- `App.tsx` imports `usePipeline` and renders both components
- No emoji characters in any file
</acceptance_criteria>
</task>

## Verification

- Start sidecar: `python run_dev.py` → test SSE: `curl -N -X POST http://127.0.0.1:8008/api/pipeline/process-simple -F "file=@test.mp4"` returns progress events
- Start Vite: `npm run dev` → open browser → drag video into Media Bin → processing overlay appears
- `npx tsc --noEmit` → 0 errors
- `npx vite build` → successful, no SSE type errors

## must_haves
- FFmpeg output produces valid MP4 with dubbed audio + ASS subtitles
- SSE progress works on Windows (test Defender interference)
- Upload UI is taste-skill compliant (no emojis, Phosphor Icons, dark theme)
- Pipeline stages tracked with real-time progress
