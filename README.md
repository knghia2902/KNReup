# KNReup — Lồng Tiếng Video AI

> Ứng dụng desktop Windows tự động **lồng tiếng, dịch phụ đề, và reup video** bằng AI.  
> Upload video → Nhận diện giọng nói → Dịch thuật → Tạo giọng đọc → Xuất video — tất cả trong một app duy nhất.

![Version](https://img.shields.io/badge/version-v2.1-blue)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![License](https://img.shields.io/badge/license-Private-red)

---

## ✨ Tính năng chính

| Module | Mô tả |
|--------|--------|
| **🎬 NLE Editor** | Giao diện chỉnh sửa chuyên nghiệp — Media Bin, Video Preview, Properties, Timeline (VID/TTS/SUB/BGM) |
| **🔊 Pipeline AI** | Whisper ASR → Dịch thuật (DeepSeek/Gemini/DeepL/OpenAI) → TTS (Edge TTS/Piper) → FFmpeg Render |
| **📥 Video Downloader** | Tải video Douyin (no-watermark), YouTube, TikTok — xác thực cookie tự động |
| **🎨 Output Pro** | Watermark, Blur vùng, Smart Crop 9:16, Audio BGM Ducking, WYSIWYG subtitle preview |
| **⏱️ Magnetic Timeline** | Multi-clip timeline với snap tự động, kéo thả segment, collision detection |

## 🛠 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Desktop** | [Tauri 2.0](https://v2.tauri.app) (Rust) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Python FastAPI (sidecar process) |
| **AI/ML** | Whisper, DeepSeek, Gemini, Edge TTS, PaddleOCR |
| **Media** | FFmpeg, yt-dlp, f2 (Douyin) |

## 📁 Cấu trúc dự án

```
KNReup/
├── src/                          # React frontend
│   ├── components/
│   │   ├── layout/               # NLE Layout (Titlebar, Sidebar)
│   │   ├── editor/               # Timeline, VideoPreview, Tracks
│   │   ├── properties/           # Style, TTS, Subtitle, Output tabs
│   │   ├── downloader/           # URL Input, Douyin Auth, History
│   │   └── setup/                # Dependency Checker
│   ├── stores/                   # Zustand stores (Project, Subtitle, Queue)
│   ├── hooks/                    # useSidecar, usePipeline, useDownloader
│   └── styles/                   # Design system CSS
├── src-tauri/                    # Tauri backend (Rust)
│   ├── capabilities/             # ACL permissions (default.json)
│   ├── permissions/              # Custom commands (TOML)
│   └── src/                      # Rust handlers (cookie sync, webview)
├── python-sidecar/               # FastAPI backend
│   └── app/
│       ├── engines/              # ASR, Translation, TTS, OCR, Downloader
│       ├── routes/               # API endpoints
│       └── utils/                # GPU detection, helpers
└── .planning/                    # GSD planning & roadmap docs
```

## 🚀 Dev Setup

### Yêu cầu
- **Node.js** ≥ 18
- **Rust** (rustup) + Tauri CLI
- **Python** 3.11 hoặc 3.12 (**QUAN TRỌNG: Python 3.13 chưa được hỗ trợ** do thư viện `f2`)
- **FFmpeg** trong PATH
- **CUDA** (khuyến nghị, có CPU fallback)

### Chạy dev

```bash
# 1. Cài dependencies
npm install
cd python-sidecar && pip install -r requirements.txt

# 2. Chạy Python sidecar
cd python-sidecar
python run_dev.py              # FastAPI @ port 8008

# 3. Chạy full Tauri app (terminal khác)
npm run tauri dev              # Vite @ port 1420 + Tauri window
```

## 📋 Trạng thái dự án

### ✅ Đã hoàn thành (Milestone 1 & 2)
- Pipeline AI 4 bước (ASR → Translate → TTS → Render)
- NLE Editor UI 5-panel chuyên nghiệp
- 4+ engine dịch thuật (DeepSeek, Gemini, DeepL, OpenAI)
- Video Downloader (Douyin no-watermark, yt-dlp)
- Output nâng cao (Watermark, Blur, Crop 9:16, BGM Ducking)
- Magnetic snapping timeline

### 🔄 Đang phát triển (Milestone 3 — v3.0)
- AI Engine Profile System
- AI Subtitle Refiner & Masking
- Auto-Monitor kênh Douyin/TikTok
- Dark/Light theme
- Keyboard shortcuts

## 📄 License

Private — Chỉ sử dụng nội bộ.

---

## ❓ Giải quyết sự cố thường gặp

**Lỗi `No matching distribution found for f2>=0.9.0` khi cài đặt:**
- Nguyên nhân: Bạn đang dùng Python 3.13. Thư viện `f2` (Douyin Downloader) hiện chỉ hỗ trợ tối đa Python 3.12.
- Cách sửa: Gỡ cài đặt Python 3.13 và cài đặt **Python 3.12.7** (bản ổn định nhất).

---

*Built with ❤️ using Tauri 2.0 + React + FastAPI*
