# Phase 22: Full Mix Preview - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 22-full-mix-preview
**Areas discussed:** Audio Engine, TTS Segment Sync, Volume Control UX, Seek & Scrub Sync

---

## Audio Engine

| Option | Description | Selected |
|--------|-------------|----------|
| Web Audio API | `AudioContext` + `GainNode` + `MediaElementSource`. Mixing chính xác, per-source gain, future-proof | ✓ |
| HTMLMediaElement.volume | Set `.volume` trên mỗi element. Đơn giản nhưng không mix được thật sự | |

**User's choice:** Web Audio API (A)
**Notes:** User confirmed after seeing CapCut also uses Web Audio API architecture.

---

## TTS Segment Sync

| Option | Description | Selected |
|--------|-------------|----------|
| On-the-fly scheduling | Preload segments into `AudioBuffer`, schedule `.start(time)` theo timestamp | ✓ |
| Pre-merge thành 1 file | FFmpeg merge all segments → 1 audio file → play parallel with video | |

**User's choice:** On-the-fly scheduling (A)
**Notes:** User asked how CapCut implements this — research confirmed CapCut keeps segments independent on timeline, same as option A. User validated approach against CapCut reference.

---

## Volume Control UX

| Option | Description | Selected |
|--------|-------------|----------|
| AudioTab only | Thêm 3 sliders vào AudioTab hiện tại. Simple | |
| Mini Mixer on Timeline | Volume fader nhỏ bên cạnh mỗi track header. Giống CapCut nhất | |
| Both (A + B) | AudioTab chi tiết + mini indicator trên timeline. Hoàn chỉnh nhất | ✓ |

**User's choice:** Both — AudioTab + Mini Mixer on Timeline (C)
**Notes:** None

---

## Seek & Scrub Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Full sync on seek | Seek → recalculate + play ngay. Chính xác nhưng có thể lag | |
| Sync on play only | Seek → im lặng, Play mới sync | |
| Hybrid | Scrub nhanh → im lặng, click seek + Play → full audio sync | ✓ |

**User's choice:** Hybrid (C) — giống CapCut
**Notes:** User explicitly said "Chọn giống CapCut"

---

## Agent's Discretion

- AudioContext lifecycle management
- Buffer memory management
- Latency optimization target

## Deferred Ideas

None
