---
status: complete
phase: 05-output-advanced
source: [01-SUMMARY.md, 02-SUMMARY.md]
started: 2026-03-31T13:25:00+07:00
updated: 2026-03-31T15:14:00+07:00
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Khởi động lại phần mềm (npm run tauri dev và python sidecar). Không có lỗi xảy ra. Mở video, chuyển sang tab OUT và mọi thứ hiển thị bình thường.
result: pass

### 2. Audio Mix: BGM & Ducking
expected: Bật "Enable custom BGM" trong tab OUT. Có nút báo "Select audio file" và khi click mởi được dialog chọn file nhạc MP3. Chỉnh được BGM Vol và Ducking. Nút Toggle và Slider không bị lỗi click. (UAT cũ đã báo lỗi unclickable được fix). Có thể điều khiển mượt mà.
result: issue
reported: "Chưa có phần nghe thử âm thanh\nSub không có nghe thấy\nOutput khi có audio thì voice góc bị nhỏ\nCác file âm thanh đầy ở phần download."
severity: major

### 3. Video Effects: Watermark Text
expected: Bật "TEXT LOGO" trong tab OUT. Nhập đoạn Text (ví dụ: @knreup) vào thẻ Text, gõ được chữ bình thường (Lỗi cũ: Không điền chữ được - đã fix). Điều khiển được XY vị trí và Opacity. Frame text nằm chung ở OutTab.
result: issue
reported: "Phần Text logo xem phần sub để setup vị trí thì có được không?"
severity: minor

### 4. Video Effects: Blur Regions
expected: Bật "Enable Blur" trong tab OUT. Di chuyển kéo các Slider Blur X, Y, W, H một cách bình thường (Lỗi cũ: không điều khiển được - đã fix). 
result: issue
reported: "Blur bị lem, với giống phần logo luôn xem giống subtext được không"
severity: major

### 5. Video Effects: Smart Crop (9:16)
expected: Tại tab OUT (Video ratio), chọn "9:16 · portrait". Khung hình trong trình Editor sẽ giả định hình dáng 9:16 nằm giữa màn. Mọi setting được ghi nhận trong Store.
result: issue
reported: "Để 9:16 thì Blur và Logo bị lệch"
severity: major

### 6. Video Preview Overlay
expected: Video Preview hiển thị overlay (ví dụ: khối chữ nhật mờ mô phỏng vị trí watermark/blur tương đối) khớp với tỉ lệ màn hình bên khung Edit lúc kéo thả sliders.
result: issue
reported: "Logo và Blur chưa ổn đâu như nãy đã nói"
severity: major

## Summary

total: 6
passed: 1
issues: 5
pending: 0
skipped: 0

## Gaps

- truth: "Bật \"Enable custom BGM\" trong tab OUT. Có nút báo \"Select audio file\" và khi click mởi được dialog chọn file nhạc MP3. Chỉnh được BGM Vol và Ducking. Nút Toggle và Slider không bị lỗi click. (UAT cũ đã báo lỗi unclickable được fix). Có thể điều khiển mượt mà."
  status: resolved
  reason: "User reported: Chưa có phần nghe thử âm thanh. Sub không có nghe thấy. Output khi có audio thì voice góc bị nhỏ. Các file âm thanh đầy ở phần download."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Bật \"TEXT LOGO\" trong tab OUT. Nhập đoạn Text (ví dụ: @knreup) vào thẻ Text, gõ được chữ bình thường (Lỗi cũ: Không điền chữ được - đã fix). Điều khiển được XY vị trí và Opacity. Frame text nằm chung ở OutTab."
  status: resolved
  reason: "User reported: Phần Text logo xem phần sub để setup vị trí thì có được không?"
  severity: minor
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Bật \"Enable Blur\" trong tab OUT. Di chuyển kéo các Slider Blur X, Y, W, H một cách bình thường (Lỗi cũ: không điều khiển được - đã fix)."
  status: resolved
  reason: "User reported: Blur bị lem, với giống phần logo luôn xem giống subtext được không"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Tại tab OUT (Video ratio), chọn \"9:16 · portrait\". Khung hình trong trình Editor sẽ giả định hình dáng 9:16 nằm giữa màn. Mọi setting được ghi nhận trong Store."
  status: resolved
  reason: "User reported: Để 9:16 thì Blur và Logo bị lệch"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Video Preview hiển thị overlay (ví dụ: khối chữ nhật mờ mô phỏng vị trí watermark/blur tương đối) khớp với tỉ lệ màn hình bên khung Edit lúc kéo thả sliders."
  status: resolved
  reason: "User reported: Logo và Blur chưa ổn đâu như nãy đã nói"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
