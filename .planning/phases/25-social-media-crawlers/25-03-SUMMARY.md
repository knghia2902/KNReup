---
plan: 25-03
title: Facebook & Hybrid Fallback Crawlers
status: complete
---

# Summary: Facebook Crawler & Hybrid Fallback

## What was built
1. `FacebookEngine(BaseDownloader)` in `fb_engine.py` — scrapes Facebook video pages for direct mp4 stream URLs
2. Hybrid fallback system in `manager.py` — if any native engine fails, automatically falls back to yt-dlp

## Key files
- **Created:** `python-sidecar/app/engines/downloader/fb_engine.py`
- **Modified:** `python-sidecar/app/engines/downloader/manager.py`

## Implementation details
### Facebook Engine
- Short URL expansion for `fb.watch` links
- Video ID extraction from multiple URL patterns (videos, watch, reel, story)
- Multiple scraping patterns for video URLs:
  - `hd_src` / `sd_src` (classic)
  - `hd_src_no_ratelimit` / `sd_src_no_ratelimit`
  - `playable_url` / `playable_url_quality_hd` (GraphQL)
  - `browser_native_hd_url` / `browser_native_sd_url`
- HD/SD format selection with streaming download

### Hybrid Fallback
- `analyze()`: If native engine fails → retry with yt-dlp → report combined error
- `_download_worker()`: If native download fails → retry with yt-dlp
- Works for TikTok, Bilibili, and Facebook engines
- Douyin and YouTube unaffected (already native / already yt-dlp)

## Self-Check: PASSED
- All platform detection tests pass (8/8)
- All engines route correctly
- Fallback chain integrated in both analyze and download paths
