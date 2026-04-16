# Phase 7: Video Downloader - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 07-video-downloader
**Areas discussed:** Giao diện Downloader, Chiến lược Download Douyin, Tổ chức File & Folder, Batch Download & Queue

---

## Giao diện Downloader

### Bố cục module

| Option | Description | Selected |
|--------|-------------|----------|
| 2-panel: Input + Queue | URL input bên trái, queue + progress bên phải | |
| 3-panel: Input + Queue + History | Giống option 1 + panel History riêng | ✓ |
| Single-panel tabs | 1 panel với tabs nội bộ (Add URLs / Queue / History) | |

**User's choice:** 3-panel layout
**Notes:** N/A

### Thumbnail trong queue

| Option | Description | Selected |
|--------|-------------|----------|
| Thumbnail nhỏ bên trái | Mỗi item có thumbnail + title + progress bar | |
| Chỉ text + progress | Không fetch thumbnail, chỉ text | |
| Card lớn có thumbnail | Card to với ảnh bìa lớn, thông tin chi tiết | |

**User's choice:** User cung cấp screenshot reference UI — layout tương tự Multi-Platform Downloader: URL input + Analyze Link → Thumbnail lớn bên trái + Download Options bên phải (tabs Video/Audio, format list) → Recent Extractions history table ở dưới.
**Notes:** Reference screenshot được cung cấp trực tiếp.

---

## Chiến lược Download Douyin

### Download engine

| Option | Description | Selected |
|--------|-------------|----------|
| Dùng thư viện f2 | Chuyên biệt Douyin/TikTok, handle a_bogus + cookie | |
| Dùng yt-dlp cho tất cả | 1 engine duy nhất cho mọi nền tảng | |
| Hybrid: f2 + yt-dlp | f2 cho Douyin, yt-dlp cho phần còn lại | ✓ |

**User's choice:** Hybrid
**Notes:** Tối ưu cho từng nền tảng

### Cookie Douyin

| Option | Description | Selected |
|--------|-------------|----------|
| Paste cookie thủ công | User copy từ DevTools | |
| Import file cookie | User export cookies.txt | |
| Tự động extract từ trình duyệt | App đọc cookie từ Chrome/Edge | |
| Login via WebView (user đề xuất) | Nút Login → mở WebView → login → tự lưu cookie | ✓ |

**User's choice:** Login via WebView (ý tưởng do user đề xuất)
**Notes:** Dùng Tauri WebView để hiển thị trang Douyin login, intercept cookie sau khi login thành công. Giống cách nhiều tool download chuyên nghiệp xử lý.

---

## Tổ chức File & Folder

| Option | Description | Selected |
|--------|-------------|----------|
| Theo nền tảng / username | Downloads/Douyin/username/video.mp4 | |
| Theo ngày | Downloads/2026-04/video.mp4 | |
| Flat folder + metadata DB | Tất cả vào 1 thư mục, SQLite lưu metadata | ✓ |
| User tự chọn pattern | Template: {platform}/{uploader}/{title}.{ext} | |

**User's choice:** Flat folder + SQLite metadata DB
**Notes:** Tìm kiếm/lọc qua giao diện app thay vì duyệt folder

---

## Batch Download & Queue

### Concurrent downloads

| Option | Description | Selected |
|--------|-------------|----------|
| 1 download | Đơn giản, ít rủi ro ban IP | |
| 2-3 concurrent | Cân bằng tốc độ và rủi ro, mặc định 2 | ✓ |
| Không giới hạn | Dynamic, chạy tất cả cùng lúc | |

**User's choice:** 2-3 concurrent (mặc định 2, chỉnh trong Settings)
**Notes:** N/A

### Retry policy

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-retry 3 lần | Exponential backoff (5s, 15s, 45s) | |
| Fail ngay + thông báo | Không retry, user tự bấm Retry | |
| Tuỳ quyền agent | Agent tự quyết cách retry | ✓ |

**User's choice:** Tuỳ quyền agent
**Notes:** N/A

---

## Agent's Discretion

- Retry policy (exponential backoff, max retries, error types)
- SQLite schema design details
- Progress display format (percentage, speed, ETA)
- Download file naming convention

## Deferred Ideas

None — discussion stayed within phase scope
