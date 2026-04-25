# Phase 25: Social Media Download Crawlers (TikTok, FB, Bilibili, Hybrid)

## Objective
Implement direct API-based scraping for TikTok, Bilibili, and Facebook to bypass watermarks and improve reliability, inspired by the `Douyin_TikTok_Download_API`.

## Current System
Currently, we have two downloader engines:
1. `douyin_engine.py` - Custom scraper for Douyin (works great for no-watermark).
2. `ytdlp_engine.py` - Fallback relying on yt-dlp. While powerful, yt-dlp for TikTok often retrieves the watermarked video if it cannot find the API endpoint, and can be slow/rate-limited.

## Required Knowledge
From Evil0ctal's repository (`https://github.com/Evil0ctal/Douyin_TikTok_Download_API/tree/main/crawlers`), the key pattern is:
1. **Extract Video ID**: Parse the URL (which may be a shortURL like `vt.tiktok.com/xxx`) via a HEAD request to get the canonical URL (`www.tiktok.com/@user/video/id`).
2. **Hit API Endpoint**: Construct API requests (e.g. `aweme/v1/web/aweme/detail/` for TikTok). For Bilibili and Facebook, use their respective GraphQL or mobile API endpoints.
3. **Parse CDN Links**: Extract the dynamic CDN URLs for video (no-watermark) and audio.
4. **Download**: Just standard asynchronous HTTP downloading using `httpx` or `aiohttp` (we currently use `httpx` inside `douyin_engine.py`).

## Implementation Strategy
We must build a generic `hybrid_engine.py` or specific crawlers (e.g. `tiktok_engine.py`, `bilibili_engine.py`) extending `BaseEngine`.
- **TikTok**: Scrape similarly to Douyin but pointing to TikTok's Web API or `api22-normal-c-useast1a.tiktokv.com`.
- **Facebook**: Parse GraphQL variables in page source or use standard mobile API.
- **Bilibili**: Parse `window.__playinfo__` for the dash/CDN links, which requires a custom extractor.

## Validation Architecture
- Verify video extraction for a TikTok video yields a clean (no-watermark) version.
- Verify Bilibili and FB URLs successfully extract maximum resolution.
- Route URLs correctly in `manager.py`.
