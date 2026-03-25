---
phase: 04-multi-engine-advanced-features
plan: 02
subsystem: ui, api
tags: [audio-fx, ffmpeg, preview, export-queue, zustand]

# Dependency graph
requires:
  - phase: 04-multi-engine-advanced-features
    provides: [translation pipeline]
provides:
  - Audio FX Pipeline parameters
  - Audio FX Preview Endpoint
  - Render Queue UI & State Manager
affects: [05-batch-processing]

# Tech tracking
tech-stack:
  added: [zustand queueStore]
  patterns: [FFmpeg audio filter amix/atempo/asetrate, Background Batch Queue loop in App.tsx]

key-files:
  created: [src/stores/queueStore.ts, src/components/properties/QueueTab.tsx]
  modified: [python-sidecar/app/pipeline_runner.py, python-sidecar/app/routes/pipeline.py, src/App.tsx, src/components/properties/TTSTab.tsx, src/components/properties/PropertiesPanel.tsx, src/stores/useProjectStore.ts]

key-decisions:
  - "Sử dụng Background setInterval/useEffect Event Loop trong App.tsx để pop queue rendering, đảm bảo pipeline tuần tự."
  - "Thay vì tạo overlay JobMonitor chặn UI, queue chuyển process xuống Sidebar Tab QUEUE để người dùng thiết lập batch process mượt mà."

patterns-established:
  - "Zustand Store để theo dõi UI Queue song song với PipelineProgress hooks."

requirements-completed: [M2-05]

# Metrics
duration: 15 min
completed: 2026-03-25
---

# Phase 04 Plan 02: Audio FX Pipeline & Export Queue Summary

**Hoàn thiện tích hợp Audio FX Preview và hệ thống Export Queue xử lý hàng loạt.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 4
- **Files modified:** 9

## Accomplishments
- Cập nhật FFmpeg filter chain trong `PipelineRunner` để thêm `atempo` (Speed) và `asetrate` (Pitch).
- Cung cấp API Preview `/api/pipeline/preview-audio` phục vụ frontend.
- Xây dựng `QueueTab` bên trong `PropertiesPanel` để quản lý hàng đợi Batch Render.
- Tích hợp vòng lặp trong `App.tsx` tự động pop các Job `pending` truyền sang pipeline process khi rảnh rỗi.

## Task Commits

1. **Task 1, 2, 3, 4**: `4b3cd91` feat(04-02): implement Audio FX preview and Export Queue UI

## Files Created/Modified
- `src/stores/queueStore.ts` - zustand state for render jobs
- `src/components/properties/QueueTab.tsx` - rendering queue list
- `src/components/properties/PropertiesPanel.tsx` - UI tabs dispatch
- `src/App.tsx` - Queue Processing background loop
- `python-sidecar/app/routes/pipeline.py` - Audio FX fast preview endpoint

## Decisions Made
- `pitch` được dùng như hệ số multiplier trực tiếp cho `asetrate`, default là `1.0`. UI TTSTab Slider đã được update map lại đồng nhất (từ 0.5 đến 2.0x).

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered
- `tsc` báo React unused. Đã gỡ import unused để build sạch.

## Next Phase Readiness
- Đã hoàn thành 100% Phase 4. Gọi verify_phase_goal để chốt.
