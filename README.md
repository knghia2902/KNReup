# KNReup — Lồng Tiếng Video AI

> AI-powered video tool: tự động lồng tiếng, dịch phụ đề, re-upload.

## Tech Stack

- **Frontend**: Tauri 2.0 + React + TypeScript + Vite
- **Backend**: Python FastAPI (sidecar)
- **UI**: NLE-style dark theme (taste-skill inspired)

## Cấu trúc

```
KNReup/
├── src/                    # React frontend
│   ├── components/
│   │   ├── layout/         # NLE Layout (Titlebar, Sidebar, Media Bin, Preview, Properties, Timeline)
│   │   └── setup/          # Dependency Checker
│   ├── hooks/              # useSidecar
│   ├── lib/                # sidecar bridge
│   └── styles/             # design system CSS
├── src-tauri/              # Tauri backend (Rust)
├── python-sidecar/         # FastAPI backend
│   └── app/
│       ├── routes/         # API endpoints (health, system)
│       └── utils/          # GPU/FFmpeg detection
├── .planning/              # GSD planning docs
└── Clone/                  # Reference builds (gitignored)
```

## Dev Setup

```bash
# Frontend
npm install
npm run dev              # Vite dev server (port 1420)

# Python sidecar
cd python-sidecar
pip install -r requirements.txt
python run_dev.py        # FastAPI dev server (port 8008)

# Full Tauri app
npm run tauri dev
```

## Layout

NLE-style: Titlebar (Editor/Downloader/Monitor/Settings) + Sidebar + Media Bin + Video Preview + Properties (STYLE/TTS/SUB/OUT) + Timeline (VIDEO/AUDIO/SUB/BGM) + Status bar.
