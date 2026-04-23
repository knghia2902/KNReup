---
phase: 10
plan: 3
title: "TTS Pipeline Integration — Giọng clone trong Editor dropdown"
key-files:
  modified:
    - src/components/properties/TextTab.tsx
---

# 10-03-SUMMARY

## What Was Built
Integrated cloned voice profiles into the Editor's per-segment TTS voice dropdown (`TextTab.tsx`). Changes include:
- Added `clonedVoices` state and a fetcher that loads profiles from `/api/tts/profiles/` on mount and on window focus.
- Rendered a new `<optgroup label="OmniVoice - Cloned (Local)">` with 🎤 prefixed entries above the legacy custom profiles group.
- Auto-refresh on window focus ensures voices created in Voice Studio appear immediately when the user returns to the Editor.

## Self-Check: PASSED
- `clonedVoices` state and fetch logic present.
- Dropdown renders cloned profiles with 🎤 prefix.
- Focus event listener for auto-refresh confirmed.
