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
    # Add a global exception handler to suppress WinError 10054 (ConnectionResetError)
    # This is a known issue with Windows ProactorEventLoop when clients disconnect abruptly
    def _handle_asyncio_exception(loop, context):
        msg = context.get("exception", context.get("message"))
        if isinstance(msg, ConnectionResetError) and msg.winerror == 10054:
            return # Suppress
        loop.default_exception_handler(context)

    # Set it before running uvicorn
    loop = asyncio.get_event_loop()
    loop.set_exception_handler(_handle_asyncio_exception)

    # Load port từ args hoặc env hoặc tự tìm
    port = 8008
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    
    print(f"Sidecar starting on port {port}")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=port,
        reload=False,
        loop="asyncio",
        log_level="info", # Đổi từ warning sang info để debug proxy và các lỗi đọc file
        access_log=False
    )
