# Phase 2: Core Pipeline - User Acceptance Testing

## Bài test hiện tại

number: 2
name: Giao diện Processing Overlay
expected: |
  Ngay khi bắt đầu xử lý, một màn hình overlay mờ (Processing Overlay) xuất hiện che toàn màn hình, hiển thị vòng loading, tên bước hiện tại (vd: Extracting/Transcribing) và % tiến độ.
awaiting: user response

## Danh sách Test

### 1. Kéo thả Video vào Media Bin
expected: Giao diện Media Bin cho phép kéo thả video. Các biểu tượng sử dụng Phosphor Icons (không có emoji). Khi thả video vào, hệ thống nhận diện được file.
result: pass

### 2. Giao diện Processing Overlay
expected: Ngay khi bắt đầu xử lý, một màn hình overlay mờ (Processing Overlay) xuất hiện che toàn màn hình, hiển thị vòng loading, tên bước hiện tại (vd: Extracting/Transcribing) và % tiến độ.
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

[none yet]
