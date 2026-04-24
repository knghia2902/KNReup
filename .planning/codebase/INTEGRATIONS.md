# Integrations - KNReup

Dự án tích hợp nhiều dịch vụ bên ngoài và công cụ nội bộ thông qua mô hình Sidecar.

## 1. Local Sidecar Bridge (Giao tiếp nội bộ)
- **Phương thức:** HTTP REST API & Server-Sent Events (SSE).
- **Frontend ↔ Backend:** 
  - React frontend gọi API tới FastAPI sidecar (mặc định port 8008 trong dev, dynamic port trong prod).
  - Sử dụng `SSE` để cập nhật tiến độ thực hiện (progress) theo thời gian thực cho các tác vụ dài (ASR, Translation, Rendering).

## 2. Dịch vụ TTS bên ngoài (Cloud TTS)
- **Microsoft Edge TTS:**
  - Sử dụng thư viện `edge-tts`.
  - Không yêu cầu API Key, tốc độ nhanh, chất lượng ổn định.
- **ElevenLabs:**
  - Tích hợp qua API chính thức.
  - Yêu cầu API Key từ người dùng.
  - Hỗ trợ Voice Cloning và giọng nói chất lượng cao.

## 3. Dịch vụ AI Offline (On-device AI)
- **ASR (Whisper):**
  - Sử dụng `faster-whisper` chạy local.
  - Tận dụng GPU (CUDA) để tăng tốc độ nhận diện.
- **Translation (Argos Translate):**
  - Chạy offline hoàn toàn.
  - Yêu cầu tải các model ngôn ngữ (`install_langs.py`).
- **OCR (RapidOCR):**
  - Sử dụng ONNX Runtime để nhận diện phụ đề/chữ trong video.

## 4. Công cụ tải video (Video Downloaders)
- **yt-dlp:** 
  - Tích hợp để tải video từ nhiều nguồn.
  - Xử lý qua command line wrapper trong sidecar.
- **f2:**
  - Tối ưu cho việc tải video từ Douyin mà không có watermark.

## 5. Hệ thống File & OS
- **Tauri Plugin FS:** Cho phép frontend truy cập trực tiếp vào hệ thống file (với quyền hạn được cấp).
- **Tauri Shell:** Dùng để spawn và quản lý vòng đời của Python sidecar.
- **Asset Protocol:** Tauri cho phép load các file local (video, audio) thông qua custom protocol (`asset://`).

## 6. Authentication (Dự kiến/Cơ bản)
- Hiện tại hỗ trợ các module auth cơ bản (`src/components/auth`) cho việc quản lý người dùng cục bộ hoặc tích hợp API trong tương lai.
