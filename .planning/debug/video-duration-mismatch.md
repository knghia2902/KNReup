---
status: investigating
trigger: "The time display is still incorrect. It shows \"02:05\" but expected \"03:34:23\"."
goal: find_and_fix
---

# Debug Session: Video Duration Mismatch

## Symptoms
- Video duration shows "02:05" instead of "03:34:23" for long videos (3+ hours).
- Affects VideoControls and potentially Timeline header.

## Evidence
- timestamp: 2026-04-22 09:00:00
  - Symptom: Incorrect time display "02:05" for a video known to be 03:34:23.

## Current Focus
- **Hypothesis:** `formatTime` in `src/utils/time.ts` might be incorrectly handling hours or total seconds, or the duration value itself is truncated.
- **Next Action:** Investigate `src/utils/time.ts` and `VideoControls.tsx`.

## Resolution
- **root_cause:** null
- **fix:** null
