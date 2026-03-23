# STACK.md — Technology Stack

## Ngôn ngữ & Runtime

| Thành phần | Chi tiết |
|---|---|
| **Ngôn ngữ backend** | Python 3.10 (compile Cython → `.pyd` extension) |
| **Frontend** | HTML5 + Vanilla CSS + Vanilla JavaScript |
| **Runtime** | CPython 3.10 (nhúng trong PyInstaller) |
| **Hệ điều hành** | Windows (`.exe` build, `.pyd` modules) |

## Kiến trúc đóng gói

Ứng dụng sử dụng **PyInstaller** với kiến trúc **2 lớp (2-tier)**:

1. **Launcher** (`VideoTransAI.exe` gốc, ~4.5MB)
   - Bootstrap, khởi động runtime, quản lý auto-update
   - Nằm ở `d:\Tools\VideoTransAI\VideoTransAI.exe`

2. **Runtime** (`runtime\VideoTransAI\VideoTransAI.exe`, ~37MB)
   - Chứa toàn bộ backend Flask + services + frontend
   - Nằm ở `d:\Tools\VideoTransAI\runtime\VideoTransAI\`
   - Dependencies trong `_internal\`

## Frameworks & Thư viện chính

### Backend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| **Flask** | 3.1.3 | Web framework, serve API + static files |
| **pywebview** | — | Tạo native window (desktop webview) |
| **Pydantic** | 2.12.5 | Data validation |
| **PyTorch** | — | Deep learning runtime |
| **Whisper** (OpenAI) | — | Speech-to-text |
| **Demucs** (Facebook) | — | AI vocal separation |
| **Edge TTS** | — | Text-to-speech (Microsoft Edge) |
| **gTTS** | — | Text-to-speech (Google) |
| **Piper TTS** | — | Text-to-speech offline (local ONNX model) |
| **ONNX Runtime** | — | Model inference |
| **FFmpeg** | — | Video/audio processing |
| **aiohttp** | — | Async HTTP client |
| **bcrypt** | — | Password hashing |
| **cryptography** | 46.0.5 | Mã hóa/ký số |
| **PyJWT** (implicit) | — | JWT token authentication |
| **pythonnet** | — | .NET CLR interop |
| **tiktoken** | — | Token counting (cho LLM API calls) |

### Frontend
| Thư viện | Vai trò |
|---|---|
| **Google Fonts (Inter)** | Typography |
| **Vanilla CSS** | Styling (dark theme, glassmorphism) |
| **Vanilla JS** | Hàng đợi video, modal config, video preview, SSE streaming |

## Cấu hình

| File | Vị trí | Mục đích |
|---|---|---|
| `bootstrap_runtime.json` | `runtime\VideoTransAI\` | Version runtime, source manifest URL, install date |
| `update_signing_public.pem` | `_internal\` | Public key xác thực bản cập nhật |
| `vi_VN-vais1000-medium.json` | `_internal\TTSDemo\` | Config mô hình Piper TTS tiếng Việt |
| `vi_VN-vais1000-medium.onnx` | `_internal\TTSDemo\` | Mô hình ONNX Piper TTS tiếng Việt (~60MB) |

## Cách chạy

- Launcher khởi động → kiểm tra & cập nhật runtime → chạy runtime exe
- Runtime exe khởi động Flask server trên `http://127.0.0.1:5000`
- pywebview mở native window trỏ đến Flask server
- Flask serve cả static frontend files và API endpoints
