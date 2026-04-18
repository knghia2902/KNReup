---
status: complete
phase: 05-output-advanced
source: [04-SUMMARY.md]
started: 2026-04-04T12:00:00+07:00
updated: 2026-04-04T12:00:00+07:00
---

## Current Test

number: 1
name: BGM Audio Mix & Preview
expected: |
  Tại Tab OUT, chọn một file BGM có sẵn. Ngay bên dưới nút chọn sẽ hiện ra trình phát nhạc mini (Audio Player) cho phép bạn nghe thử bài nhạc vừa chọn. Khi bấm "Add to Queue" để render video, file Output xuất ra có tiếng gốc/tiếng lồng ổn định, không còn bị quá nhỏ. Tính năng Ducking nếu bật sẽ không gây crash.
awaiting: user response

## Tests

### 1. BGM Audio Mix & Preview
expected: Tại Tab OUT, chọn một file BGM có sẵn. Ngay bên dưới nút chọn sẽ hiện ra trình phát nhạc mini (Audio Player) cho phép bạn nghe thử bài nhạc vừa chọn. Khi bấm "Add to Queue" để render video, file Output xuất ra có tiếng gốc/tiếng lồng ổn định, không còn bị quá nhỏ. Tính năng Ducking nếu bật sẽ không gây crash.
result: issue
reported: "BGM Vol và Ducking kéo nhưng không nghe được preview trực tiếp"
severity: major

### 2. Gaussian Blur (Fix lem viền)
expected: Cấu hình vùng Blur trong OUT Tab. Sau khi render, video Output có vùng bị mờ mịn đều (Gaussian Blur), không bị nhòe/kéo viền lem luốc ở mép như hiệu ứng trước đó. Tool không bị crash dù kéo vùng blur diện tích nhỏ.
result: pass

### 3. Smart Crop 9:16 & Dummy Subtitle Overlay Alignment 
expected: Chọn Video ratio là 9:16 (Portrait). Trong ô Video Preview lớn, khi bật Blur/Watermark sẽ xuất hiện một khối Text giả lập Subtitle giúp bạn canh canh vị trí. Thử điều chỉnh Logo Text hoặc Blur, sau đó bấm Render. Tọa độ của Logo/Blur trong Output MP4 phải khớp chính xác với tỷ lệ bạn xếp trong Editor trước đó (Hết lỗi logo và blur lệch).
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Thanh trượt BGM Vol kết nối realtime với Audio Player để preview âm lượng trực tiếp trước khi render."
  status: failed
  reason: "User reported: BGM Vol và Ducking kéo nhưng không nghe được preview trực tiếp"
  severity: major
  test: 1
  artifacts: []
  missing: []

