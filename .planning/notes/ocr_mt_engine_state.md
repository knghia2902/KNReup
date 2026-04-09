# Ghi Chú Trạng Thái: Động Cơ OCR & Dịch Thuật Offline (09/04/2026)

Tài liệu này lưu lại tình trạng kỹ thuật của các bộ máy OCR và Dịch Thuật nội bộ trước khi chuyển hướng sang tập trung Thiết Kế Lại UI (Phase 6).

## 1. Hệ Thống Dịch Thuật (Machine Translation)
- **NLLB (Meta):**
  - Đã tích hợp thành công CTranslate2 với repo `JustFrederik/nllb-200-distilled-600M-ct2-int8` (Public, Int8 Optimize). Đã chèn mã tiêm NVIDIA DLL ảo `_inject_nvidia_dll_paths()` gỡ lỗi CUDA `cublas64_12.dll`.
  - Nếu bản 600M chất lượng không chuẩn, tương lai nâng cấp sang `michaelfeil/ct2fast-nllb-200-1.3B` hoặc `3.3B` (yêu cầu >5GB VRAM).
- **Helsinki-NLP OPUS-MT (zh-vi):**
  - Đã xây dựng Module `opus_engine.py` và đưa vào App.
  - SOTA của dòng siêu nhẹ (~300MB). Chuyên trị dịch trực tiếp Trung-Việt qua tệp phụ đề OpenSubtitles (ngôn ngữ rất mượt, tốc độ nhanh nhất).
- **Qwen 2.5:1.5B (Local LLM qua Ollama):**
  - Kế hoạch sử dụng Model thu nhỏ của Alibaba để giữ được "chuẩn" hành văn mxh Trung. 
  - **Tồn đọng:** Window máy tính chưa thiết lập PATH/Env cho `ollama.exe`. User Cần cài đặt độc lập Ollama và gõ lệnh `ollama run qwen2.5:1.5b` ở Terminal ngoài trước khi Test lại trên App.

## 2. Trích Xuất Luồng Sub Cứng (OCR)
- **Vấn Đề EasyOCR Lỗi Thời:**
  - EasyOCR nhận sai định dạng và sai nét khi người dùng Crop quá hẹp (mất 20px lề của chữ g, p, y) hoặc dính Watermark/Hình nền động. Font tiếng Anh đôi khi bị nhầm sang Pinyin của Trung.
- **Giải Pháp Nâng Cấp:**
  - Đã chuyển đổi sang `RapidOCR` (Bản Port ONNX của PaddleOCR v4 - SOTA từ hãng Baidu).
  - Tích hợp thêm viền Crop tự động: `pad=10`.
  - Cài đặt `onnxruntime-gpu` trong `requirements.txt` để ép xử lý song song trên Card Màn Hình. Giữ cho tiến trình chạy Native, tốc độ phân tích và tách dòng cực kỳ ổn định.

## 3. Bước Tiếp Theo (Sau khi Refactor UI)
- [ ] Chỉnh thiết kế khung Crop OCR (UI) tiện dụng hơn, tích hợp Box-Preview để người dùng thấy rõ hình ảnh thực tế sẽ gửi xuống Python Engine (tránh crop lỗi, sát mí).
- [ ] Tích hợp tính năng Select Source Language Native cho OCR (Anh / Trung) hoặc bật cơ chế tự động xoay Model trong RapidOCR.
- [ ] Hoàn thiện giao diện chọn Option Dịch Thuật có hiển thị báo loading (để User biết Model HuggingFace đang được tải ngầm về 캐시).
