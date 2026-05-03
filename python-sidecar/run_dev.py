"""Dev runner — chạy FastAPI trên port 8008 với hot-reload."""
import uvicorn
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8008,
        reload=False,
        loop="asyncio",
        log_level="info", # Đổi từ warning sang info để debug proxy và các lỗi đọc file
        access_log=False
    )
