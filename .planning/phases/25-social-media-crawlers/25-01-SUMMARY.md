---
plan: 25-01
title: TikTok No-Watermark Crawler
status: complete
---

# Summary: TikTok No-Watermark Crawler

## What was built
Implemented `TikTokEngine(BaseDownloader)` in `tiktok_engine.py` — a native TikTok downloader using reverse-engineered Mobile API endpoints for no-watermark video access.

## Key files
- **Created:** `python-sidecar/app/engines/downloader/tiktok_engine.py`
- **Modified:** `python-sidecar/app/engines/downloader/manager.py`

## Implementation details
- Short URL expansion (`vt.tiktok.com`, `vm.tiktok.com`) via HEAD redirect
- Video ID extraction from canonical TikTok URLs
- Multiple API endpoint fallback (3 CDN regions)
- `play_addr` extraction for no-watermark streams
- Async streaming download with progress tracking
- Integrated into `DownloadManager._detect_platform()` and `_get_engine()`

## Self-Check: PASSED
- Engine instantiates correctly
- Platform detection routes `tiktok.com` URLs to `TikTokEngine`
- Import chain verified
