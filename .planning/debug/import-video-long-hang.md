---
slug: import-video-long-hang
status: completed
trigger: "App hangs and WaveSurfer throws NotReadableError when importing a 3-hour video, CPU spikes significantly."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: Import Video Long Hang

## Symptoms
- App freezes for a while when importing a 3-hour video.
- CPU usage increases significantly.
- Console error: `AudioTrack.tsx:109 WaveSurfer load error: NotReadableError: The requested file could not be read...`
- Regression: This started happening after recent code changes (previously worked fine).

## Current Focus
- **Hypothesis:** 
    1. The recent `minZoom` changes in `Timeline.tsx` allowed zooming out much further, making many chunks visible.
    2. Each visible chunk in `AudioTrack.tsx` triggers a full-file decode in WaveSurfer.
- **Next Action:** Resolved.

## Evidence
- 2026-04-22: Identified that `AudioTrack` creates a chunk every 300s, and each chunk loads the *full* file via WaveSurfer. For a 3-hour video, this is 36 simultaneous full-file decodes when zoomed out.

## Specialist Review
- **Skill:** typescript-expert (for React)
- **Result:** LOOKS_GOOD. The dynamic CHUNK_LEN correctly addresses the multiplication of loads at low zoom levels.

## Resolution
- **root_cause:** `AudioTrack.tsx` used fixed 5-minute chunks. At low zoom levels, all chunks (e.g., 36 for 3 hours) became visible and triggered simultaneous full-file decodes, saturating CPU and resource handles.
- **fix:** Implemented discrete zoom-dependent `CHUNK_LEN` in `AudioTrack.tsx`. 
    - `pixelsPerSecond < 0.1` -> 3 hour chunks.
    - `0.1 <= pixelsPerSecond < 1` -> 30 min chunks.
    - `pixelsPerSecond >= 1` -> 5 min chunks.
    This ensures only 1-2 decodes happen when zoomed out, while maintaining virtualization at high zoom. Also added a guard to skip rendering if `pixelsPerSecond < 0.02`.
