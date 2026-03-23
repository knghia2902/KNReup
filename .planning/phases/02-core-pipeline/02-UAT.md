# Phase 2: Core Pipeline - User Acceptance Testing

## Bài test hiện tại

number: 2
name: Giao diện Processing Overlay
expected: |
  Ngay khi bắt đầu xử lý, một panel Job Monitor mảnh (Floating Toast) xuất hiện ở góc dưới bên phải màn hình, hiển thị vòng loading, tên bước hiện tại và thanh % màu xanh. Người dùng vẫn thao tác được các panel khác bình thường.
awaiting: user response

## Danh sách Test

### 1. Kéo thả Video vào Media Bin
expected: Giao diện Media Bin cho phép kéo thả video. Các biểu tượng sử dụng Phosphor Icons (không có emoji). Khi thả video vào, hệ thống nhận diện được file.
result: pass

### 2. Giao diện Job Monitor (Thay thế Overlay)
expected: Ngay khi bắt đầu xử lý, panel Job Monitor mảnh (Floating Toast) xuất hiện ở góc dưới bên phải màn hình, không block thao tác (chuẩn batch processing). Hiển thị loading, tên bước và % tiến độ.
result: pending

### 3. Tiến trình SSE - Transcribe & Translate
expected: Overlay cập nhật tiến trình liên tục, chuyển mượt mà từ bước `transcribe` (Whisper) sang `translate` (DeepSeek/Argos) mà không bị kẹt hay crash trình duyệt.
result: pending

### 4. Tiến trình SSE - TTS & Merge
expected: Sau khi dịch xong, hệ thống tiếp tục chạy qua bước `tts` (tạo giọng nói) và cuối cùng là `merge` (FFmpeg). Các bước này đều hiển thị % tiến độ trên UI.
result: pending

### 5. Kết quả Output
expected: Khi hoàn thành 100%, overlay báo thành công. Có một file video output được tạo ra trong thư mục backend (hoặc tải xuống), chứa âm thanh lồng tiếng Việt và phụ đề cứng (hardsub/ASS) màu vàng chuẩn VideoTransAI.
result: pending

### 6. Endpoint danh sách Voice
expected: Có thể lấy được danh sách giọng đọc từ Edge TTS (có locale "vi") thông qua API `/api/pipeline/voices?engine=edge_tts` hoặc UI đã tích hợp fetch thông tin này.
result: pending

## Summary

total: 6
passed: 1
issues: 0
pending: 5
skipped: 0

## Gaps

- **Test 2 (issue)**: Không thả được video do bị kẹt HTML5 Drop, và UI Overlay hiển thị cản trở batch processing. 
- **Root cause**: Tauri native drag-drop trả về đường dẫn Absolute thay vì object File, đồng thời sử dụng Upload qua HTTP cục bộ quá nặng/chậm. Thiết kế Blocking Overlay sai UX.
- **Evidence**: `.planning/debug/upload-and-overlay-issue.md`
- **Fix Plan**: `05-GAP-PLAN.md` (Tái thiết kế hệ thống nhận File thông qua Local Path, và thay Overlay bằng Job Monitor thả nổi nền).
