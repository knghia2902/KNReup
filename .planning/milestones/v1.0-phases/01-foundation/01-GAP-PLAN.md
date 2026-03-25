---
wave: 1
depends_on: []
files_modified:
  - python-sidecar/run_dev.py
autonomous: true
---

# Phase 1: Foundation - Gap Closure Plan

## Mở đầu
Bản kế hoạch sửa đổi này (Gap Closure Plan) nhằm khắc phục lỗi tìm thấy trong quá trình kiểm duyệt UAT của Phase 1:
- Lỗi kết nối Frontend-Backend (Test 5) gặp sự cố `ERR_CONNECTION_REFUSED`.
- Nguyên nhân lõi (Root cause): Cờ `reload=True` của Uvicorn gây ra hiện tượng tự thoát sớm trên môi trường Windows này.

## Goal
Sửa lỗi kết nối backend bằng cách tắt tính năng hot-reload của uvicorn.

## Tasks

### 1. Tắt tính năng Uvicorn Hot Reload
<read_first>
- python-sidecar/run_dev.py
- .planning/debug/backend-connection.md
</read_first>

<action>
Trong file `python-sidecar/run_dev.py`, sửa cấu hình hệ thống từ `reload=True` thành `reload=False`.

Cụ thể:
```python
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8008,
        reload=False,
        log_level="info"
    )
```
*(Lưu ý: Tôi đã thực hiện sửa lỗi này ở bước gỡ lỗi nên bước này sẽ đóng vai trò xác nhận và hoàn thiện nốt quy trình Phase)*
</action>

<acceptance_criteria>
- `python-sidecar/run_dev.py` chứa mã chữ `reload=False`
</acceptance_criteria>

## Verification
- Chạy `python run_dev.py` và kiểm tra server chạy ổn định (không tự Shutting down).
- Chạy `npm run tauri dev` và kiểm tra thanh Header hiển thị "Backend connected".

## must_haves
- Server backend không tự thoát ngay sau startup
- Các API endpoints phải hoạt động ổn định trên frontend
