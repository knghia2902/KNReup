---
phase: 2
plan: 3
title: "TTS Engines — Edge TTS + Piper Offline"
wave: 2
depends_on: [1, 2]
files_modified:
  - python-sidecar/app/engines/tts/__init__.py
  - python-sidecar/app/engines/tts/edge_tts_engine.py
  - python-sidecar/app/engines/tts/piper_engine.py
  - python-sidecar/app/routes/pipeline.py
  - python-sidecar/requirements.txt
requirements_addressed: [R1.6]
autonomous: true
---

# Plan 03: TTS Engines — Edge TTS + Piper Offline

<objective>
Implement 2 TTS engines theo TTSEngine ABC:
- Edge TTS (Microsoft Neural) — primary, online, free
- Piper TTS (ONNX) — offline fallback
Endpoint cho TTS synthesis + voice listing.
</objective>

## Tasks

<task id="3.1">
<title>Implement Edge TTS engine</title>
<read_first>
- python-sidecar/app/engines/base.py (TTSEngine ABC)
- .planning/references/videotransai-config.md (voice config: rate, volume, pitch)
</read_first>
<action>
Tạo `python-sidecar/app/engines/tts/__init__.py` (empty).

Tạo `python-sidecar/app/engines/tts/edge_tts_engine.py`:
- Class `EdgeTTSEngine(TTSEngine)`:
  - `engine_name = "edge_tts"`
  - `is_online = True`
  - `synthesize()`:
    - Dùng `edge_tts.Communicate(text, voice, rate=rate_str, volume=vol_str, pitch=pitch_str)`
    - Rate format: `"+0%"` for 1.0, `"+50%"` for 1.5, `"-30%"` for 0.7
    - Volume format: `"+0%"` for 1.0
    - Pitch format: `"+0Hz"` for 0.5 (default), `"+10Hz"` for higher
    - Save to output_path as MP3
  - `list_voices()`:
    - `import edge_tts; voices = await edge_tts.list_voices()`
    - Return filtered: `[{"name": v["ShortName"], "locale": v["Locale"], "gender": v["Gender"]} for v in voices]`
    - Default filter: locale startsWith "vi" for Vietnamese voices
  - `health_check()`: try list_voices(), return True if succeeds

Default voice: `vi-VN-HoaiMyNeural` (từ VideoTransAI config)
</action>
<acceptance_criteria>
- `edge_tts_engine.py` contains `class EdgeTTSEngine(TTSEngine)`
- `engine_name` is `"edge_tts"`
- `synthesize` method uses `edge_tts.Communicate`
- `list_voices` returns list with keys `name`, `locale`, `gender`
- Default voice `vi-VN-HoaiMyNeural` present in code
- Rate/volume/pitch formatting logic present
</acceptance_criteria>
</task>

<task id="3.2">
<title>Implement Piper TTS offline engine</title>
<read_first>
- python-sidecar/app/engines/tts/edge_tts_engine.py (pattern reference)
- python-sidecar/app/engines/base.py
</read_first>
<action>
Tạo `python-sidecar/app/engines/tts/piper_engine.py`:
- Class `PiperTTSEngine(TTSEngine)`:
  - `engine_name = "piper"`
  - `is_online = False`
  - Constructor: `model_path: str = None` — path to ONNX model file
  - `synthesize()`:
    - Dùng `piper` Python package hoặc subprocess call
    - Command: `piper --model {model_path} --output_file {output_path}`
    - Stdin: text content
    - Rate/pitch/volume: piper supports --length_scale (speed), --noise_scale (variation)
  - `list_voices()`: scan model directory, return available .onnx models
  - `health_check()`: check model_path exists and piper binary available
  - Model download helper: `download_vi_model()` — download vi_VN ONNX model from piper releases

Note: Piper models ~30MB per language, much smaller than NN models.
</action>
<acceptance_criteria>
- `piper_engine.py` contains `class PiperTTSEngine(TTSEngine)`
- `engine_name` is `"piper"`
- `is_online` is `False`
- `synthesize` method executes piper binary or library
- `health_check` verifies model file exists
</acceptance_criteria>
</task>

<task id="3.3">
<title>Tạo TTS endpoints</title>
<read_first>
- python-sidecar/app/routes/pipeline.py (translate endpoint pattern)
</read_first>
<action>
Add to `python-sidecar/app/routes/pipeline.py`:

1. Endpoint `GET /api/pipeline/voices`:
   - Query param: `engine` (edge_tts | piper, default: edge_tts)
   - Return: `{"voices": [...], "engine": str}`

2. Endpoint `POST /api/pipeline/tts`:
   - Body JSON: `{"segments": [...], "engine": "edge_tts", "voice": "vi-VN-HoaiMyNeural", "rate": 1.0, "volume": 1.0, "pitch": 0.5}`
   - Process: for each segment, synthesize audio → save as temp file
   - Return: `{"audio_files": [{"segment_id": int, "path": str, "duration": float}], "engine_used": str}`

3. Engine factory: `get_tts_engine(engine_name)` → return correct engine instance
</action>
<acceptance_criteria>
- `pipeline.py` contains `GET` endpoint for `/api/pipeline/voices`
- `pipeline.py` contains `POST` endpoint for `/api/pipeline/tts`
- `get_tts_engine` function creates EdgeTTSEngine or PiperTTSEngine
- TTS endpoint accepts `segments`, `engine`, `voice`, `rate` params
</acceptance_criteria>
</task>

<task id="3.4">
<title>Update requirements.txt</title>
<read_first>
- python-sidecar/requirements.txt
</read_first>
<action>
Append to `python-sidecar/requirements.txt`:
```
edge-tts>=7.0.0
piper-tts>=1.2.0
```
</action>
<acceptance_criteria>
- `requirements.txt` contains `edge-tts>=7.0.0`
- `requirements.txt` contains `piper-tts>=1.2.0`
</acceptance_criteria>
</task>

## Verification

- `python -c "from app.engines.tts.edge_tts_engine import EdgeTTSEngine; print('OK')"` succeeds
- `curl http://127.0.0.1:8008/api/pipeline/voices?engine=edge_tts` returns Vietnamese voices list
- Edge TTS test: `curl -X POST /api/pipeline/tts -d '{"segments":[{"text":"Xin chào"}],"engine":"edge_tts","voice":"vi-VN-HoaiMyNeural"}'` returns audio file path

## must_haves
- Edge TTS produces Vietnamese speech
- Piper offline fallback works without internet
- Voice listing endpoint returns filterable list
- Rate/volume/pitch controls functional
