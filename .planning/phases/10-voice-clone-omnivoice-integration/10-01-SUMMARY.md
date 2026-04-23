---
phase: 10
plan: 01
title: "Backend API — Voice Clone & Design Endpoints"
subsystem: "python-sidecar"
tags: ["voice-clone", "tts", "omnivoice", "api", "backend"]
tech-stack:
  added: ["librosa", "soundfile", "omnivoice"]
  patterns: ["FastAPI routing", "Offline Engine pattern", "Audio Validation"]
key-files:
  created: []
  modified:
    - python-sidecar/app/engines/tts/omnivoice_engine.py
    - python-sidecar/app/routes/tts_profiles.py
metrics:
  duration: 5
  completed_date: "2024-05-18"
---

# Phase 10 Plan 01: Backend API — Voice Clone & Design Endpoints Summary

Implemented OmniVoice engine extensions and FastAPI routes for voice cloning and voice design zero-shot capabilities.

## Completed Tasks
- [x] Task 1: Extended OmniVoiceTTSEngine with `voice_design()`, `preview_voice()`, `get_profile_details()`, `delete_profile()`, and `get_audio_duration()`. Added `type` and `created_at` metadata to `create_voice_profile()`.
- [x] Task 2: Extended FastAPI routes with `/clone`, `/design`, `/preview`, `/{name}` (GET/DELETE), and `/health` endpoints. Improved `list_profiles` to return full metadata and support designed voices. Includes duration validation and filename sanitization.

## Deviations from Plan
None - plan executed exactly as written.

## Known Stubs
None. The code delegates audio processing to real modules (`omnivoice`, `librosa`, `soundfile`).

## Threat Flags
None. Endpoint sanitization and file duration/type validation are implemented as planned.

## Self-Check: PASSED