"""
KNReup Python Sidecar — FastAPI Backend
Chạy như local HTTP server, giao tiếp với Tauri frontend qua HTTP/JSON.
"""
import socket
import sys
import os
import uvicorn
import logging
import warnings
from app.logger_setup import setup_logging

# Khởi tạo cấu hình logging để xuất ra file
setup_logging()

# Silence warnings from stanza/argostranslate
warnings.filterwarnings("ignore", message=".*expects mwt.*")
warnings.filterwarnings("ignore", message=".*mwt.*")
warnings.filterwarnings("ignore", message=".*stanza.*")

# 3. FutureWarning from pynvml (if still present)
warnings.filterwarnings("ignore", category=FutureWarning, module="pynvml")

# Giới hạn số luồng CPU ở mức vừa phải (8 luồng)
os.environ["OMP_NUM_THREADS"] = "8"
os.environ["MKL_NUM_THREADS"] = "8"
os.environ["OPENBLAS_NUM_THREADS"] = "8"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, system, pipeline, subtitles, proxy
from app.routes.downloader import router as downloader_router

app = FastAPI(title="KNReup Sidecar")

# CORS middleware — Cấu hình chuẩn cho Tauri
# Hỗ trợ cả localhost và tauri://localhost (macOS/Linux)
allowed_origins = [
    "http://localhost:1420",
    "http://127.0.0.1:1420",
    "tauri://localhost",
    "http://tauri.localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Fallback cho allow_origins=["*"] nếu origin không nằm trong danh sách
# Nhưng FastAPI CORSMiddleware không hỗ trợ cả * và allow_credentials=True đồng thời.
# Vì vậy ta liệt kê các origin phổ biến của Tauri.

# Đăng ký routes với prefix /api thống nhất
app.include_router(health.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(subtitles.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")

from app.routes import tts_profiles
from app.routes import projects
from app.routes import face_crop
app.include_router(tts_profiles.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(downloader_router, prefix="/api")
app.include_router(face_crop.router, prefix="/api", tags=["Smart Crop"])

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

if __name__ == "__main__":
    # Load port từ args hoặc env hoặc tự tìm
    port = 8008
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    
    print(f"Sidecar starting on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info", access_log=False)
