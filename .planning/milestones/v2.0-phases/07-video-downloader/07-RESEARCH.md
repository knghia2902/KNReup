# Phase 7: Video Downloader — Research

## 1. Download Engines

### 1.1 f2 Library (Douyin)
- **Package:** `pip install f2` — Python >= 3.10
- **Architecture:** Async-based (`asyncio`), hỗ trợ Douyin, TikTok, Weibo, Twitter
- **Cookie Management:**
  - Auto-cookie từ browser: `f2 dy --auto-cookie edge` (hỗ trợ Edge, Chrome, Firefox)
  - Programmatic: Truyền cookie string qua `kwargs["cookie"]`
- **API Programmatic:**
  ```python
  from f2.apps.douyin.crawler import AwemeIdFetcher
  from f2.apps.douyin.dl import DouyinDownloader

  aweme_id = await AwemeIdFetcher.get_aweme_id(video_url)
  downloader = DouyinDownloader(kwargs)
  await downloader.create_download_tasks(kwargs, aweme_data, path)
  ```
- **No-watermark:** f2 tự động extract link video không watermark từ Douyin API
- **Rủi ro:** Douyin thường xuyên update API → cần pin version f2 và monitor breaking changes
- **Giới hạn:** Cần cookie hợp lệ để truy cập API, cookie hết hạn cần re-login

### 1.2 yt-dlp (YouTube, TikTok, Facebook, đa nền tảng)
- **Package:** `pip install yt-dlp`
- **Metadata extraction (không download):**
  ```python
  import yt_dlp
  ydl_opts = {'skip_download': True}
  with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)
      # info['title'], info['formats'], info['thumbnails'], etc.
  ```
- **Download với format selector:**
  ```python
  ydl_opts = {
      'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
      'outtmpl': '%(title)s.%(ext)s',
      'progress_hooks': [progress_callback],
  }
  with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      ydl.download([url])
  ```
- **Format info:** `info['formats']` trả về list format với `format_id`, `ext`, `resolution`, `filesize`, `vcodec`, `acodec`
- **Progress hooks:** Callback function nhận dict `{'status': 'downloading', 'downloaded_bytes': N, 'total_bytes': M, 'speed': S}`
- **Platforms supported:** YouTube, TikTok, Facebook, Instagram, Twitter, Bilibili, 1800+ sites
- **Cookie support:** `--cookies-from-browser chrome` hoặc cookies.txt file

## 2. Tauri WebView Login Flow

### 2.1 Vấn đề
- Tauri 2.0 **KHÔNG** có API chính thức để extract cookie từ system WebView (WebView2 on Windows)
- WebView2 quản lý cookie nội bộ, không expose ra ngoài
- Cookie HttpOnly/Secure được bảo vệ không cho JS đọc

### 2.2 Giải pháp kiến nghị: Python-side Login
**Thay vì dùng Tauri WebView, dùng Python sidecar để handle login:**

**Option A — Playwright/Selenium headless (RECOMMENDED):**
- Mở browser embedded (Chromium) qua Playwright
- User login trực tiếp trên browser thật
- Sau khi login, extract cookie từ browser context (Playwright API native support)
- Lưu cookie vào file/SQLite
- **Pro:** Full control, cross-platform, browser APIs
- **Con:** Cần bundle Chromium (~150MB) hoặc dùng system browser

**Option B — Manual cookie paste:**
- User copy cookie từ DevTools → paste vào Settings
- Đơn giản nhất, không cần dependency thêm
- **Pro:** Zero overhead
- **Con:** Phiền user, expiry không tự handle

**Option C — f2 auto-cookie:**
- f2 có built-in `--auto-cookie` đọc cookie từ browser đã login
- `f2 dy --auto-cookie edge` / `chrome` / `firefox`
- **Pro:** Sẵn có trong f2, không cần code thêm
- **Con:** User phải login Douyin trên browser trước, rồi chạy auto-cookie

### 2.3 Recommendation
**Dùng Option C (f2 auto-cookie) cho v1**, vì:
- Không cần bundle thêm browser (tiết kiệm 150MB+)
- f2 đã handle encrypt/decrypt cookie database các browser phổ biến
- Flow: User login Douyin trên browser → trong app bấm "Đồng bộ Cookie" → gọi f2 auto-cookie API → lưu cookie
- Nếu user muốn tiện hơn, Phase sau có thể nâng cấp lên Playwright

## 3. SQLite Integration

