---
phase: 1
plan: 1
title: "Tauri + React Project Scaffolding"
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - vite.config.ts
  - src-tauri/tauri.conf.json
  - src-tauri/Cargo.toml
  - src-tauri/src/main.rs
  - frontend/src/App.tsx
  - frontend/src/main.tsx
  - frontend/src/index.css
  - .gitignore
autonomous: true
requirements_addressed: [R3.1, R3.7]
---

# Plan 01: Tauri + React Project Scaffolding

<objective>
Khởi tạo Tauri 2.0 project với React/TypeScript/Vite frontend. Cài taste-skill. Tạo cấu trúc thư mục chuẩn cho toàn bộ dự án.
</objective>

<must_haves>
- Tauri 2.0 app chạy được (window mở lên)
- React + TypeScript + Vite hoạt động (HMR)
- Cấu trúc thư mục chuẩn cho frontend + python-sidecar
- taste-skill đã cài
- .gitignore đúng
</must_haves>

## Tasks

<task id="1.1">
<title>Khởi tạo Tauri 2.0 + React/TypeScript project</title>
<read_first>
- D:\Tools\KNReup\.planning\phases\01-foundation\01-RESEARCH.md
</read_first>
<action>
Chạy lệnh khởi tạo Tauri 2.0 với React TypeScript template:

```bash
cd D:\Tools\KNReup
npx -y create-tauri-app@latest ./ --template react-ts --manager npm --yes
```

Nếu lệnh không hỗ trợ `--yes`, chạy interactive và chọn:
- Project name: knreup
- Frontend: React
- Language: TypeScript  
- Package manager: npm

Sau khi khởi tạo, verify cấu trúc:
```
D:\Tools\KNReup\
├── src-tauri/
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── src/main.rs
├── src/ (hoặc frontend/src/)
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```
</action>
<acceptance_criteria>
- `package.json` exists và chứa `"@tauri-apps/cli"`
- `src-tauri/tauri.conf.json` exists và chứa `"identifier"`
- `src-tauri/Cargo.toml` exists và chứa `tauri`
- `npm run tauri dev` mở một native window hiển thị React app
</acceptance_criteria>
</task>

<task id="1.2">
<title>Tạo cấu trúc thư mục cho python-sidecar</title>
<read_first>
- D:\Tools\KNReup\.planning\phases\01-foundation\01-RESEARCH.md
</read_first>
<action>
Tạo cấu trúc thư mục backend:

```
D:\Tools\KNReup\python-sidecar/
├── app/
│   ├── __init__.py          # empty
│   ├── main.py              # FastAPI entry: find_free_port(), print port to stdout, uvicorn.run()
│   ├── routes/
│   │   ├── __init__.py
│   │   └── health.py        # GET /api/health → {"status": "ok", "gpu": bool, "cuda_version": str|null}
│   └── utils/
│       ├── __init__.py
│       └── gpu_detect.py    # detect_gpu() → {"available": bool, "name": str, "cuda_version": str}
├── requirements.txt         # fastapi>=0.115, uvicorn>=0.34, pynvml (optional)
└── run_dev.py               # Dev script: uvicorn app.main:app --port 8008 --reload
```

File `main.py`:
```python
import socket
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

app = FastAPI(title="KNReup Sidecar")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/api")

if __name__ == "__main__":
    port = find_free_port()
    print(f"PORT:{port}", flush=True)
    sys.stdout.flush()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
```

File `requirements.txt`:
```
fastapi>=0.115.0
uvicorn>=0.34.0
```
</action>
<acceptance_criteria>
- `python-sidecar/app/main.py` chứa `find_free_port`
- `python-sidecar/app/main.py` chứa `print(f"PORT:{port}"`
- `python-sidecar/app/routes/health.py` chứa `@router.get("/health")`
- `python-sidecar/requirements.txt` chứa `fastapi`
- `cd python-sidecar && pip install -r requirements.txt && python -m app.main` starts server, prints PORT:{number}
- `curl http://127.0.0.1:{port}/api/health` trả về JSON có key "status"
</acceptance_criteria>
</task>

<task id="1.3">
<title>Cài taste-skill và setup design system</title>
<read_first>
- https://github.com/Leonxlnx/taste-skill README
</read_first>
<action>
1. Cài taste-skill:
```bash
cd D:\Tools\KNReup
npx skills add https://github.com/Leonxlnx/taste-skill
```

2. Tạo file design system CSS tại `src/styles/design-system.css`:
```css
:root {
  /* Colors — Dark theme NLE editor */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-panel: #1a1a25;
  --bg-surface: #222233;
  --bg-hover: #2a2a3d;
  --border: #2d2d44;
  --border-active: #4f46e5;
  
  /* Text */
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Accent */
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  /* Panel */
  --panel-gap: 2px;
  --panel-radius: 8px;
  --panel-glass: rgba(26, 26, 37, 0.85);
  
  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* taste-skill settings */
  --design-variance: 5;
  --motion-intensity: 4;
  --visual-density: 7;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
```

3. Import Google Fonts Inter trong `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
</action>
<acceptance_criteria>
- `.agent/skills/` hoặc `.skills/` directory chứa taste-skill files (hoặc nếu npx skills không work, tạo manual)
- `src/styles/design-system.css` exists và chứa `--bg-primary`
- `src/styles/design-system.css` chứa `--accent: #6366f1`
- `index.html` chứa `fonts.googleapis.com` và `Inter`
</acceptance_criteria>
</task>

<task id="1.4">
<title>Cập nhật .gitignore</title>
<read_first>
- D:\Tools\KNReup\.gitignore (nếu có)
</read_first>
<action>
Tạo/cập nhật `.gitignore`:
```
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
env/

# Build
dist/
target/
build/
*.exe

# Tauri
src-tauri/target/

# Python sidecar
python-sidecar/*.spec
python-sidecar/dist/
python-sidecar/build/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Clone directory (reference only)
Clone/

# Outputs
outputs/
downloads/
uploads/
```
</action>
<acceptance_criteria>
- `.gitignore` exists
- `.gitignore` chứa `node_modules/`
- `.gitignore` chứa `__pycache__/`
- `.gitignore` chứa `src-tauri/target/`
- `.gitignore` chứa `Clone/`
</acceptance_criteria>
</task>

## Verification

Sau khi hoàn thành tất cả tasks:
1. `npm run tauri dev` mở native window
2. Window hiển thị React content
3. Python sidecar structure tồn tại
4. Design system CSS loaded
