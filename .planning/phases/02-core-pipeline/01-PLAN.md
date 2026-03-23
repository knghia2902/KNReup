---
phase: 2
plan: 1
title: "Whisper ASR Integration"
wave: 1
depends_on: []
files_modified:
  - python-sidecar/app/engines/__init__.py
  - python-sidecar/app/engines/asr.py
  - python-sidecar/app/routes/pipeline.py
  - python-sidecar/requirements.txt
requirements_addressed: [R1.1]
autonomous: true
---

# Plan 01: Whisper ASR Integration

<objective>
Tích hợp faster-whisper cho speech recognition. Upload audio/video → transcribe → trả về segments list.
Model strategy: `base` cho CPU, `large-v3` cho GPU (dựa trên VRAM detect từ Phase 1).
VAD Silero + chunked processing để tối ưu RAM.
</objective>

## Tasks

<task id="1.1">
<title>Tạo ASR engine module</title>
<read_first>
- python-sidecar/app/routes/system.py (pattern hiện tại)
- python-sidecar/app/utils/gpu_detect.py (GPU detect logic hiện tại)
</read_first>
<action>
Tạo `python-sidecar/app/engines/__init__.py` (empty).

Tạo `python-sidecar/app/engines/asr.py`:
- Class `WhisperASR` với methods:
  - `__init__(self, model_size="base", device="cpu", compute_type="int8")` — load faster-whisper model
  - `transcribe(self, audio_path: str, language: str = None) -> list[dict]` — transcribe audio, return segments
  - `detect_best_model(cls) -> tuple[str, str, str]` — class method, dùng gpu_detect để chọn model:
    - Nếu GPU available + VRAM >= 4GB: return ("large-v3", "cuda", "float16")
    - Nếu GPU available + VRAM < 4GB: return ("medium", "cuda", "int8_float16")
    - Nếu CPU only: return ("base", "cpu", "int8")
  - `get_model_info(self) -> dict` — return model_size, device, compute_type

- VAD config: `vad_filter=True, vad_parameters=dict(min_silence_duration_ms=500)`
- Segment output format: `[{"start": float, "end": float, "text": str, "words": list}]`
- Chunked processing: xử lý từng segment, yield results qua generator
</action>
<acceptance_criteria>
- `python-sidecar/app/engines/asr.py` contains `class WhisperASR`
- `WhisperASR` has methods `transcribe`, `detect_best_model`, `get_model_info`
- `transcribe` returns list of dicts with keys `start`, `end`, `text`
- `detect_best_model` returns tuple of 3 strings
- `vad_filter=True` present in transcribe call
- File imports `from faster_whisper import WhisperModel`
</acceptance_criteria>
</task>

<task id="1.2">
<title>Tạo pipeline route - transcribe endpoint</title>
<read_first>
- python-sidecar/app/routes/health.py (router pattern)
- python-sidecar/app/main.py (router registration)
</read_first>
<action>
Tạo `python-sidecar/app/routes/pipeline.py`:
- `router = APIRouter(prefix="/api/pipeline")`
- Endpoint `POST /api/pipeline/transcribe`:
  - Accept: `UploadFile` (audio/video file)
  - Process: save temp file → WhisperASR.transcribe() → cleanup temp
  - Return: `{"segments": [...], "language": str, "duration": float}`
  - Error handling: try/except, return 500 with error message

Update `python-sidecar/app/main.py`:
- Import pipeline router
- `app.include_router(pipeline_router)`
</action>
<acceptance_criteria>
- `python-sidecar/app/routes/pipeline.py` contains `POST` endpoint
- `pipeline.py` imports `WhisperASR` from `app.engines.asr`
- `main.py` contains `include_router` for pipeline router
- Endpoint path is `/api/pipeline/transcribe`
- Endpoint accepts `UploadFile`
</acceptance_criteria>
</task>

<task id="1.3">
<title>Update requirements.txt với ASR dependencies</title>
<read_first>
- python-sidecar/requirements.txt (current deps)
</read_first>
<action>
Append to `python-sidecar/requirements.txt`:
```
faster-whisper>=1.1.0
python-multipart>=0.0.18
```
</action>
<acceptance_criteria>
- `requirements.txt` contains `faster-whisper>=1.1.0`
- `requirements.txt` contains `python-multipart>=0.0.18`
</acceptance_criteria>
</task>

## Verification

- `pip install -r requirements.txt` succeeds
- `python -c "from app.engines.asr import WhisperASR; print('OK')"` succeeds
- `curl -X POST http://127.0.0.1:8008/api/pipeline/transcribe -F "file=@test.mp4"` returns JSON with segments

## must_haves
- faster-whisper model loads correctly on GPU/CPU
- Transcription returns timestamped segments
- VAD filtering enabled
- Model auto-selection based on GPU VRAM