### 3.1 Library
- `aiosqlite` — async SQLite cho FastAPI (`pip install aiosqlite`)
- Hoặc `sqlite3` built-in Python (sync, dùng `asyncio.to_thread`)

### 3.2 Schema Design (Draft)
```sql
CREATE TABLE downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,  -- 'douyin', 'youtube', 'tiktok', 'facebook'
    video_id TEXT,
    title TEXT,
    uploader TEXT,
    duration INTEGER,
    thumbnail_url TEXT,
    file_path TEXT,
    file_size INTEGER,
    resolution TEXT,
    format TEXT,
    status TEXT DEFAULT 'pending',  -- pending, analyzing, downloading, completed, error
    progress REAL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata TEXT  -- JSON blob for extra platform-specific data
);

CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_platform ON downloads(platform);
CREATE INDEX idx_downloads_url ON downloads(url);
```

### 3.3 Dedup Protection
- `url` column là UNIQUE → INSERT OR IGNORE khi thêm URL đã tồn tại
- Trước khi add vào queue, check `SELECT id FROM downloads WHERE url = ?`

## 4. Codebase Integration Points

### 4.1 Frontend (React/TypeScript)
- `src/components/layout/Titlebar.tsx` — Tab "Downloader" đã có (line 46-49), click → `onModuleChange('downloader')`
- `src/components/layout/NLELayout.tsx` — Slot `downloaderContent` prop (line 12, 25, 135-138), hiện hiển thị placeholder "URL Queue goes here"
- **Cần tạo:** `src/components/downloader/` module mới
  - `DownloaderPanel.tsx` — Main layout 3-panel
  - `URLInput.tsx` — URL input + Analyze button
  - `DownloadOptions.tsx` — Format selector (Video/Audio tabs)
  - `DownloadQueue.tsx` — Queue list với progress
  - `DownloadHistory.tsx` — History table
  - `useDownloader.ts` — Custom hook quản lý state

### 4.2 Backend (Python FastAPI Sidecar)
- Pattern hiện tại: `app/routes/*.py` chứa FastAPI routers
- Hiện có: `health.py`, `pipeline.py`, `subtitles.py`, `system.py`
- **Cần tạo:** `app/routes/downloader.py` — Router cho download endpoints
- **Cần tạo:** `app/engines/downloader/` — Download engine module
  - `base.py` — Base downloader class
  - `douyin_engine.py` — f2 wrapper
  - `ytdlp_engine.py` — yt-dlp wrapper
  - `manager.py` — Download queue manager + SQLite integration

### 4.3 Dependencies cần thêm
```
f2>=0.9.0
yt-dlp>=2024.0
aiosqlite>=0.19.0
```

## 5. Concurrent Download Architecture

### 5.1 Design
- `asyncio.Semaphore(max_concurrent)` — Giới hạn concurrent downloads (mặc định 2)
- Mỗi download task chạy trong asyncio task pool
- Progress update qua SSE (Server-Sent Events) — pattern đã có trong pipeline.py

### 5.2 Flow
```
User paste URL → POST /api/download/analyze
  → yt-dlp/f2 extract_info (metadata only)
  → Return: title, thumbnail, formats[]

User chọn format → POST /api/download/start
  → Add to SQLite (status: pending)
  → Đưa vào queue
  → Semaphore-controlled download
  → SSE progress updates → Frontend cập nhật progress bar

GET /api/download/history → SQLite query → History list
DELETE /api/download/{id} → Remove from SQLite + optional file delete
```

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| f2 bị break khi Douyin update API | Download Douyin fail | Pin version, monitor releases, fallback sang yt-dlp Douyin extractor |
| Cookie Douyin hết hạn | User cần re-login | Thông báo rõ ràng, nút "Đồng bộ lại Cookie" |
| yt-dlp rate-limit | Download chậm/fail | Concurrent limit + exponential backoff |
| SQLite lock khi concurrent write | Database error | Dùng WAL mode + aiosqlite connection pool |
| Video quá lớn (>2GB) | Tràn RAM/disk | Stream download, chunk-based writing |

---

## RESEARCH COMPLETE

Research đủ thông tin để planning. Các technical decision chính:
1. **Hybrid engine:** f2 (Douyin) + yt-dlp (rest)
2. **Cookie:** f2 auto-cookie từ browser đã login (v1)
3. **Database:** SQLite + aiosqlite
4. **Concurrency:** asyncio.Semaphore
5. **Progress:** SSE (đã pattern trong pipeline.py)
6. **Frontend:** New `downloader/` module, plug vào NLELayout slot
