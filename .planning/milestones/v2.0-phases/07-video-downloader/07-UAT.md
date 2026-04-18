---
status: testing
phase: 07-video-downloader
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-04-17T12:45:00Z
updated: 2026-04-17T13:05:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 8
name: Hủy lượt tải đang chạy
expected: |
  Nhấn nút Cancel trên một lượt tải đang ở trong Queue. Lượt tải dừng lại ngay lập tức và giải phóng slot trong hàng chờ.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Khởi động lại ứng dụng từ đầu, hệ thống backend và frontend kết nối ổn định, database sẵn sàng.
result: pass

### 2. Phân tích URL Douyin
expected: Dán link Douyin vào ô nhập liệu, nhấn Analyze. Hệ thống hiển thị thumbnail, tiêu đề và danh sách các định dạng video/audio có sẵn.
result: pass

### 3. Tải video Douyin không logo
expected: Chọn một định dạng video Douyin và nhấn Download. Video được tải về thành công và kiểm tra file output không có watermark của Douyin.
result: pass

### 4. Đồng bộ Cookie Douyin
expected: Sử dụng Cookie Manager để đồng bộ cookie từ trình duyệt. Trạng thái cookie hiển thị "Active" và cho phép tải các video yêu cầu quyền truy cập.
result: pass

### 5. Tải video từ các nền tảng khác (YouTube/TikTok/Social)
expected: Thử nghiệm phân tích và tải một link YouTube hoặc TikTok quốc tế. Đảm bảo engine yt-dlp hoạt động chính xác.
result: pass
fix_applied: "Thêm explicit FFmpeg detection, prefer H.264 (avc1) codec cho MP4, và gán fallback /best cho final format string."

### 6. Theo dõi tiến độ tải (Real-time Progress)
expected: Trong quá trình tải, thanh progress bar hiển thị phần trăm hoàn thành và tốc độ tải được cập nhật liên tục qua SSE.
result: pass

### 7. Kiểm tra lịch sử tải xuống
expected: Các video đã tải xong xuất hiện trong bảng History với đầy đủ thông tin về dung lượng, chất lượng và thời gian.
result: pass
fix_applied: "Chỉnh sửa API DELETE/CANCEL thành idempotent và đồng bộ thông báo SSE khi hủy."

### 8. Hủy lượt tải đang chạy
expected: Nhấn nút Cancel trên một lượt tải đang ở trong Queue. Lượt tải dừng lại ngay lập tức và giải phóng slot trong hàng chờ.
result: pass
fix_applied: "Cập nhật manager.py để thông báo cho SSE listeners ngay khi task bị hủy."

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0


## Gaps

- truth: "Thử nghiệm dán link và phân tích một link YouTube hoặc TikTok quốc tế. Đảm bảo hệ thống phân tích đúng các định dạng và tải về thành công qua engine yt-dlp."
  status: fixing
  reason: "User reported: youtube tải không có tiếng à?"
  severity: major
  test: 5
  root_cause: "Truyền video_id thay vì URL đầy đủ khiến engine không nhận diện đúng context platform, và format_id đơn lẻ cho các video DASH thiếu luồng âm thanh nếu không được merge đúng cách."
  artifacts: [ytdlp_engine.py, DownloaderPanel.tsx]
  missing: []
  debug_session: "Repro script in tmp/repro_ytdlp.py confirmed FFmpeg is working, focus shifted to parameter passing."

## Gaps

[none yet]
