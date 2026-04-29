---
status: complete
phase: 26-tich-hop-cong-cu-trackingface-auto-crop-9-16-vao-quy-trinh-x
source: [26-01-SUMMARY.md, 26-02-SUMMARY.md, 26-03-SUMMARY.md]
started: 2026-04-29T22:52:00+07:00
updated: 2026-04-29T23:36:11+07:00
---

## Current Test

[testing complete]

## Tests

### 1. Smart Crop tool card trên Launcher
expected: Mở Home Launcher → phần "Công cụ" hiện nút "Smart Crop" với icon hình kéo (Scissors) và mô tả "AI crop 16:9 → 9:16".
result: pass

### 2. Mở cửa sổ Smart Crop
expected: Bấm nút "Smart Crop" trên Launcher → cửa sổ mới mở ra với title "KNReup Smart Crop", kích thước khoảng 1200x800. Hiện hero text "Smart Crop 9:16" và dropzone "Kéo thả video vào đây".
result: pass

### 3. GPU Status Badge
expected: Trên header cửa sổ Smart Crop, bên phải chữ "knreup Smart Crop", hiện badge nhỏ cho biết GPU hay CPU mode (ví dụ "GPU · NVIDIA..." hoặc "CPU Mode").
result: pass

### 4. Chọn video qua File Picker
expected: Bấm vào vùng dropzone → hộp thoại chọn file mở ra (filter: mp4, mkv, mov, avi, webm). Chọn 1 video → panel "16:9 · Gốc" hiện video đã chọn. Panel "9:16 · Đã crop" hiện text "Đang chờ xử lý...". Controls toolbar xuất hiện bên dưới.
result: pass

### 5. Controls slider hoạt động
expected: Sau khi chọn video, kéo slider "Độ mượt camera" → giá trị thay đổi (hiện số bên phải). Tương tự cho "Vùng an toàn" và "Nhận diện mỗi". Toggle "Fix giữa nếu mất mặt" bật/tắt được.
result: pass

### 6. Export + SSE Progress
expected: Bấm nút "💾 Export 9:16" → progress bar xuất hiện, hiện thông tin frame đang xử lý (VD: "Frame 100/500"). Sau khi xong, panel 9:16 hiện video đã crop. Nút "→ Mở trong Editor" xuất hiện.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
