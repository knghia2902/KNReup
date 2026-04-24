# Testing Strategy - KNReup

Hiện tại, dự án đang trong giai đoạn phát triển tích cực, chiến lược kiểm thử tập trung vào kiểm thử thủ công và đang dần xây dựng hệ thống tự động.

## 1. Các cấp độ kiểm thử

### A. Manual Testing (Kiểm thử thủ công) - Ưu tiên hiện tại
- **Quy trình:** Sau mỗi tính năng mới, thực hiện chạy ứng dụng qua `npm run dev` và `python run_dev.py`.
- **Các kịch bản chính:**
  - Kéo thả video vào timeline.
  - Chạy ASR và kiểm tra độ chính xác phụ đề.
  - Thay đổi giọng nói TTS và nghe thử.
  - Tải video từ YouTube/Douyin.

### B. Unit Testing (Kiểm thử đơn vị)
- **Backend (Python):** 
  - Công cụ: `pytest`.
  - Mục tiêu: Kiểm tra các logic trong `engines` (ASR parsing, Translation logic).
  - Trạng thái: Đang trong quá trình xây dựng (dấu vết `.pytest_cache` đã hiện diện).
- **Frontend (React):**
  - Công cụ (Đề xuất): `Vitest` hoặc `Jest`.
  - Mục tiêu: Kiểm tra các hàm utils, store logic.

### C. Integration Testing (Kiểm thử tích hợp)
- Kiểm tra luồng giao tiếp giữa Frontend và Sidecar qua HTTP.
- Kiểm tra tính đúng đắn khi spawn sidecar từ Tauri core.

## 2. Công cụ hỗ trợ
- **FastAPI Docs:** Truy cập `/docs` của sidecar để test các API endpoint một cách độc lập.
- **Logs:** Kiểm tra `python-sidecar/logs/` để debug các lỗi engine ngầm.
- **Browser DevTools:** Kiểm tra network và console log của Tauri app (chuột phải -> Inspect).

## 3. Kế hoạch tương lai
- Thiết lập CI/CD (GitHub Actions) để chạy linting và test tự động.
- Bổ sung bộ test suite cho `python-sidecar/app/engines/` để đảm bảo không lỗi khi cập nhật các thư viện AI.
- Thêm E2E testing (ví dụ: Playwright) để kiểm tra luồng người dùng hoàn chỉnh.
