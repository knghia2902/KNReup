## ROOT CAUSE FOUND

**Debug Session:** .planning/debug/backend-connection.md

**Root Cause:** Uvicorn with `reload=True` exits prematurely on this specific Windows terminal environment, causing the server to shut down immediately after `Application startup complete`. This leads to the frontend throwing `ERR_CONNECTION_REFUSED` when polling for health.

**Evidence Summary:**
- Python terminal logs show `INFO: Shutting down` immediately after startup without any application errors.
- Previous logs show `asyncio.exceptions.CancelledError` which confirms the Uvicorn event loop was forcefully interrupted (often by the watchfiles reloader bug on Windows or accidental termination).
- React frontend console logs confirm `ERR_CONNECTION_REFUSED` exactly on port 8008.

**Files Involved:**
- `python-sidecar/run_dev.py`: Configurations for Uvicorn runner.

**Suggested Fix Direction:** Change `reload=True` to `reload=False` in `run_dev.py` for a more stable dev server environment on Windows. (Note: This fix has already been applied locally to allow immediate testing).

**Cập nhật phụ (Lỗi Errno 10048 / Kẹt cổng 8008):**
- Khi file `run_dev.py` được lưu lại, WatchFiles trigger reload Uvicorn. Trong môi trường Windows, tiến trình con thường không được tự động giải phóng sạch (hoặc bị ngắt đột ngột), sinh ra một tiến trình Python "mồ côi" (orphaned process) vẫn đang chạy ngầm và giữ cổng 8008.
- Các lệnh chạy `python run_dev.py` tiếp theo sẽ thất bại với `[Errno 10048]`. Cách sửa là buộc thoát tiến trình đang giữ cổng 8008.
