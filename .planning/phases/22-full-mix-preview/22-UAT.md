---
status: complete
started: 2026-04-24T08:30:00+07:00
updated: 2026-04-24T08:51:00+07:00
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
expected: Chọn BGM từ AudioLibrary (Library hoặc Import). Nhấn play — nghe cả video audio lẫn BGM cùng lúc (mixed). Kéo slider Volume BGM — âm lượng BGM thay đổi real-time.
result: issue
reported: "Mình cần khi bấm play trên VideoPreview thì những thành phần nào đã thêm vào timeline mà có âm thanh thì phải hoạt động cùng lúc"
severity: major

### 4. Timeline Mini Volume Indicators
expected: Nhìn vào track headers bên trái Timeline: 3 tracks VID/TTS/BGM hiện speaker icon + progress bar nhỏ. Kéo volume slider → progress bar update theo. Tắt "Keep Original Audio" → VID track hiện muted icon.
result: issue
reported: "Không tương tác được"
severity: major

### 5. Scrub Mute (Kéo Playhead)
expected: Khi video đang play, kéo playhead nhanh trên timeline — audio im lặng trong lúc kéo. Thả ra — audio tiếp tục từ vị trí mới.
result: issue
reported: "Không hoạt động"
severity: major

### 6. Tab Visibility Lifecycle
expected: Khi video đang play, chuyển sang tab khác rồi quay lại — audio resume bình thường, không bị lỗi hoặc mất tiếng.
result: issue
reported: "Play Video và BGM sau đó mở tab khác, qua downloader, mở thêm một project âm thanh vẫn hoạt động"
severity: major

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Chọn BGM từ AudioLibrary (Library hoặc Import). Nhấn play — nghe cả video audio lẫn BGM cùng lúc (mixed). Kéo slider Volume BGM — âm lượng BGM thay đổi real-time."
  status: failed
  reason: "User reported: Mình cần khi bấm play trên VideoPreview thì những thành phần nào đã thêm vào timeline mà có âm thanh thì phải hoạt động cùng lúc"
  severity: major
  test: 3
  artifacts: []
- truth: "Nhìn vào track headers bên trái Timeline: 3 tracks VID/TTS/BGM hiện speaker icon + progress bar nhỏ. Kéo volume slider → progress bar update theo. Tắt 'Keep Original Audio' → VID track hiện muted icon."
  status: failed
  reason: "User reported: Không tương tác được"
  severity: major
  test: 4
  artifacts: []
- truth: "Khi video đang play, kéo playhead nhanh trên timeline — audio im lặng trong lúc kéo. Thả ra — audio tiếp tục từ vị trí mới."
  status: failed
  reason: "User reported: Không hoạt động"
  severity: major
  test: 5
  artifacts: []
- truth: "Khi video đang play, chuyển sang tab khác rồi quay lại — audio resume bình thường, không bị lỗi hoặc mất tiếng."
  status: failed
  reason: "User reported: Play Video và BGM sau đó mở tab khác, qua downloader, mở thêm một project âm thanh vẫn hoạt động"
  severity: major
  test: 6
  artifacts: []
  missing: []
