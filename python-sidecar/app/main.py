"""
KNReup Python Sidecar — FastAPI Backend
Chạy như local HTTP server, giao tiếp với Tauri frontend qua HTTP/JSON.
"""
import socket
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, system, pipeline, subtitles
from app.routes.downloader import router as downloader_router


def find_free_port() -> int:
    """Tìm port trống để chạy FastAPI server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


app = FastAPI(
    title="KNReup Sidecar",
    description="Backend sidecar cho KNReup — lồng tiếng video AI",
    version="0.1.0"
)

# CORS — cho phép frontend Tauri gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(pipeline.router)
app.include_router(subtitles.router)
app.include_router(downloader_router)


@app.on_event("startup")
async def startup_download_db():
    """Initialize download database on startup."""
    from app.engines.downloader.database import init_db
    await init_db()


if __name__ == "__main__":
    port = find_free_port()
    # In port ra stdout — Tauri sẽ đọc dòng này
    print(f"PORT:{port}", flush=True)
    sys.stdout.flush()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
