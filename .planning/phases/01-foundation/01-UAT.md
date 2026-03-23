---
status: testing
phase: 01-foundation
source: [01-PLAN.md, 02-PLAN.md, 03-PLAN.md]
started: 2026-03-23T19:30:00Z
updated: 2026-03-23T23:00:00Z
---

## Bài test hiện tại

[testing complete]

## Danh sách Test

### 1. Khởi động thử từ đầu (Cold Start)
expected: Tắt toàn bộ các server/service đang chạy. Xoá hết các cache tạm thời. Khởi động ứng dụng từ đầu (chạy `python run_dev.py` sau đó `npm run tauri dev`). Server khởi chạy không báo lỗi và ứng dụng React hiển thị màn hình chính bình thường.
result: pass

### 2. Mở Dev Server
expected: Cửa sổ Tauri app (native window) mở lên thành công và hiển thị giao diện React, không bị lỗi màn hình trắng.
result: pass

### 3. Python Sidecar Hoạt Động
expected: Chạy `python run_dev.py` trong thư mục `python-sidecar` khởi tạo thành công FastAPI server trên cổng 8008, không bị lỗi cú pháp hay lỗi import.
result: pass

### 4. Hệ thống Giao diện (Design System)
expected: Ứng dụng hiển thị với giao diện chuẩn dark theme "cockpit", sử dụng phông chữ Inter và có hiệu ứng kính mờ (glassmorphism) đẹp mắt.
result: pass

### 5. Kết nối Frontend-Backend 
expected: Khi mở app lên, ô trạng thái (status) trên thanh tiêu đề hiển thị báo "Backend connected" thông báo đã kết nối thành công với Python sidecar.
result: pass

### 6. Bảng kiểm tra Dependencies
expected: Ở lần chạy đầu tiên, một popup kiểm tra môi trường hiện lên để kiểm tra xem đã cài GPU/CUDA và FFmpeg chưa, hiển thị dấu ✅ hoặc ❌ cho từng thành phần.
result: pass

### 7. Layout Mặc định
expected: Giao diện chính của phần mềm chỉnh sửa NLE được chia dọc ngang thành 5 khu vực rất rõ ràng (Thanh công cụ ở trên, Cột trái, Giữa xem video, Cột phải cho Settings, và Timeline ở dưới đáy).
result: pass

### 8. Kéo thả kích thước Panel
expected: Đường ranh giới giữa các vùng panel hiển thị có thể nhấp chuột vào kéo thả mượt mà để thay đổi kích thước ngang/dọc của từng vùng.
result: issue
reported: "Không kéo được"
severity: major

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Đường ranh giới giữa các vùng panel hiển thị có thể nhấp chuột vào kéo thả mượt mà để thay đổi kích thước ngang/dọc của từng vùng."
  status: failed
  reason: "User reported: Không kéo được"
  severity: major
  test: 8
  artifacts: []
  missing: []
