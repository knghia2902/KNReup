# Phase 1: Foundation — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 thiết lập nền tảng kỹ thuật cho KNReup:
- Tauri 2.0 desktop app shell với React/TypeScript/Vite frontend
- Python FastAPI sidecar bridge (giao tiếp HTTP/JSON)
- First-run dependency checker (GPU detect, FFmpeg, CUDA)
- taste-skill integration + base design system (dark theme, glassmorphism)
- NLE 5-panel layout skeleton (chỉ khung, chưa có logic)

**Deliverable**: App mở lên, detect GPU, frontend gọi `/api/health` thành công
</domain>

<decisions>
## Implementation Decisions

### Architecture
- Tauri 2.0 + React/TypeScript/Vite (frontend)
- Python FastAPI sidecar (backend) — chạy local HTTP server
- Auto-port detection (bind port 0, print to stdout)
- Sidecar lifecycle managed by Tauri (spawn on start, kill on close)
- Dev mode: chạy FastAPI trực tiếp (uvicorn), không cần PyInstaller

### UI Framework
- taste-skill từ GitHub cho design premium
- Dark theme mặc định
- NLE 5-Panel layout: Toolbar (top), Left (subtitle list), Center (preview), Right (properties), Bottom (timeline)
- Chỉ tạo khung layout skeleton — nội dung panel sẽ ở Phase 2-3

### First-Run Setup
- Tham khảo VideoTransAI: detect GPU → hiển thị status
- Check: FFmpeg, CUDA/GPU, disk space
- Production: Python bundled trong .exe, chỉ check external deps
- Dev: Check python version, pip packages

### Claude's Discretion
- Cấu trúc thư mục React components
- State management library (Zustand recommended từ tonghop.md)
- CSS methodology (CSS modules vs styled-components vs vanilla)
- Tauri plugin selection ngoài shell
</decisions>

<canonical_refs>
## Canonical References

### Project Context
- `.planning/PROJECT.md` — Project scope và requirements
- `.planning/ROADMAP.md` — Phase definitions
- `.planning/REQUIREMENTS.md` — Full requirements list

### Tham khảo
- `Clone/VideoTransAI/runtime/VideoTransAI/_internal/static/` — Frontend tham khảo (HTML/CSS/JS)
- `Clone/Reupv3/tonghop.md` — Thiết kế tổng hợp AlexTransVideo 3.0
</canonical_refs>

<specifics>
## Specific Ideas

- Tham khảo VideoTransAI card "Trạng thái backend" cho dependency checker UI
- NLE layout giống CapCut/Premiere Pro (5-panel)
- taste-skill settings: DESIGN_VARIANCE=5, MOTION_INTENSITY=4, VISUAL_DENSITY=7
</specifics>

<deferred>
## Deferred Ideas

- PyInstaller build cho sidecar — sẽ cần ở Phase 9 (packaging)
- Video processing pipeline — Phase 2
- Subtitle editor logic — Phase 3
- Multi-track timeline logic — Phase 6
</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-23*
