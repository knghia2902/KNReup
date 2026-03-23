# STRUCTURE.md — Cấu trúc thư mục

## Tổng quan

```
d:\Tools\VideoTransAI\
├── VideoTransAI.exe           # Launcher (tier 1) — ~4.5MB
├── bootstrap_launcher.log     # Log launcher
├── _internal/                 # Dependencies cho launcher
│   ├── assets/
│   │   └── videotrans_icon.ico
│   ├── webview/               # pywebview library
│   ├── pythonnet/             # .NET CLR interop
│   └── ... (DLLs, .pyd modules)
│
└── runtime/
    └── VideoTransAI/          # Runtime (tier 2)
        ├── VideoTransAI.exe   # Runtime exe — ~37MB
        ├── bootstrap_runtime.json   # Version: 1.1.38
        ├── flask_out_debug.log      # Flask server log
        ├── uploads/           # Video được user upload
        ├── outputs/           # Video đã xử lý xong
        ├── tract/             # [Chưa rõ mục đích]
        │
        └── _internal/         # Runtime dependencies
            ├── services/      # ★ Backend services (Cython compiled)
            │   ├── audio_service.cp310-win_amd64.pyd
            │   ├── translate_service.cp310-win_amd64.pyd
            │   ├── tts_service.cp310-win_amd64.pyd
            │   └── whisper_service.cp310-win_amd64.pyd
            │
            ├── static/        # ★ Frontend source code
            │   ├── index.html         # Trang chính (527 lines)
            │   ├── login.html         # Đăng nhập
            │   ├── register.html      # Đăng ký
            │   ├── plans.html         # Gói dịch vụ/thanh toán
            │   ├── process.html       # Xem tiến trình xử lý
            │   ├── css/
            │   │   └── style.css      # CSS chính (40KB)
            │   └── js/
            │       ├── main.js        # Logic chính (2056 lines, 78KB)
            │       ├── process.js     # Logic trang process (263 lines)
            │       └── updater.js     # Auto-update UI (208 lines)
            │
            ├── assets/
            │   └── videotrans_icon.ico
            │
            ├── TTSDemo/       # Piper TTS engine
            │   ├── piper.exe
            │   ├── vi_VN-vais1000-medium.onnx  # Model tiếng Việt (~60MB)
            │   ├── vi_VN-vais1000-medium.json   # Config model
            │   ├── espeak-ng.dll
            │   ├── espeak-ng-data/
            │   ├── tts-model/
            │   └── onnxruntime*.dll
            │
            ├── voice_simple/  # Sample voice files
            │   ├── adam.mp3
            │   ├── cdteam.mp3
            │   ├── cobehoatngon.mp3
            │   └── ngochuyen.mp3
            │
            ├── ffmpeg/        # FFmpeg binaries
            ├── whisper/       # Whisper model files
            ├── demucs/        # Demucs model/code
            ├── torch/         # PyTorch runtime
            ├── torchaudio/    # Audio processing
            └── ... (nhiều packages khác)
```

## File quan trọng

### Frontend (có thể chỉnh sửa trực tiếp)
| File | Dòng | Mô tả |
|---|---|---|
| `static/index.html` | 527 | Trang chính: upload, queue, video config modal, result viewer |
| `static/js/main.js` | 2056 | Logic: auth, queue management, modal, preview, SSE, blur, logo |
| `static/js/process.js` | 263 | Trang xem tiến trình: SSE listener, progress UI, result display |
| `static/js/updater.js` | 208 | Auto-update: check version, download & apply update |
| `static/css/style.css` | — | Dark theme CSS, glassmorphism, responsive layout |
| `static/login.html` | 160 | Form đăng nhập |
| `static/register.html` | — | Form đăng ký |
| `static/plans.html` | 365 | Trang gói dịch vụ, thanh toán Pay2S |

### Backend (compiled, không chỉnh sửa trực tiếp)
| File | Mô tả |
|---|---|
| `services/whisper_service.cp310-win_amd64.pyd` | Service nhận diện giọng nói |
| `services/translate_service.cp310-win_amd64.pyd` | Service dịch thuật (DeepSeek) |
| `services/tts_service.cp310-win_amd64.pyd` | Service tạo giọng đọc AI |
| `services/audio_service.cp310-win_amd64.pyd` | Service xử lý audio/video (FFmpeg) |

### Config & Data
| File | Mô tả |
|---|---|
| `bootstrap_runtime.json` | Version, install date, manifest URL |
| `flask_out_debug.log` | Log Flask server |
| `uploads/` | Thư mục chứa video upload |
| `outputs/` | Thư mục chứa video đã xử lý |

## Naming Conventions

- **HTML pages**: lowercase, dấu gạch ngang (`login.html`, `plans.html`)
- **JS files**: lowercase, chức năng (`main.js`, `process.js`, `updater.js`)
- **Cython modules**: `{name}.cp310-win_amd64.pyd` (Python 3.10, Windows AMD64)
- **API routes**: `/api/{resource}` hoặc `/api/{resource}/{action}`
- **TTS models**: `{locale}-{model_name}-{quality}.{ext}`
