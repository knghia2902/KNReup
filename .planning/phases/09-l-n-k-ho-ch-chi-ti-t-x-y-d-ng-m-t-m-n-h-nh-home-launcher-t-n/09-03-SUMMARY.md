---
plan: "09-03"
phase: "09"
status: complete
started: 2026-04-22
completed: 2026-04-22
---

# Summary: Tool Popups & Feature Guards

## What was built
Separated tools into standalone popup windows and updated the Titlebar for multi-window navigation.

## Key Files Created/Modified
- `src/components/downloader/DownloaderWindow.tsx` — Standalone downloader entry point with URL input and download list
- `src/components/layout/Titlebar.tsx` — Added Home button (House icon), converted Downloader tab to popup trigger with ArrowSquareOut icon, bumped version to v1.0.1
- `src/main.tsx` — Updated routing to load DownloaderWindow for downloader tool windows
- `src/styles/design-system.css` — Added tb-home-btn and tb-tab-popup styles

## Self-Check: PASSED
- ✅ Downloader opens as standalone popup window
- ✅ Voice Clone opens as standalone popup window
- ✅ Home button in Editor titlebar focuses launcher
- ✅ RequireAuth component ready for premium feature wrapping
