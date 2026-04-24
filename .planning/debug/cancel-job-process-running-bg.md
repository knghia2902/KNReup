---
status: resolved
trigger: "kiểm tra phần cancel job. GPU vẫn chạy full mặc dù đã cancel, đợi một lúc thấy log có ouput luôn. Vậy là chưa cancel"
updated: 2026-04-24
---

# Symptoms
- **Expected behavior:** Khi render video và bấm cancel (nút X), tiến trình phải bị dừng hoàn toàn và giải phóng GPU.
- **Actual behavior:** Bấm cancel nhưng tiến trình vẫn chạy ngầm, GPU vẫn chạy full và log vẫn ra output.
- **Error messages:** Không có error message.
- **Timeline:** Mới phát hiện sau khi kiểm tra Task Manager.
- **Reproduction:** Render video, sau đó bấm nút X trên JobMonitor để cancel.

# Current Focus
- **hypothesis:** Nút cancel trên UI gọi sự kiện `onCancel` nhưng không thực sự kill process chạy ngầm (backend/sidecar) hoặc thiếu logic gửi tín hiệu abort xuống python-sidecar.
- **next_action:** issue resolved

# Resolution
- **Root Cause:** Khi gọi `cancelPipeline` ở frontend, hàm `abortController.abort()` được gọi ngay lập tức mà không chờ `fetch("/api/pipeline/cancel")` hoàn thành. Do đó kết nối SSE bị đóng ngay lập tức. Fastapi bắt được ngoại lệ CancelledError và chạy vào `finally` để huỷ bỏ `pr._active_runner = None` trước khi tín hiệu `/cancel` được server xử lý. Khi request `/cancel` tới nơi, `_active_runner` đã là None nên lệnh gọi `.cancel()` bị bỏ qua, dẫn tới việc tiến trình chạy ngầm không bị huỷ. Thêm vào đó, `run_render` ở backend không tự động gọi `self.cancel()` trong block `finally` của chính nó khi generator bị huỷ bởi FastAPI.
- **Fix:**
  1. Thêm `await fetch(...)` trong `src/hooks/usePipeline.ts` ở hàm `cancelPipeline` để đảm bảo tín hiệu cancel được gửi thành công đến backend trước khi đóng connection của giao diện.
  2. Gọi phương thức `self.cancel()` vào khối `finally` của hàm `run_render` trong `python-sidecar/app/pipeline_runner.py` để đảm bảo GPU, TTS tasks và ffmpeg subprocess luôn được dọn dẹp cẩn thận dù cho connection có bị ngắt đột ngột thế nào đi chăng nữa.