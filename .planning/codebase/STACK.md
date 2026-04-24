# Tech Stack - KNReup

Dưới đây là chi tiết về các công nghệ được sử dụng trong dự án KNReup.

## 1. Frontend (Giao diện người dùng)
- **Framework:** [React 19](https://react.dev/)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Quản lý State:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** Vanilla CSS (Design System tùy chỉnh)
- **Thư viện quan trọng:**
  - `wavesurfer.js`: Hiển thị và xử lý waveform âm thanh.
  - `react-resizable-panels`: Quản lý bố cục linh hoạt (timeline, sidebar).
  - `fontfaceobserver`: Quản lý việc tải font chữ.
  - `subsrt-ts`: Xử lý định dạng phụ đề.

## 2. Desktop Wrapper (Ứng dụng máy tính)
- **Framework:** [Tauri v2](https://v2.tauri.app/)
- **Ngôn ngữ:** [Rust](https://www.rust-lang.org/)
- **Plugins:**
  - `tauri-plugin-shell`: Chạy các tiến trình bên ngoài (sidecar).
  - `tauri-plugin-fs`: Quản lý file hệ thống.
  - `tauri-plugin-dialog`: Hiển thị hộp thoại hệ thống.
  - `tauri-plugin-opener`: Mở file/link bằng ứng dụng mặc định.

## 3. Backend (Sidecar Service)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Ngôn ngữ:** [Python 3.11/3.12](https://www.python.org/)
- **Server:** [Uvicorn](https://www.uvicorn.org/)
- **Xử lý bất đồng bộ:** `asyncio`, `httpx`.

## 4. AI & Media Processing (Công cụ xử lý AI)
- **ASR (Nhận dạng giọng nói):** `faster-whisper` (Cuda-accelerated).
- **TTS (Chuyển văn bản thành giọng nói):** 
  - `edge-tts` (Microsoft Edge)
  - `elevenlabs` (API cao cấp)
  - `omnivoice` (Tích hợp riêng)
- **Dịch thuật:** `argostranslate` (Offline translation).
- **OCR (Nhận dạng chữ):** `rapidocr-onnxruntime`.
- **Media Engine:** `pydub`, `librosa`, `opencv-python-headless`.
- **GPU Acceleration:** `onnxruntime-gpu`, `CUDA 12`, `cuDNN`.

## 5. Downloader (Công cụ tải video)
- **yt-dlp:** Hỗ trợ đa nền tảng (YouTube, v.v.).
- **f2:** Chuyên dụng cho Douyin/TikTok.

## 6. Development Tools
- **Linter/Formatter:** ESLint (Frontend), Black/Flake8 (Python - dự kiến).
- **Runtime:** Node.js (Frontend development).
- **Package Managers:** `npm` (Frontend), `pip` (Python).
