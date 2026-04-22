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

# Tắt các cảnh báo không cần thiết từ thư viện bên thứ 3
# 1. urllib3/requests dependency warning
from urllib3.exceptions import DependencyWarning
warnings.filterwarnings("ignore", category=DependencyWarning)

# 2. Stanza/Argos mwt warning
# Silence loggers broadlly
for logger_name in ["stanza", "argostranslate", "argos-translate"]:
    l = logging.getLogger(logger_name)
    l.setLevel(logging.ERROR)
    l.propagate = False

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
from app.routes import health, system, pipeline, subtitles, proxy, tts_profiles
from app.routes.downloader import router as downloader_router

app = FastAPI(title="KNReup Sidecar")

# CORS middleware — Cấu hình chuẩn cho Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Đăng ký routes với prefix /api thống nhất
app.include_router(health.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(subtitles.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")
app.include_router(tts_profiles.router, prefix="/api")
app.include_router(downloader_router, prefix="/api")

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
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
