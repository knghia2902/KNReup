# Phase 2: Core Pipeline MVP - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** ROADMAP.md + REQUIREMENTS.md + VideoTransAI reference config

## Phase Boundary

Phase 2 delivers the end-to-end video processing pipeline:
Upload MP4 → Whisper ASR transcribe → Translate → TTS dubbing → FFmpeg merge → export video with subtitles.

**Depends on:** Phase 1 (Tauri shell + FastAPI sidecar bridge — COMPLETE)

## Implementation Decisions

### ASR (Speech Recognition)
- Dùng `faster-whisper` (CTranslate2-based) — nhanh hơn OpenAI Whisper gốc 4x
- Model strategy: `base` cho CPU, `large-v3` cho GPU (theo VRAM detect từ Phase 1)
- VAD Silero để cắt silence, chunked processing để tránh OOM
- Output format: segments list [{start, end, text}]

### Translation
- Engine #1: DeepSeek API — primary online engine
- Engine #2: CTranslate2/Argos offline — fallback khi offline/free
- Abstract interface pattern: `TranslationEngine(ABC)` với `translate()` + `health_check()`
- Retry với exponential backoff ngay từ đầu (ROADMAP note)

### TTS (Text-to-Speech)
- Engine #1: Edge TTS (Microsoft Neural) — primary, free, high quality
- Engine #2: Piper TTS offline (ONNX model vi_VN) — offline fallback
- Abstract interface: `TTSEngine(ABC)` với `synthesize()` + `list_voices()`
- Speed/volume/pitch controls (tham khảo VideoTransAI config: rate, voice_volume, pitch)

### FFmpeg Output
- Merge dubbed audio + original video
- Burn phụ đề ASS via FFmpeg (phương pháp 1 — proven, VideoTransAI đã dùng)
- Audio mix: original_volume + dubbed_volume
- Encoding: H.264 default, CRF 23

### SSE Progress
- Server-Sent Events cho real-time progress streaming
- Test kỹ trên Windows (Defender có thể chặn — ROADMAP note)
- Progress stages: upload → transcribe → translate → tts → merge → done

### Frontend
- Basic upload UI: drag-drop hoặc file picker
- Properties tab TTS: engine select, voice dropdown, speed/volume
- Progress overlay khi processing
- Kết nối endpoint mới vào frontend qua `useSidecar` hook

### Claude's Discretion
- File storage strategy (temp dir vs user-defined output)
- Error handling flow cho mỗi pipeline stage
- Pipeline state machine design
- Chunking strategy cho audio segments

## Canonical References

### Layout & UI
- `.planning/references/layout-spec.md` — Chốt layout, 4 properties tabs
- `.planning/references/videotransai-config.md` — 6 nhóm config, 20+ fields

### Current Architecture
- `python-sidecar/app/main.py` — FastAPI entry, CORS, auto-port
- `python-sidecar/app/routes/health.py` — Health endpoint pattern
- `python-sidecar/app/routes/system.py` — System check pattern
- `python-sidecar/app/utils/gpu_detect.py` — GPU/FFmpeg detection
- `src/hooks/useSidecar.ts` — Frontend sidecar bridge
- `src/lib/sidecar.ts` — API base URL + fetch wrapper

## Specific Ideas

- Voice presets từ VideoTransAI: VOICE_PRESETS tự động apply rate/pitch khi chọn giọng
- Subtitle position 1-5 (trên → dưới) + font_size + color + outline_color
- ASS format: proven, dùng trong VideoTransAI, không cần reinvent

## Deferred Ideas

- Canvas WYSIWYG subtitle preview → Phase 3
- PaddleOCR cho hardsub cứng → Phase 5
- Audio FX pipeline → Phase 4
- Multiple engine fallback chain → Phase 4

---

*Phase: 02-core-pipeline*
*Context gathered: 2026-03-23 from ROADMAP + REQUIREMENTS + VideoTransAI reference*
