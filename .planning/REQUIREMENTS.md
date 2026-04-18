# Milestone 3 Requirements: Full Release (Automation & AI)

## Goals
Nâng cấp trải nghiệm chỉnh sửa (Editor) lên mức chuyên nghiệp, tích hợp AI để tối ưu nội dung, và xây dựng hệ thống tự động hóa.

## Editor Upgrades (Trọng tâm Phase 8.0)

### M3-ED-01: Interactive Timeline Tracks
- **Feature**: Tất cả 4 track (VID, TTS, SUB, BGM) đều có thể chỉnh sửa trực tiếp trên timeline.
- **Requirement**:
  - **VID Track**: Trim đầu/cuối video, kéo thả di chuyển clip, hiển thị thumbnail chi tiết hơn.
  - **TTS Track**: Xem waveform TTS, trim/offset audio TTS theo segment phụ đề.
  - **SUB Track**: Giữ nguyên tính năng drag/trim/split hiện tại, bổ sung snap-to-playhead.
  - **BGM Track**: Trim nhạc nền, điều chỉnh điểm bắt đầu BGM, fade in/out trực quan.
  - **Snapping**: Cơ chế "hút" giữa các track khi kéo (magnetic timeline).
- **UI**: Các handle resize 2 đầu + tooltip hiển thị thời gian chính xác.

### M3-ED-02: Advanced Properties Panels
- **Feature**: Nâng cấp các tab STYLE, TTS, SUB, OUT trong Properties Panel.
- **Requirement**:
  - **STYLE Tab**: Thêm preset phong cách phụ đề (CapCut-style, Cinematic, Minimal...), live preview khi thay đổi.
  - **TTS Tab**: Chọn giọng đọc per-segment (không chỉ global), preview audio trước khi render.
  - **SUB Tab**: Bulk edit (chọn nhiều segment → sửa cùng lúc), tìm kiếm/thay thế trong phụ đề.
  - **OUT Tab**: Batch Export Presets (lưu/tải cấu hình export yêu thích).

### M3-ED-03: AI Subtitle Refiner
- **Feature**: Tích hợp nút "AI Refine" trong bảng phụ đề.
- **Requirement**: Gửi toàn bộ phụ đề đến LLM (Gemini/DeepSeek) để hiệu đính, làm mượt ngôn ngữ và kiểm tra lỗi chính tả tự động.
- **UI**: Nút bấm trực tiếp trên SUB tab hoặc toolbar.

### M3-ED-04: AI Subtitle Masking
- **Feature**: Tự động phát hiện và bôi mờ phụ đề gốc.
- **Requirement**: Sử dụng OCR (EasyOCR) để quét frame, tự động đặt vùng Blur khớp với hardsub cũ.

## Automation & System

### M3-AU-01: Auto-Monitor (Account Tracking)
- **Feature**: Theo dõi kênh Douyin/TikTok.
- **Requirement**: Hệ thống tự động kiểm tra kênh mỗi X phút, phát hiện video mới và tự động đưa vào hàng đợi tải về.

### M3-SY-01: Licensing & Distribution
- **Feature**: Hệ thống bản quyền và cập nhật.
- **Requirement**: Đăng ký license key, kiểm tra khi khởi động app, tự động tải và cài đặt bản cập nhật mới.
