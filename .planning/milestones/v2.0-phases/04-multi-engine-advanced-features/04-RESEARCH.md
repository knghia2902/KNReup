# Phase 4 Research: Multi-Engine + Advanced Features

## Objective
Xác định cách thức implement các tính năng mở rộng của Phase 4: Multi-Engine, Circuit Breaker, Audio FX, Batch Processing và Resume Pipeline.

## 1. Hệ thống Multi-Engine & Circuit Breaker
**Hiện trạng:**
- `TranslationEngine` (app/engines/base.py) và các lớp con (như `DeepSeekTranslation`) đã có sẵn hàm `_retry_with_backoff()`. Tuy nhiên, logic này chỉ giới hạn trong phạm vi 1 API key và 1 engine.

**Giải pháp đề xuất (Circuit Breaker & Fallback):**
- **Cấu trúc dữ liệu Keys**: Truyền vào API key dưới dạng List thay vì String, hoặc quản lý trong 1 `KeyManager` class.
- **Level 1 (Key Rotation)**: Sửa đổi `_retry_with_backoff` hoặc xây dựng một wrapper decorator để khi gặp lỗi `429 Too Many Requests`, hệ thống tự đổi sang API key tiếp theo trong danh sách.
- **Level 2 (Engine Fallback)**: Tại `app.routes.pipeline`, hàm `get_translation_engine` cần được gọi lại với engine dự phòng nếu engine chính throw exception sau khi cạn kiệt số lần thử và số lượng key.
- Quản lý State: Để fallback liền mạch, pipeline runner (`run_analyze`) cần track pointer của segment hiện tại và gọi API Engine số 2 từ vị trí lỗi trở đi.

## 2. Audio FX Pipeline (FFmpeg Master Track)
**Hiện trạng:**
- Có hàm `_merge_tts_audio` trong `pipeline_runner.py` sử dụng chuẩn `adelay` và `amix` để mix audio.

**Giải pháp đề xuất:**
- **Pipeline chạy Audio FX**: Thêm các filter FFmpeg vào chuỗi `filter_complex_script` sau node `[out]` của `amix`.
- Các filter cụ thể:
  - `speed`: Dùng `atempo=1.5` (hoặc nhân chéo nếu speed vượt ngưỡng giới hạn của atempo).
  - `pitch`: Dùng `rubberband=pitch=1.2` (nếu FFmpeg build có rubberband) hoặc `asetrate` kết hợp `atempo`.
  - `EQ/Loudness`: Dùng `equalizer`, `highpass`, `lowpass`, `loudnorm`.
- **Preview 10s**: Tạo một endpoint `/api/preview-audio-fx` nhận payload (mix audio 10s đầu hoặc 1 segment TTS) và apply filter chain này, trả về link file `.wav`/`.mp3` để Frontend phát qua `<audio>` element.

## 3. Batch Processing & Export Queue
**Hiện trạng Frontend:**
- Frontend chưa có khái niệm Job Queue (chỉ đang render 1 video tại một thời điểm).

**Giải pháp đề xuất:**
- **State Management**: Tạo một Zustand store `useQueueStore` lưu danh sách các Jobs (`id, video_path, status, progress`).
- **UI Tab**: Bổ sung tab `OUT` / `QUEUE` trong Properties Panel. Render list các Job đang chờ và báo tiến trình realtime qua SSE.
- **Backend Queue**: Backend dùng `asyncio.Queue` kết hợp với worker task (background task) bắt các request render, thực hiện tuần tự.

## 4. Pipeline Resume / Caching
**Hiện trạng:**
- File tạm sinh ra tại `tempfile.mkdtemp(prefix="knreup_")`. Mất đi hoặc khó tracking sau khi crash/cancel.

**Giải pháp đề xuất:**
- Chuyển thư mục lưu trữ tạm vào một folder cố định như `.knreup_workdir/{video_hash}/`.
- Mỗi lần hoàn thành nhận diện (ASR) hoặc translate xong 1 batch, dump ra `state.json`.
- Khi `run_analyze` bắt đầu, check sự tồn tại của `state.json`. Nếu có và User chọn "Resume", load segments từ JSON thay vì gọi lại Whisper API hay AI Translation API.
- Logic tương tự cho TTS module (chỉ gen file TTS `.mp3` nếu file đó chưa tồn tại trong workdir).

## References
- `app/pipeline_runner.py`
- FFmpeg Audio Filters Documentation

## Validation Architecture
- Unit tests cho hàm `_build_prompt` và `CircuitBreaker`.
- Integration test mô phỏng API 429 để kiểm tra cơ chế fallback hoạt động đúng.
- Kịch bản UAT: Gen video với 2 API engines (cố tình nhập API key sai cho engine 1).
