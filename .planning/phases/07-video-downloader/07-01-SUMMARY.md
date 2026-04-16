---
plan: "07-01"
title: "Backend Download Engine + SQLite + API"
status: completed
completed_at: "2026-04-17"
tasks_completed: 5
tasks_total: 5
---

## Summary

Xây dựng toàn bộ backend download engine cho Video Downloader module:

### What was built

1. **SQLite Database Layer** (`database.py`) — Async via aiosqlite, WAL mode, CRUD operations, dedup check
2. **Abstract Base Class** (`base.py`) — `BaseDownloader` interface: analyze + download with progress callback
3. **yt-dlp Engine** (`ytdlp_engine.py`) — Multi-platform support (YouTube, TikTok, Facebook, Instagram, Twitter, Bilibili), async via `asyncio.to_thread()`, progress hooks
4. **f2 Douyin Engine** (`douyin_engine.py`) — No-watermark Douyin download, cookie sync from browser, graceful f2 import handling
5. **Download Manager** (`manager.py`) — Singleton pattern, concurrent queue via `asyncio.Semaphore(2)`, SSE progress callbacks, platform routing
6. **FastAPI Routes** (`routes/downloader.py`) — 9 endpoints: analyze, start, status, SSE stream, history, delete, cancel, cookie sync, cookie status

### Key Files

- `python-sidecar/app/engines/downloader/database.py`
- `python-sidecar/app/engines/downloader/base.py`
- `python-sidecar/app/engines/downloader/ytdlp_engine.py`
- `python-sidecar/app/engines/downloader/douyin_engine.py`
- `python-sidecar/app/engines/downloader/manager.py`
- `python-sidecar/app/engines/downloader/__init__.py`
- `python-sidecar/app/routes/downloader.py`

### Integration

- `python-sidecar/app/main.py` — Added downloader_router + startup DB init
- `python-sidecar/requirements.txt` — Added yt-dlp, f2, aiosqlite
