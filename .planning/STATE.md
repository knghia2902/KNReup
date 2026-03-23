# STATE.md — KNReup Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Tự động hoá pipeline lồng tiếng video end-to-end
**Current focus:** Phase 1 — Foundation (Tauri Shell + Sidecar Bridge)

## Current Status

- **Milestone:** 1 (Desktop App Hoàn Chỉnh)
- **Phase:** 1 (Foundation)
- **Status:** Not started — awaiting plan approval

## Context

### File tham khảo
- `Clone/VideoTransAI/` — Bản build VideoTransAI (tham khảo frontend + API)
- `Clone/Reupv3/tonghop.md` — Thiết kế AlexTransVideo 3.0

### Decisions Log
| Date | Decision | Context |
|------|----------|---------|
| 2026-03-23 | Code lại từ đầu, không decompile | Backend VideoTransAI là Cython compiled |
| 2026-03-23 | Tauri 2.0 + React + FastAPI | Modern stack, nhẹ, source đọc được |
| 2026-03-23 | Test cả ASS vs Canvas hardsub | Chưa biết cái nào tốt hơn |
| 2026-03-23 | Thêm Piper TTS offline | VideoTransAI đã có, cần offline option |
| 2026-03-23 | taste-skill cho UI design | Đảm bảo design premium |
| 2026-03-23 | First-run giống VideoTransAI | GPU detect → install deps |

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation (Tauri + Sidecar) | ⏳ Not started |
| 2 | Core Pipeline MVP | — |
| 3 | NLE Editor UI | — |
| 4 | Multi-Engine + Advanced | — |
| 5 | Output Advanced | — |
| 6 | Timeline + Premium UI | — |
| 7 | Video Downloader | — |
| 8 | Auto-Monitor + AI | — |
| 9 | Polish + License | — |

---
*Last updated: 2026-03-23 after project initialization*
