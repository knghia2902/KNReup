# Research: Technology Stack (Multi-Engine & Output Advanced)

## 1. Dịch Thuật (Translation)
- **Online APIs**: `google-generativeai` (Gemini), `openai` (ChatGPT). Lưu ý: Các hãng cung cấp SDK chính thức đễ bắt lỗi rate limit (`429`).
- **Offline ML**: `ctranslate2` kết hợp `argostranslate`. Tốc độ inference CTranslate2 đang dẫn đầu thị trường Open Source Python (nhờ quantization INT8) so với HuggingFace Transformers.

## 2. Text-to-Speech (TTS)
- **Offline**: `piper-tts`. Giải pháp TTS cục bộ tốt nhất hiện nay (Sử dụng ONNX model, chạy bằng C++ binding) cực nhanh và không yêu cầu VRAM GPU cao như VITS.

## 3. Computer Vision (Nhận diện Hardsub OCR)
- Dựa trên benchmark: **PaddleOCR** vượt trội về tốc độ chuẩn hóa (dưới 1s/frame nhờ lightweight models) và thời gian load cold-start CPU (8-12s, so với EasyOCR 15-20s). Do đó, quay lại chọn **PaddleOCR** thay vì lời khuyên cũ (EasyOCR) nhưng cần chú ý phân phối file pre-trained qua script tải riêng để giảm dung lượng file Cài đặt gốc.

## 4. Audio FX & Xử Lý Video (FFmpeg)
- **BGM Ducking (Hạ nhạc nền khi có tiếng nói)**: Tuyệt đối không dùng thư viện phụ (`pydub`). Sử dụng Native FFmpeg Audio Filter: `sidechaincompress`.
- Cách thức: Truyền Track TTS làm `sidechain`, Track BGM làm luồng chính. Khi TTS phát ra tín hiệu vượt `threshold` (vd: -25dB), nhạc nền tự động giảm theo `ratio` (4:1).
