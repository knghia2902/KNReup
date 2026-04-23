---
phase: 22
plan: 1
status: complete
started: 2026-04-24
completed: 2026-04-24
---

# SUMMARY: Plan 22-01 — Web Audio API Full Mix Preview

## Objective
Tích hợp Web Audio API để cho phép user nghe real-time mix của 3 nguồn audio (Original Video, TTS Segments, BGM) trực tiếp trong Editor preview mà không cần render.

## What Was Built

### AudioMixer Singleton (`src/lib/audioMixer.ts`) — NEW
- AudioContext singleton quản lý routing graph hoàn chỉnh
- 3 GainNode riêng biệt: `originalGain`, `ttsGain`, `bgmGain`
- `connectVideo()` / `connectBGM()` — wrap `createMediaElementSource()` với duplicate-connect protection
- `scheduleTTS()` — schedule AudioBufferSourceNode per segment theo timestamp
- `cancelTTS()` — stop tất cả active TTS sources (cho seek/pause)
- `preloadTTSBuffers()` — preload tất cả TTS files vào buffer cache
- `visibilitychange` listener — suspend/resume AudioContext khi tab ẩn/hiện
- Buffer cache (`Map<string, AudioBuffer>`) tránh decode lại

### VideoPreview Integration (`src/components/editor/VideoPreview.tsx`)
- Connect `<video>` element qua `AudioMixer.connectVideo()` khi video loaded
- Sync `original_volume` + `audio_mix_mode` tới GainNode real-time
- Play → `scheduleTTS()`, Pause → `cancelTTS()`
- Seek khi playing → cancel + re-schedule TTS
- Preload TTS buffers khi segments thay đổi

### BGM Integration (`src/components/editor/AudioLibrary.tsx`)
- Thêm `crossOrigin="anonymous"` cho `<audio>` element (CORS support)
- Connect BGM qua `AudioMixer.connectBGM()` khi canplay
- Xoá direct `.volume` assignment — volume giờ qua GainNode

### AudioTab Volume Sync (`src/components/properties/AudioTab.tsx`)
- Xoá `audioRef` không cần thiết
- useEffect sync 3 volumes + mix_mode tới AudioMixer GainNodes
- Sliders vẫn update store, effect auto-sync tới Web Audio API

### Timeline Mini Volume Indicators (`src/components/editor/Timeline.tsx`)
- Track headers hiện speaker icon + progress bar cho VID/TTS/BGM
- VID: muted indicator khi `audio_mix_mode === 'replace'`
- TTS: muted indicator khi `dubbing_enabled === false`
- BGM: muted indicator khi `audio_enabled === false`
- Progress bar width map trực tiếp từ volume value

### Scrub Sync (`src/components/editor/Timeline.tsx`)
- Kéo playhead (scrub) → `AudioMixer.cancelTTS()` — im lặng
- Stop drag + video đang play → re-schedule TTS từ vị trí mới

## Key Files

### Created
- `src/lib/audioMixer.ts`

### Modified
- `src/components/editor/VideoPreview.tsx`
- `src/components/editor/AudioLibrary.tsx`
- `src/components/properties/AudioTab.tsx`
- `src/components/editor/Timeline.tsx`

## Self-Check: PASSED
- TypeScript compile: ✅ Không có lỗi mới (pre-existing unused var warnings tồn tại)
- AudioMixer exports đầy đủ: init, resume, connectVideo, connectBGM, set*Volume, scheduleTTS, cancelTTS, preloadTTSBuffers, dispose
- Không có import React trong audioMixer.ts (pure audio logic)
- GainNode.gain.value clamped [0, 2]

## Deviations
- Dùng inline SVG cho speaker icons thay vì `@phosphor-icons/react` — tránh thêm import nặng cho Timeline headers
- Dùng `(globalThis as any).WeakRef` thay vì trực tiếp `WeakRef` — TypeScript lib target chưa include ES2021
