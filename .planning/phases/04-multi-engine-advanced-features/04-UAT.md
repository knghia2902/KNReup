---
status: testing
phase: 04-multi-engine-advanced-features
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-03-25T09:57:40+07:00
updated: 2026-03-25T09:57:40+07:00
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 4
name: Export Queue (Batch Render)
expected: |
  Chuyển sang tab QUEUE. Bấm nút Render cho 2 video liên tiếp. Các video đó phải xuất hiện trong danh sách hàng đợi (Batch), tự động chuyển sang Processing nếu luồng rảnh, tiến trình thanh màu liên tục đẩy lên.
awaiting: user response

## Tests

### 1. Khởi động lại (Cold Start Smoke Test)
expected: Tắt các terminal chạy ngầm. Khởi động lại ứng dụng từ đầu. Giao diện không lỗi, backend gọi API bình thường.
result: pass

### 2. Auto Fallback / Circuit Breaker
expected: Cố tình cung cấp một API Key OpenAI thiếu hoặc sai trong config. Bấm nút Render để chạy pipeline, ứng dụng bắt lỗi API và tự động nhảy qua Engine dự phòng (như Gemini) để tiếp tục dịch thành công.
result: pass

### 3. Audio FX Preview
expected: Chỉnh thanh Pitch lên 1.5 trong tab TTS. Bấm nút 'Preview Audio FX'. Trình duyệt phải phát một đoạn âm thanh mẫu mang hiệu ứng Pitch cao mà không gặp lỗi API.
result: pass

### 4. Export Queue (Batch Render)
expected: Chuyển sang tab QUEUE. Bấm nút Render cho 2 video liên tiếp. Các video đó phải xuất hiện trong danh sách hàng đợi (Batch), tự động chuyển sang Processing nếu luồng rảnh, tiến trình thanh màu liên tục đẩy lên.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps
