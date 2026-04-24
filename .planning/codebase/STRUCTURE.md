# Code Structure - KNReup

Dưới đây là sơ đồ tổ chức thư mục và vai trò của từng thành phần trong mã nguồn.

## 1. Cấu trúc thư mục gốc
- `src/`: Mã nguồn Frontend (React + TypeScript).
- `src-tauri/`: Mã nguồn Backend Desktop (Rust + Cấu hình Tauri).
- `python-sidecar/`: Mã nguồn Backend Xử lý AI (FastAPI + AI Engines).
- `.planning/`: Tài liệu quản lý dự án, roadmap và trạng thái hiện tại.
- `public/`: Tài sản tĩnh (fonts, icons) phục vụ frontend.

## 2. Chi tiết Frontend (`src/`)
- `components/`: Các thành phần UI được chia theo module:
  - `editor/`: Timeline, Subtitle editor, Preview.
  - `downloader/`: Giao diện tải video.
  - `tools/`: Các công cụ bổ trợ (TTS Studio, Voice Clone).
  - `layout/`: Sidebar, Header, Panel management.
- `stores/`: Quản lý state bằng Zustand (Subtitle, Project, Voice).
- `hooks/`: Custom hooks xử lý logic (usePipeline, useSidecar, useDownloader).
- `lib/`: Các thư viện helper và bridge (sidecar communication, audio mixer).
- `styles/`: Hệ thống CSS (design-system.css, module-specific styles).
- `utils/`: Các hàm tiện ích (time formatting, URL parsing).

## 3. Chi tiết Sidecar (`python-sidecar/`)
- `app/`:
  - `engines/`: Lõi xử lý AI (asr.py, tts/, translation/, ocr_extractor.py, output.py).
  - `routes/`: Định nghĩa các endpoint API (pipeline.py, downloader.py, voice_studio.py).
  - `utils/`: Helpers cho logging, file handling.
  - `main.py`: Điểm khởi đầu của FastAPI server.
- `assets/`: Resource cần thiết cho sidecar (fonts).
- `install_langs.py`: Script cài đặt các model ngôn ngữ cho dịch thuật.
- `requirements.txt`: Danh sách các thư viện Python cần thiết.

## 4. Chi tiết Tauri (`src-tauri/`)
- `src/`: Mã nguồn Rust (thường là minimal vì logic nằm ở Sidecar).
- `capabilities/`: Cấp quyền cho ứng dụng (fs, shell, dialog).
- `tauri.conf.json`: Cấu hình quan trọng của ứng dụng, định nghĩa sidecar binary.

## 5. Quy ước đặt tên
- **Frontend:** PascalCase cho Components, camelCase cho functions/variables.
- **Python:** snake_case cho functions/variables/files.
- **CSS:** kebab-case cho class names.
