---
status: resolved
trigger: "Voice Clone audio play thß║Ñt bß║íi vß╗øi lß╗Öi 404 Not Found tr├¬n backend v├á NotSupportedError tr├¬n frontend"
created: 2026-04-23
updated: 2026-04-23
resolution:
  root_cause: "The backend router was missing the GET /{name}/audio endpoint required by the frontend to play voice samples."
  fix: "Implemented the missing GET /{name}/audio endpoint in python-sidecar/app/routes/tts_profiles.py."
---

# Debug Session: voice-clone-audio-404

## Symptoms
1. **Expected behavior**: Khi nhß║Ñn n├║t Play tr├¬n profile hoß║Àc preview, ├óm thanh phß║úi ─æ╞░ß╗úc ph├ít.
2. **Actual behavior**: Tr├¼nh duyß╗çt b├ío `NotSupportedError`, backend log trả vß╗ü `404 Not Found` cho route `/audio`.
3. **Error messages**: 
   - `VoiceCloneWindow.tsx:197 Uncaught (in promise) NotSupportedError: The element has no supported sources.`
   - `INFO: 127.0.0.1:61547 - "GET /api/tts/profiles/Taothao/audio HTTP/1.1" 404 Not Found`
4. **Timeline**: Xß║úy ra ngay sau khi Clone th├ánh c├┤ng (POST 200 OK).
5. **Reproduction**: Thß╗▒c hiß╗çn Clone mß╗Öt giß╗ìng mß╗¢i, sau ─æ├│ nhß║Ñn n├║t Nghe thß╗¡ (Play) trong danh s├ích profiles.

## Evidence
- timestamp: 2026-04-23T10:00:00Z
  action: Checked `python-sidecar/app/routes/tts_profiles.py`
  observation: Confirmed the route `/{name}/audio` was missing.

## Current Focus
- **Hypothesis**: Route `/{name}/audio` ch╞░a ─æ╞░ß╗ïnh ngh─®a trong `tts_profiles.py` hoß║Àc logic tìm file `.wav` bị sai.
- **Next action**: Bug resolved.

## Resolution
- **Root Cause**: The FastAPI router in `python-sidecar/app/routes/tts_profiles.py` did not have an endpoint to serve the reference audio file for cloned voices.
- **Fix**: Added a `GET /{name}/audio` endpoint that retrieves the `audio_path` from the profile metadata and serves the file using `FileResponse`.
