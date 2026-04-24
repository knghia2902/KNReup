---
status: complete
started: 2026-04-24T08:30:00+07:00
---

## Current Test

[testing complete]

## Tests

### 1. Video Audio qua Web Audio Pipeline
expected: Mở Editor, load 1 video có tiếng. Video phát tiếng bình thường — audio đi qua Web Audio API pipeline mà không mất tiếng hay delay.
result: pass

### 2. Original Volume Slider
expected: Vào AudioTab > Original Audio > bật "Keep Original Audio". Kéo slider Volume — âm lượng video gốc thay đổi real-time. Tắt "Keep Original Audio" — video im lặng hoàn toàn.
result: pass

### 3. BGM Mixed Audio
expected: |
  Chọn BGM từ AudioLibrary (Library hoặc Import). Nhấn play — nghe cả video audio lẫn BGM cùng lúc (mixed). Kéo slider Volume BGM — âm lượng BGM thay đổi real-time.
result: issue
reported: "Hoạt động, nhưng chuyển phần chỉnh volume của BGM sang tab audio luôn đi"
severity: minor

### 4. Timeline Mini Volume Indicators
expected: Nhìn vào track headers bên trái Timeline: 3 tracks VID/TTS/BGM hiện speaker icon + progress bar nhỏ. Kéo volume slider → progress bar update theo. Tắt "Keep Original Audio" → VID track hiện muted icon.
result: issue
reported: "Bên capcut phần track headers chỉ có các mục như show track, lock track, mute track các phần như chỉnh volume đều nằm bên panel phải"
severity: minor

### 5. Scrub Mute (Kéo Playhead)
expected: Khi video đang play, kéo playhead nhanh trên timeline — audio im lặng trong lúc kéo. Thả ra — audio tiếp tục từ vị trí mới.
result: pass

### 6. Tab Visibility Lifecycle
expected: Khi video đang play, chuyển sang tab khác rồi quay lại — audio resume bình thường, không bị lỗi hoặc mất tiếng.
result: skipped
reason: "Vẫn chưa hoạt động nhưng bên capcut khi thu gọn video hoặc mở tab khác vẫn phát nhạc nên không sao"

## Summary

total: 6
passed: 3
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Chọn BGM từ AudioLibrary (Library hoặc Import). Nhấn play — nghe cả video audio lẫn BGM cùng lúc (mixed). Kéo slider Volume BGM — âm lượng BGM thay đổi real-time."
  status: failed
  reason: "User reported: Hoạt động, nhưng chuyển phần chỉnh volume của BGM sang tab audio luôn đi"
  severity: minor
  test: 3
  artifacts: []
  missing: []
- truth: "Nhìn vào track headers bên trái Timeline: 3 tracks VID/TTS/BGM hiện speaker icon + progress bar nhỏ. Kéo volume slider → progress bar update theo. Tắt 'Keep Original Audio' → VID track hiện muted icon."
  status: failed
  reason: "User reported: Bên capcut phần track headers chỉ có các mục như show track, lock track, mute track các phần như chỉnh volume đều nằm bên panel phải"
  severity: minor
  test: 4
  artifacts: []
  missing: []

