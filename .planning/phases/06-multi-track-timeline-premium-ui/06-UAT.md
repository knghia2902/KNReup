---
status: diagnosed
phase: 06-multi-track-timeline-premium-ui
source: 06-SUMMARY.md
started: 2026-04-08T01:45:00Z
updated: 2026-04-08T02:15:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Tắt hẳn App và Backend rồi bật lại từ đầu. Load hệ thống bình thường không có lỗi. Kéo thả 1 video vào, App nhận video mượt mà, kết nối Backend bình thường.
result: issue
reported: "Kéo thả vào chưa được"
severity: major

### 2. Playhead Smoothness
expected: Bấm Play video. Thanh Playhead (đường gạch dọc thời gian) trong Timeline chạy mượt mà 60fps trên màn hình mà không làm các component UI khác bị giật hay đơ.
result: issue
reported: "Chưa mượt lắm, và cũng không điều kiển được thanh này"
severity: major

### 3. Audio Waveform Rendering
expected: Thêm video có tiếng vào. Track âm thanh (Audio/TTS Track) trong Timeline phải vẽ ra được biểu đồ sóng âm (Waveform).
result: pass

### 4. Dynamic Video Thumbnails
expected: Kéo Zoom In trên Timeline (nút zoom lúp). Track Video sẽ tuần tự tải và render các bức ảnh nhỏ (Thumbnail) dọc theo thời lượng video. Cuộn ngang màn hình sẽ load tiếp các ảnh chưa load.
result: issue
reported: "Có - nhưng mình cần có thể phần zoom nhỏ lại nữa"
severity: minor

### 5. Subtitle Trimming (Drag Edges)
expected: Rê chuột vào 2 cạnh mép Trái/Phải của một khối Subtitle trên Timeline. Con trỏ chuột đổi thành mũi tên 2 chiều. Kéo thả để tinh chỉnh rút ngắn/kéo dài độ dài thời gian của khối chữ đó bình thường.
result: issue
reported: "Click vào sub thì bị mất màu, kéo thì bị đè lên sub khác"
severity: major

### 6. Subtitle Splitting (Shortcut C)
expected: Kéo thanh Playhead đứng ở giữa một khối Subtitle bất kỳ. Bấm phím tắt `C` trên bàn phím. Khối chữ đó sẽ lập tức bị cắt làm 2 mảnh tại đúng vị trí Playhead.
result: issue
reported: "Không kéo được thanh đỏ bấm C không cut"
severity: major

### 7. Settings & API Key Persistence
expected: Vào tab Settings, điền thử code API Key ngẫu nhiên (Gemini, OpenAI...). Ấn Lưu file Project (phím tắt lưu đuôi `.kn`). Mở file `.kn` bằng Notepad, tìm kiếm sẽ KHÔNG ĐƯỢC thấy API Key lưu dính trong file text.
result: issue
reported: "Không có chỗ bấm lưu"
severity: major

## Summary

total: 7
passed: 1
issues: 6
pending: 0
skipped: 0

## Gaps
- truth: "Vào tab Settings, điền thử code API Key ngẫu nhiên (Gemini, OpenAI...). Ấn Lưu file Project (phím tắt lưu đuôi `.kn`). Mở file `.kn` bằng Notepad, tìm kiếm sẽ KHÔNG ĐƯỢC thấy API Key lưu dính trong file text."
  status: failed
  reason: "User reported: Không có chỗ bấm lưu"
  severity: major
  test: 7
  root_cause: "Logic lưu file Project `.kn` hiện tốn tại, chưa phát triển nút Menu Save hoặc phím tắt Save Project để serialize dữ liệu Zustand"
  artifacts:
    - path: "src/App.tsx"
      issue: "Thiếu handler và keyboard shortcut lệnh Save Project"
  missing:
    - "Viết hàm `handleSaveProject()` gom config và subtitles json"
    - "Ánh xạ phím tắt Ctrl/Cmd + S để gọi dialog save file `.kn`"
  debug_session: ""

