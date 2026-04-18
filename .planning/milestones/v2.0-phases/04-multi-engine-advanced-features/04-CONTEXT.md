# Phase 4 Context: Multi-Engine + Advanced Features

## 1. Auto-Fallback & Key Rotation (Circuit Breaker)
*Decision: Priority on completing the pipeline.*
- **Level 1 (Key Rotation)**: Khi API lỗi (rate limit, timeout), hệ thống ưu tiên xoay vòng (round-robin) sang API Key tiếp theo của **cùng một engine** để giữ nguyên giọng văn.
- **Level 2 (Engine Fallback)**: Nếu tất cả các Key của Engine hiện tại đều lỗi, hệ thống tự động fallback sang Engine số 2 (cùng loại) và tiếp tục dịch/gen TTS từ câu bị lỗi trở đi.
- **UX**: Chấp nhận sự lệch giọng văn nếu fallback xảy ra giữa chừng để đảm bảo render thành công. Ứng dụng sẽ hiển thị cảnh báo (Toast hoặc Warning Badge) cho user biết hệ thống đã tự động kích hoạt fallback.

## 2. Audio FX Pipeline
*Decision: Toàn cục và Preview 10s.*
- **Scope**: Các hiệu ứng Audio FX (pitch, speed, EQ...) được áp dụng **toàn cục (Master Track)** cho bản audio TTS sau khi đã merge các segments lại.
- **Preview UX**: Giao diện có một nút "Nghe thử FX". Khi nhấn, hệ thống sẽ render nhanh một đoạn âm thanh ngắn (khoảng 10 giây đầu) qua mô hình pipeline thực để user nghe thử; thay vì cố gắng mô phỏng real-time playback bằng Web Audio API trên UI. Điều này đảm bảo UI và Render ra trùng khớp 100%.

## 3. Batch Processing & Job Queue UI
*Decision: Tích hợp vào Properties Panel.*
- **Vị trí**: Hàng đợi Render (Job Queue) sẽ nằm trong một **Tab riêng của Properties Panel** (ví dụ Tab `QUEUE` nằm cạnh `STYLE`, `TTS`, `SUB`, `OUT`), không dùng popup popup rời rạc.
- **Xử lý lỗi**: Các item lỗi trong danh sách queue sẽ chờ user xử lý chứ không dừng cả danh sách.

## 4. Pipeline Resume / Cancel
*Decision: Hỗ trợ Resume bằng cache.*
- **Cơ chế Cache**: Thay vì xóa sạch dữ liệu khi user ấn Cancel/Pause ở bước Analyze hay Render, hệ thống sẽ lưu cache các data đã call API (Translate, TTS sinh ra tới đâu lưu tới đó).
- **Resume Flow**: Khi chạy lại job, hệ thống đọc lại cache và skip gọi lại API cho các segments đã hoàn thành giúp tiết kiệm thời gian và cost API.
- **Cleanup**: Tính năng sẽ kèm theo khả năng "Clear Cache" nếu thư mục tạm (Temp Directory) phình quá to, và tự động thu dọn sau 7 ngày.

## Code Context
- **Translation Engines**: Hiện đã có `app/engines/translation/` (DeepSeek, Gemini, DeepL, Ollama, NLLB, Offline). Xây circuit breaker cần bọc ngoại lệ hoặc tạo Proxy Class.
- **TTS Engines**: Đang ở `app/engines/tts/` (EdgeTTS, Piper).
- **Pipeline Runner**: Orchestrate chính thực hiện ở `app/pipeline_runner.py` (chức năng `run_analyze` và `run_render`). Đây là nơi cần cắm check state resume/cache vào.
- **Properties Panel**: `src/components/editor/PropertiesPanel.tsx` sẽ cần mở rộng thêm các tab hoặc tích hợp thêm tab `Queue`.
