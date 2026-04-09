---
created: 2026-04-09T10:04:19.700Z
title: Fix OCR accuracy and translation engine pipeline
area: engine
files:
  - python-sidecar/app/engines/ocr_extractor.py
  - python-sidecar/app/engines/translation/nllb_engine.py
  - python-sidecar/app/engines/translation/opus_engine.py
  - python-sidecar/app/pipeline_runner.py
  - python-sidecar/requirements.txt
  - .planning/notes/ocr_mt_engine_state.md
---

## Problem

### OCR (Trích xuất chữ cứng trên Video)
- **EasyOCR** nhận diện nét ký tự kém: chữ `young` bị đọc thành `bunoh`, `was a` thành `wQS Q`. Nguyên nhân gốc: (1) Người dùng crop khung quá sát mí dưới cắt đứt chân chữ g/y/p, (2) Bộ từ điển Trung+Anh đồng thời gây nhầm lẫn nét Latin sang nét Hán.
- **RapidOCR** (PaddleOCR v4 ONNX) đã được tích hợp thay thế, cài thêm `onnxruntime-gpu` để chạy trên Card NVIDIA. Cần test lại trên nhiều loại video (Trung/Anh/Hỗn hợp) để đánh giá chất lượng thực tế.
- Padding tự động 10px đã được thêm vào vùng crop.

### Translation (Dịch thuật Offline)
- **NLLB 600M (CTranslate2):** Đã tích hợp, model tải thành công nhưng chất lượng dịch bản 600M không cao. Cần thử bản 1.3B hoặc 3.3B nếu máy đủ VRAM.
- **Helsinki OPUS-MT (zh-vi):** Đã tích hợp `opus_engine.py`. Siêu nhẹ (~300MB), dịch trực tiếp Trung→Việt, huấn luyện trên OpenSubtitles. Cần test thực tế.
- **Argos Translate:** Vẫn hoạt động nhưng dịch bắc cầu (Trung→Anh→Việt) nên chất lượng kém.
- **Qwen 2.5:1.5B (Ollama):** Chưa cài được do máy thiếu Ollama trên PATH. User cần tự cài Ollama.

## Solution

1. **OCR:** Test RapidOCR trên 3-5 video mẫu (Trung / Anh / hỗn hợp). Nếu vẫn kém, xem xét tích hợp Surya OCR hoặc TrOCR (Microsoft) chuyên biệt hơn.
2. **Translation:** So sánh kết quả dịch giữa OPUS-MT, NLLB-1.3B và Qwen 1.5B trên cùng dataset. Chọn engine mặc định tốt nhất.
3. **UI:** Thêm dropdown chọn ngôn ngữ nguồn (auto/zh/en/ja/ko) cho OCR. Hiển thị progress bar khi tải model lần đầu.
4. **Xem chi tiết:** `.planning/notes/ocr_mt_engine_state.md`
