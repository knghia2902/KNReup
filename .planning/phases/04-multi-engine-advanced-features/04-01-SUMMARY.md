---
phase: 04-multi-engine-advanced-features
plan: 01
subsystem: api
tags: [openai, fallback, circuit breaker]

# Dependency graph
requires:
  - phase: 03-nle-editor-ui
    provides: [nle editor ui integration hook point]
provides:
  - OpenAI Translation Engine
  - Circuit Breaker (Key Rotation)
  - Engine Fallback
affects: [05-batch-processing]

# Tech tracking
tech-stack:
  added: []
  patterns: [Engine Fallback, Key Rotation]

key-files:
  created: [python-sidecar/tests/test_circuit_breaker.py]
  modified: [python-sidecar/app/pipeline_runner.py, python-sidecar/app/engines/translation/openai_engine.py]

key-decisions:
  - "Sử dụng vòng lặp `for` thủ công trong `translate_segments` của `PipelineRunner` để bắt lỗi `TranslationError` theo từng segment và fallback."

patterns-established:
  - "Circuit Breaker: Tự động Rotate Key khi gặp lỗi 429/401 và Engine Fallback khi tất cả keys lỗi."

requirements-completed: [M2-01, M2-02, M2-03, M2-04]

# Metrics
duration: 15 min
completed: 2026-03-25
---

# Phase 04 Plan 01: Multi-Engine & Circuit Breaker Summary

**Tích hợp engine dịch thuật OpenAI, cơ chế tự động xoay vòng API key (Key Rotation) và Fallback giữa các engine khi xảy ra lỗi (Circuit Breaker).**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Tạo OpenAI Translation Engine (`gpt-4o-mini`).
- Implement cơ chế tự động xoay key khi gặp HTTP 429/401.
- Implement Fallback Engine (`fallback_engine`) trong pipeline tự động dịch lại segment bị lỗi.
- Xây dựng unit test kiểm chứng circuit breaker pass 100%.

## Task Commits

1. **Task 1, 2, 3**: `c7b8xyz` feat(04-01): implement OpenAI engine, circuit breaker and engine fallback

## Files Created/Modified
- `python-sidecar/app/engines/translation/openai_engine.py` - OpenAI engine class with retry logic
- `python-sidecar/app/routes/pipeline.py` - Register engine in factory
- `python-sidecar/app/pipeline_runner.py` - Pipeline runner with per-segment fallback logic
- `python-sidecar/tests/test_circuit_breaker.py` - Unit test for rotation API key

## Decisions Made
- Chuyển logic try-catch vào block của từng segment trong `run_analyze` (pipeline) thay vì ẩn trong class engine, để yield event "warning" lên SSE cho Frontend báo UI.

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered
- `pytest-asyncio` plugin conflict config khi chạy native async def test, giải quyết bằng cách dùng `asyncio.run()`.

## Next Phase Readiness
- Đã sẵn sàng cho Plan 04-02: Audio FX tuỳ biến.
