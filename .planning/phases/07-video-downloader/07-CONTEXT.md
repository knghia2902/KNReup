# Phase 7: Video Downloader - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Module download video đa nền tảng (Douyin, TikTok, YouTube, Facebook) tích hợp trong tab Downloader trên Titlebar. Bao gồm: URL parsing + metadata extraction, download engine, queue management, lưu trữ file, và giao diện quản lý.

</domain>

<decisions>
## Implementation Decisions

### Giao diện Downloader
- **D-01:** Layout **3-panel**: URL input + Analyze ở trên → Thumbnail lớn bên trái + Download Options bên phải (tabs Video/Audio, list format với codec/quality/size/nút Download riêng) → Recent Extractions table (History) ở dưới.
- **D-02:** Reference UI: Multi-Platform Downloader (xem screenshot đính kèm trong DISCUSSION-LOG.md). Giao diện có nút "Analyze Link", sau khi analyze hiện thumbnail + download options theo format. History dạng table: thumbnail nhỏ, title, platform icon, quality, size, status, actions.
- **D-03:** Module Downloader chiếm toàn bộ vùng content khi user chuyển sang tab Downloader trên Titlebar (không dùng chung layout Editor).

### Chiến lược Download Engine
- **D-04:** **Hybrid**: Dùng thư viện `f2` cho Douyin (chuyên biệt, handle a_bogus + cookie tốt). Dùng `yt-dlp` cho YouTube, TikTok, Facebook và các nền tảng còn lại.
- **D-05:** **Login Douyin via WebView**: Thêm nút "Login" trong app → mở Tauri WebView đến trang đăng nhập Douyin → user login bình thường → app tự intercept và lưu cookie từ session. Không yêu cầu user paste cookie thủ công.

### Tổ chức File & Lưu trữ
- **D-06:** **Flat folder + SQLite metadata DB**: Tất cả video download vào 1 thư mục chung. Dùng SQLite lưu metadata (platform, uploader, title, date, resolution, size, status, URL gốc). User tìm kiếm và lọc video qua giao diện app thay vì duyệt folder thủ công.
- **D-07:** SQLite cũng phục vụ dedup protection (kiểm tra URL đã download chưa trước khi thêm vào queue).

### Batch Download & Queue
- **D-08:** **2-3 concurrent downloads**: Mặc định 2 download đồng thời, user có thể chỉnh lên 3 trong Settings. Cân bằng giữa tốc độ và rủi ro bị rate-limit.
- **D-09:** Hỗ trợ paste multi-URL (batch URL import) vào queue cùng lúc.

### Agent's Discretion
- Retry policy khi download lỗi (mất mạng, rate-limit, video bị xóa) — agent tự quyết cách retry phù hợp nhất.
- Chi tiết SQLite schema design.
- Cách hiển thị progress (percentage, speed, ETA).
- Format naming file download.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout & UI
- `.planning/references/layout-spec.md` — Layout spec đã chốt, bao gồm Titlebar tabs (Editor / Downloader / Monitor / Settings)
- `.planning/references/layout-overview.png` — Sơ đồ layout tổng quan

### Tham khảo bên ngoài
- `Clone/VideoTransAI/` — Bản build VideoTransAI tham khảo, có module download
- `Clone/Reupv3/tonghop.md` — Thiết kế AlexTransVideo 3.0

### Prior Phase Context
- `.planning/phases/04-multi-engine-advanced-features/04-CONTEXT.md` — Circuit breaker pattern, pipeline resume/cache
- `.planning/phases/06-multi-track-timeline-premium-ui/06-CONTEXT.md` — Settings Tab trên Titlebar cho quản lý cấu hình

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/Titlebar.tsx` — Đã có tab Downloader trong titlebar, cần implement content cho tab này
- `src/components/layout/NLELayout.tsx` — Layout chính, cần thêm conditional rendering cho module Downloader
- `python-sidecar/app/` — FastAPI sidecar, sẽ thêm download endpoints tại đây

### Established Patterns
- Tauri WebView cho embedded browser (có thể dùng cho Douyin login flow)
- FastAPI sidecar pattern: React gọi API → Python xử lý → SSE/response trả về
- SQLite đã được mention trong roadmap, hiện chưa có trong codebase — sẽ là dependency mới

### Integration Points
- Titlebar tab switching: `Titlebar.tsx` + `NLELayout.tsx`
- Python sidecar: thêm download router/endpoints vào FastAPI
- Settings tab: thêm cấu hình download (concurrent limit, download folder, cookie management)

</code_context>

<specifics>
## Specific Ideas

- UI reference: Multi-Platform Downloader screenshot (3-panel: input → options → history)
- Douyin login giống cách nhiều tool chuyên nghiệp xử lý — dùng WebView embedded
- Giao diện "Analyze Link" trước, rồi user chọn format/quality để download (không auto-download ngay)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-video-downloader*
*Context gathered: 2026-04-16*
