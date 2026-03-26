---
status: complete
phase: 05-output-advanced
source: [01-SUMMARY.md, 02-SUMMARY.md]
started: 2026-03-26T11:45:19+07:00
updated: 2026-03-26T12:01:50+07:00
---

## Current Test
[testing complete]

## Tests

### 1. BGM Mix & Ducking
expected: Bật "Enable custom BGM" trong tab OUT, nhập đường dẫn tuyệt đối tới file nhạc MP3. Chỉnh slider BGM Vol và Ducking. Khi nhấn Export/Render ra file, video thành quả có nhạc nền và tự động giảm âm lượng nhạc (ducking) mỗi khi có tiếng đọc TTS.
result: issue
reported: "Không nhấn được"
severity: major

### 2. Watermark
expected: Bật "Enable Watermark" trong tab OUT, nhập Text. Khung Preview hiển thị chữ ngay lập tức. Sau khi Render, video thành quả có dính sub/watermark ở vị trí mặc định 10x10.
result: issue
reported: "Không điền chữ được"
severity: major

### 3. Blur Khung Hình
expected: Bật "Enable Blur" trong tab OUT. Chỉnh tọa độ Blur X/Y/W/H. Sau khi Render, video bị làm nhòe ở góc chỉ định.
result: issue
reported: "Bật nhưng không điều khiển được"
severity: major

### 4. Smart Crop (9:16)
expected: Bật "Smart Crop (9:16)" trong tab OUT. Khung Preview co lại thành tỷ lệ dọc. Render video sinh ra khung chuẩn 9:16 cắt giữa.
result: passed

## Summary

total: 4
passed: 1
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Bật 'Enable custom BGM' trong tab OUT, nhập đường dẫn tuyệt đối tới file nhạc MP3. Chỉnh slider BGM Vol và Ducking. Khi nhấn Export/Render ra file, video thành quả có nhạc nền và tự động giảm âm lượng nhạc (ducking) mỗi khi có tiếng đọc TTS."
  status: diagnosed
  reason: "User reported: Không nhấn được"
  severity: major
  test: 1
  artifacts: []
  missing:
    - "CSS layout or specific event blocking in OutTab.tsx prevents interaction with ToggleControl inside the nested div."

- truth: "Bật 'Enable Watermark' trong tab OUT, nhập Text. Khung Preview hiển thị chữ ngay lập tức. Sau khi Render, video thành quả có dính sub/watermark ở vị trí mặc định 10x10."
  status: diagnosed
  reason: "User reported: Không điền chữ được"
  severity: major
  test: 2
  artifacts: []
  missing:
    - "input type='text' with className='psel' may be unselectable/unfocusable due to global CSS restricting text selection (e.g. user-select: none) or layout issues."

- truth: "Bật 'Enable Blur' trong tab OUT. Chỉnh tọa độ Blur X/Y/W/H. Sau khi Render, video bị làm nhòe ở góc chỉ định."
  status: diagnosed
  reason: "User reported: Bật nhưng không điều khiển được"
  severity: major
  test: 3
  artifacts: []
  missing:
    - "Missing UI Slider/Number controls in OutTab.tsx for Blur X, Y, W, H. Without these, the user cannot change the coordinates of the blur box."
