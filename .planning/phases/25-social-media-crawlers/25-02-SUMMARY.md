---
plan: 25-02
title: Bilibili & Facebook Crawlers
status: complete
---

# Summary: Bilibili Crawler

## What was built
Implemented `BilibiliEngine(BaseDownloader)` in `bilibili_engine.py` — handles Bilibili's DASH streaming architecture with separate video+audio download and ffmpeg merge.

## Key files
- **Created:** `python-sidecar/app/engines/downloader/bilibili_engine.py`
- **Modified:** `python-sidecar/app/engines/downloader/manager.py`

## Implementation details
- BVid/aid extraction from Bilibili URLs
- Short URL expansion for `b23.tv` links
- Bilibili Web API (`api.bilibili.com/x/web-interface/view`) for metadata
- DASH stream extraction via `api.bilibili.com/x/player/playurl`
- Separate video + audio download with ffmpeg merge
- FLV fallback for non-DASH streams
- Quality mapping (360p → 8K)
- Routing for `bilibili.com` and `b23.tv` domains

## Self-Check: PASSED
- Engine instantiates correctly
- Platform detection routes Bilibili URLs to `BilibiliEngine`