- truth: "Kéo thanh Playhead đứng ở giữa một khối Subtitle bất kỳ. Bấm phím tắt `C` trên bàn phím. Khối chữ đó sẽ lập tức bị cắt làm 2 mảnh tại đúng vị trí Playhead."
  status: failed
  reason: "User reported: Không kéo được thanh đỏ bấm C không cut"
  severity: major
  test: 6
  root_cause: "Thanh Playhead lơ lửng DOM không bắt sự kiện chuẩn. Lỗi phím C không chạy do Playhead không kéo đến vị trí được và logic `query selector('video')` bị null."
  artifacts:
    - path: "src/components/editor/Timeline.tsx"
      issue: "Component Playhead chưa gán pointer events và handle drag"
    - path: "src/components/editor/SubtitleTrack.tsx"
      issue: "Phím C yếu ớt, lệ thuộc document query"
  missing:
    - "Thêm Draggable events cho Playhead, broadcast `timeupdate`"
    - "Xử lý Playhead drag, dùng useSubtitleStore proxy"
  debug_session: ""

- truth: "Rê chuột vào 2 cạnh mép Trái/Phải của một khối Subtitle trên Timeline. Con trỏ chuột đổi thành mũi tên 2 chiều. Kéo thả để tinh chỉnh rút ngắn/kéo dài độ dài thời gian của khối chữ đó bình thường."
  status: failed
  reason: "User reported: Click vào sub thì bị mất màu, kéo thì bị đè lên sub khác"
  severity: major
  test: 5
  root_cause: "Mất màu do biến CSS `var(--ac-hover)` chưa khai báo. Kéo đè do bỏ sót check clamp min/max với `segments[index-1]` và `segments[index+1]`"
  artifacts:
    - path: "src/components/editor/SubtitleTrack.tsx"
      issue: "Thiếu collision check lúc Drag Left/Right"
    - path: "src/styles/design-system.css"
      issue: "Thiếu biến `--ac-hover`"
  missing:
    - "Định nghĩa `--ac-hover` trong css"
    - "Lấy item hiện tại, filter lấy item kề trước/kề sau chặn `newStart` và `newEnd`"
  debug_session: ""

- truth: "Kéo Zoom In trên Timeline (nút zoom lúp). Track Video sẽ tuần tự tải và render các bức ảnh nhỏ (Thumbnail) dọc theo thời lượng video. Cuộn ngang màn hình sẽ load tiếp các ảnh chưa load."
  status: failed
  reason: "User reported: Có - nhưng mình cần có thể phần zoom nhỏ lại nữa"
  severity: minor
  test: 4
  root_cause: "Nút Zoom Out hiện tại đang fix chặn ở scale = 1.0, không cho lùi xuống dưới."
  artifacts:
    - path: "src/components/editor/Timeline.tsx"
      issue: "Hàm `handleZoomOut` chặn cứng Math.max(1)"
  missing:
    - "Hạ Math.max(0.1), cho phép timelineZoom đi dưới 1.0"
  debug_session: ""

- truth: "Bấm Play video. Thanh Playhead (đường gạch dọc thời gian) trong Timeline chạy mượt mà 60fps trên màn hình mà không làm các component UI khác bị giật hay đơ."
  status: failed
  reason: "User reported: Chưa mượt lắm, và cũng không điều kiển được thanh này"
  severity: major
  test: 2
  root_cause: "Timeline lắng nghe event `timeupdate` của HTML5 Video vốn cực kỳ lag (throttle của Chrome)."
  artifacts:
    - path: "src/components/editor/Timeline.tsx"
      issue: "Bám theo `timeupdate` làm Timeline giật cục"
  missing:
    - "Đổi sang vòng lặp `requestAnimationFrame` polling `video.currentTime`"
  debug_session: ""

- truth: "Tắt hẳn App và Backend rồi bật lại từ đầu. Load hệ thống bình thường không có lỗi. Kéo thả 1 video vào, App nhận video mượt mà, kết nối Backend bình thường."
  status: failed
  reason: "User reported: Kéo thả vào chưa được"
  severity: major
  test: 1
  root_cause: "Code Drag-drop HTML5 truyền thống đã tắt đi, nhưng chưa bổ sung listener kiện `tauri://file-drop` của Tauri vào hệ thống."
  artifacts:
    - path: "src/App.tsx"
      issue: "Chưa setup `listen('tauri://file-drop')`"
  missing:
    - "Khai báo useEffect listen `tauri://file-drop` nạp vào `handleFileSelected`"
  debug_session: ""
