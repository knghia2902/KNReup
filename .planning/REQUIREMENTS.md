# Requirements: Milestone v2.0 (Pro Release)

Bảng yêu cầu kỹ thuật chi tiết cho đợt nâng cấp Pro Release của KNReup.

## Multi-Engine Dịch & Lồng Tiếng (Category 1)
- [x] **M2-01**: Tích hợp Engine API hệ OpenAI (để hỗ trợ các Prompt dịch cao cấp hơn).
- [x] **M2-02**: Tích hợp CTranslate2 / Argos Offline làm fallback cứng cho tính năng Dịch.
- [x] **M2-03**: Xây dựng thuật toán Auto Fallback và Key Rotation trong class `TranslationEngine` (ví dụ: DeepSeek tịt thì tự đổi API Key hoặc fallback sang Gemini).
- [x] **M2-04**: Tích hợp Engine Đọc Piper TTS (Offline) và gTTS (Online).
- [x] **M2-05**: Bổ sung Audio FX Pipeline cho Engine TTS gốc (Thay đổi Speed, Pitch, Volume) trước khi trộn.

## Kỹ Xảo Output Nâng Cao (Category 2)
- [ ] **M2-06**: Ứng dụng AI PaddleOCR / EasyOCR chạy ngầm để dò tìm bounding box của Hardsub Gốc trong video.
- [ ] **M2-07**: Tự động Blur (Làm mờ) vùng bounding box phụ đề do OCR dò ra trước khi chèn sub mới đè lên.
- [ ] **M2-08**: Hỗ trợ chèn Watermark Text và Logo (Có 1 Controller Dot trên UI Canvas Preview để kéo thả tọa độ).
- [ ] **M2-09**: Hỗ trợ thiết lập Audio BGM (Nhạc nền) - Tính toán Ducking (Giảm âm lượng nhạc nền khi có TTS) và Auto-loop.
- [ ] **M2-10**: Bổ sung Engine Crop và Smart Resize (Tự Fill Viền) chuyển khung hình từ 16:9 sang 9:16.

## Giao Diện & Timeline (Category 3)
- [ ] **M2-11**: Nâng cấp Timeline thành 4 Track chuyên biệt: VIDEO / AUDIO / SUB / BGM.
- [ ] **M2-12**: Tích hợp `wavesurfer.js` để render waveform chân thực ở Track Audio thay vì hộp vuông.
- [ ] **M2-13**: Tối ưu UX/UI với Dark/Light Theme Switcher và Glassmorphism cho 5-Panel Editor hiện hành.
- [ ] **M2-14**: Quản lý phím tắt Keyboard (Space để play/pause, Ctrl+S để lưu project nội bộ).

## Future / Out of Scope
- **Video Downloader**: Mặc dù từng được xếp trong Roadmap, tính năng Downloader Douyin/Tiktok quá khổng lồ (liên quan Session Cookie, Bypass). Sẽ đẩy mạnh vào **Milestone 3** để không phá vỡ mảng Editor của Milestone 2.
- **Voice Cloning**: Đòi hỏi GPU Server VRAM siêu cao, tạm thời Out-of-Scope toàn diện.

## Traceability
*(Các Requirement ID hiện đang nằm chờ được Plan vào các Phase 4, 5, 6).*
