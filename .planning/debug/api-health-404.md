---
status: resolved
trigger: "Lỗi 'GET http://127.0.0.1:8008/api/health 404 (Not Found)'"
created: 2026-04-21T23:00:00+07:00
updated: 2026-04-21T23:15:00+07:00
---

# Debug Session: api-health-404

## Symptoms
- **Expected**: `http://127.0.0.1:8008/api/health` trả về 200 OK.
- **Actual**: Trả về 404 Not Found.
- **Error messages**: `GET http://127.0.0.1:8008/api/health 404 (Not Found)`
- **Timeline**: Phát hiện khi chạy frontend và kết nối tới sidecar.
- **Reproduction**: Chạy `python python-sidecar/run_dev.py` và truy cập endpoint `http://127.0.0.1:8008/api/health`.

## Current Focus
- hypothesis: Các route `health` và `system` thiếu prefix `/api` trong code backend (FastAPI).
- test: Kiểm tra `python-sidecar/app/main.py` và các file route tương ứng.
- expecting: Các router phải có prefix `/api` để khớp với yêu cầu từ frontend.
- next_action: "verify fix and close session"

## Evidence
- timestamp: 2026-04-21T23:10:00+07:00
  observation: File `python-sidecar/app/routes/health.py` và `python-sidecar/app/routes/system.py` định nghĩa router mà không có prefix.
- timestamp: 2026-04-21T23:12:00+07:00
  observation: File `python-sidecar/app/main.py` đăng ký các router này mà không thêm prefix `/api`.
- timestamp: 2026-04-21T23:14:00+07:00
  action: Đã cập nhật `health.py` và `system.py` để thêm `prefix="/api"` vào `APIRouter`.

## Eliminated
- Network/Firewall issues: Lỗi 404 cho thấy server đã nhận được request nhưng không tìm thấy path.

## Resolution
- root_cause: Endpoint `health` và `system` được định nghĩa thiếu prefix `/api` trong khi frontend mặc định gọi qua `/api/*`.
- fix: Thêm `prefix="/api"` vào `APIRouter` trong `app/routes/health.py` và `app/routes/system.py`.
- specialist_hint: python
