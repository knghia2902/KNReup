# Phase 1: Foundation — Research

**Researched:** 2026-03-23
**Status:** Complete

## Stack Recommendation

### Frontend: Tauri 2.0 + React + TypeScript + Vite

| Component | Version | Ghi chú |
|-----------|---------|---------|
| **Tauri** | 2.x (stable Oct 2024) | Desktop framework, Rust core |
| **React** | 18.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 6.x | Build tool, HMR |
| **@tauri-apps/plugin-shell** | latest | Sidecar management |

**Tạo project:**
```bash
npx -y create-tauri-app@latest ./ --template react-ts --manager npm
```

### Backend Sidecar: Python FastAPI

| Component | Version | Ghi chú |
|-----------|---------|---------|
| **Python** | 3.10+ | Runtime |
| **FastAPI** | 0.115+ | API framework |
| **Uvicorn** | 0.34+ | ASGI server |
| **PyInstaller** | 6.x | Compile thành .exe cho production |

**Cấu trúc sidecar:**
```
python-sidecar/
├── app/
│   ├── main.py          # FastAPI entry point
│   ├── routes/          # API endpoints
│   └── utils/           # Helpers
├── requirements.txt
└── build.py             # PyInstaller build script
```

## Sidecar Bridge Architecture

### Communication Flow
```
Tauri (Rust) ──spawn──> Python sidecar (.exe)
                              │
                         FastAPI server
                        (localhost:{auto-port})
                              │
React (JS) ──HTTP/JSON──> FastAPI endpoints
React (JS) <──SSE────── FastAPI streaming
```

### Auto-Port Detection
```python
# python-sidecar/app/main.py
import socket

def find_free_port():
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]
```

Sidecar prints port to stdout → Tauri reads stdout → frontend gets port.

### Tauri Config
```json
// src-tauri/tauri.conf.json
{
  "bundle": {
    "externalBin": ["binaries/python-sidecar"]
  }
}
```

```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "shell:allow-spawn",
    "shell:allow-execute"
  ]
}
```

### Sidecar Lifecycle
1. Tauri app starts → spawn sidecar process
2. Sidecar finds free port → prints port to stdout
3. Tauri reads port → passes to frontend
4. Frontend makes HTTP requests to `localhost:{port}`
5. App closes → Tauri kills sidecar process

## First-Run Dependency Checker

### Tham khảo VideoTransAI
VideoTransAI hiển thị trạng thái backend khi khởi động:
- GPU / CPU mode
- Whisper backend (available/missing)
- Demucs backend (available/missing)
- Video encoder (NVENC vs libx264)

### Cần detect
| Dependency | Check method | Required for |
|-----------|-------------|-------------|
| Python 3.10+ | `python --version` | Sidecar (dev mode) |
| FFmpeg | `ffmpeg -version` | Video processing |
| CUDA (NVIDIA GPU) | `nvidia-smi` / check DLL | GPU acceleration |
| CUDA version | cublas64_12.dll vs 11 | Float16 vs Float32 |

### Khi chạy production (PyInstaller build)
- Python đã bundled trong .exe → không cần detect
- FFmpeg sẽ bundled trong `tools/ffmpeg/`
- Chỉ cần detect CUDA/GPU

## taste-skill Integration

### Cài đặt
```bash
npx skills add https://github.com/Leonxlnx/taste-skill
```

### Settings phù hợp cho NLE editor
- **DESIGN_VARIANCE:** 5-6 (modern nhưng functional cho editor)
- **MOTION_INTENSITY:** 4-5 (smooth, không gây rối khi edit)
- **VISUAL_DENSITY:** 7-8 (dense dashboard phù hợp NLE)

### Design tokens cần thiết
- Dark theme mặc định (NLE editors luôn dark)
- Glassmorphism cho panels
- CSS custom properties cho theming
- Google Fonts: Inter (primary), monospace cho terminal log

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Tauri 2.0 learning curve | Có nhiều template/example sẵn |
| Sidecar orphan process | Handle app close event → kill child process |
| Port conflict | Auto-port detection (bind port 0) |
| PyInstaller build size | Lazy import, exclude unused modules |
| taste-skill compatibility | Test sớm trong Phase 1 |

## RESEARCH COMPLETE
