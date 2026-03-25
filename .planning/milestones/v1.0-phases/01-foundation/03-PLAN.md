---
phase: 1
plan: 3
title: "First-Run Dependency Checker + NLE Layout CSS"
wave: 2
depends_on: [1]
files_modified:
  - python-sidecar/app/utils/gpu_detect.py
  - python-sidecar/app/routes/health.py
  - python-sidecar/app/routes/system.py
  - src/components/setup/DependencyChecker.tsx
  - src/components/layout/NLELayout.tsx
  - src/styles/nle-layout.css
  - src/styles/dependency-checker.css
autonomous: true
requirements_addressed: [R3.3, R4.1, R4.2, R4.3]
---

# Plan 03: First-Run Dependency Checker + NLE Layout CSS

<objective>
Tạo dependency checker (GPU detect, FFmpeg check) và hoàn thiện NLE 5-panel layout CSS với glassmorphism + resizable panels.
</objective>

<must_haves>
- GPU/CUDA detection hoạt động
- FFmpeg detection hoạt động
- Dependency checker UI hiển thị ✅/❌ cho mỗi component
- NLE 5-panel layout responsive với glassmorphism
- Panels có thể drag resize
</must_haves>

## Tasks

<task id="3.1">
<title>GPU/CUDA detection backend</title>
<read_first>
- D:\Tools\KNReup\python-sidecar\app\utils\gpu_detect.py
- D:\Tools\KNReup\Clone\VideoTransAI\runtime\VideoTransAI\_internal\static\index.html (dòng có "Trạng thái backend")
</read_first>
<action>
Viết `python-sidecar/app/utils/gpu_detect.py`:
```python
import subprocess
import os
import ctypes

def detect_gpu():
    """Detect NVIDIA GPU và CUDA version."""
    result = {
        "gpu_available": False,
        "gpu_name": None,
        "cuda_version": None,
        "cuda_major": None,
        "compute_type": "float32",  # CPU default
    }
    
    # Check nvidia-smi
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader"],
            timeout=5, stderr=subprocess.DEVNULL
        ).decode().strip()
        if output:
            parts = output.split(",")
            result["gpu_available"] = True
            result["gpu_name"] = parts[0].strip()
    except (FileNotFoundError, subprocess.SubprocessError):
        pass
    
    # Check CUDA version
    if result["gpu_available"]:
        for cuda_ver, dll_name in [("12", "cublas64_12.dll"), ("11", "cublas64_11.dll")]:
            try:
                ctypes.CDLL(dll_name)
                result["cuda_version"] = cuda_ver
                result["cuda_major"] = int(cuda_ver)
                result["compute_type"] = "float16"
                break
            except OSError:
                continue
    
    return result

def detect_ffmpeg():
    """Check FFmpeg có sẵn không."""
    try:
        output = subprocess.check_output(
            ["ffmpeg", "-version"], timeout=5, stderr=subprocess.DEVNULL
        ).decode().strip()
        version_line = output.split('\n')[0]
        return {"available": True, "version": version_line}
    except (FileNotFoundError, subprocess.SubprocessError):
        return {"available": False, "version": None}

def detect_all_dependencies():
    """Kiểm tra tất cả dependencies."""
    gpu = detect_gpu()
    ffmpeg = detect_ffmpeg()
    return {
        "gpu": gpu,
        "ffmpeg": ffmpeg,
        "all_ok": ffmpeg["available"],  # GPU optional
    }
```

Tạo `python-sidecar/app/routes/system.py`:
```python
from fastapi import APIRouter
from app.utils.gpu_detect import detect_all_dependencies

router = APIRouter()

@router.get("/system/check")
async def check_dependencies():
    return detect_all_dependencies()
```

Thêm router vào `main.py`:
```python
from app.routes import health, system
app.include_router(system.router, prefix="/api")
```
</action>
<acceptance_criteria>
- `python-sidecar/app/utils/gpu_detect.py` chứa `def detect_gpu()`
- `python-sidecar/app/utils/gpu_detect.py` chứa `nvidia-smi`
- `python-sidecar/app/utils/gpu_detect.py` chứa `cublas64_12.dll`
- `python-sidecar/app/routes/system.py` chứa `@router.get("/system/check")`
- `curl http://127.0.0.1:8008/api/system/check` trả về JSON có key "gpu" và "ffmpeg"
</acceptance_criteria>
</task>

<task id="3.2">
<title>Dependency Checker UI component</title>
<read_first>
- D:\Tools\KNReup\Clone\VideoTransAI\runtime\VideoTransAI\_internal\static\index.html
- D:\Tools\KNReup\src\styles\design-system.css
</read_first>
<action>
Tạo `src/components/setup/DependencyChecker.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { sidecar } from '../../lib/sidecar';
import './DependencyChecker.css';

interface SystemCheck {
  gpu: { gpu_available: boolean; gpu_name: string | null; cuda_version: string | null; compute_type: string };
  ffmpeg: { available: boolean; version: string | null };
  all_ok: boolean;
}

export function DependencyChecker({ onComplete }: { onComplete: () => void }) {
  const [check, setCheck] = useState<SystemCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sidecar.fetch<SystemCheck>('/api/system/check');
      setCheck(data);
      if (data.all_ok) {
        setTimeout(onComplete, 2000); // Auto dismiss sau 2s
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runCheck(); }, []);

  // ... render logic hiển thị:
  // ✅ GPU: NVIDIA RTX 4090 (CUDA 12, float16)
  // ❌ GPU: Không tìm thấy (sẽ dùng CPU)
  // ✅ FFmpeg: ffmpeg version 7.x
  // ❌ FFmpeg: Chưa cài (cần cài để xử lý video)
  // [Kiểm tra lại] button
}
```

Tạo `src/styles/dependency-checker.css`:
```css
.dep-checker-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.dep-checker-card {
  background: var(--panel-glass);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  width: 480px;
  backdrop-filter: blur(20px);
}

.dep-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
.dep-item .icon { font-size: 20px; }
.dep-item.ok .icon { color: var(--success); }
.dep-item.fail .icon { color: var(--danger); }
.dep-item .label { font-weight: 500; }
.dep-item .detail { color: var(--text-secondary); font-size: 13px; }

.retry-btn {
  margin-top: 16px; padding: 10px 24px;
  background: var(--accent); color: white;
  border: none; border-radius: 8px; cursor: pointer;
  font-weight: 600; transition: background 0.2s;
}
.retry-btn:hover { background: var(--accent-hover); }
```
</action>
<acceptance_criteria>
- `src/components/setup/DependencyChecker.tsx` chứa `DependencyChecker`
- `src/components/setup/DependencyChecker.tsx` chứa `/api/system/check`
- `src/components/setup/DependencyChecker.tsx` chứa `onComplete`
- `src/styles/dependency-checker.css` chứa `.dep-checker-overlay`
- `src/styles/dependency-checker.css` chứa `backdrop-filter: blur`
</acceptance_criteria>
</task>

<task id="3.3">
<title>NLE 5-Panel Layout component + CSS</title>
<read_first>
- D:\Tools\KNReup\Clone\Reupv3\tonghop.md (section 6.1 NLE Layout)
- D:\Tools\KNReup\src\styles\design-system.css
</read_first>
<action>
Tạo `src/components/layout/NLELayout.tsx`:
```tsx
import { useState, useCallback, useRef } from 'react';
import './NLELayout.css';

interface NLELayoutProps {
  toolbar: React.ReactNode;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

export function NLELayout({ toolbar, leftPanel, centerPanel, rightPanel, bottomPanel }: NLELayoutProps) {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(200);
  
  // Drag resize handlers
  // ... (useRef + onMouseDown + onMouseMove + onMouseUp)

  return (
    <div className="nle-shell">
      <div className="nle-toolbar">{toolbar}</div>
      <div className="nle-workspace">
        <div className="nle-panel nle-left" style={{ width: leftWidth }}>
          {leftPanel}
          <div className="resize-handle resize-handle-right" onMouseDown={...} />
        </div>
        <div className="nle-panel nle-center">{centerPanel}</div>
        <div className="nle-panel nle-right" style={{ width: rightWidth }}>
          <div className="resize-handle resize-handle-left" onMouseDown={...} />
          {rightPanel}
        </div>
      </div>
      <div className="nle-panel nle-bottom" style={{ height: bottomHeight }}>
        <div className="resize-handle resize-handle-top" onMouseDown={...} />
        {bottomPanel}
      </div>
    </div>
  );
}
```

Tạo `src/styles/nle-layout.css`:
```css
.nle-shell {
  display: flex; flex-direction: column;
  height: 100vh; width: 100vw;
  background: var(--bg-primary);
  overflow: hidden;
}

.nle-toolbar {
  height: 48px; display: flex; align-items: center;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0 16px; gap: 8px;
  -webkit-app-region: drag; /* Tauri window drag */
}

.nle-workspace {
  flex: 1; display: flex;
  gap: var(--panel-gap);
  min-height: 0;
}

.nle-panel {
  background: var(--panel-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.nle-left { min-width: 200px; max-width: 500px; }
.nle-center { flex: 1; min-width: 400px; }
.nle-right { min-width: 200px; max-width: 500px; }
.nle-bottom {
  min-height: 120px; max-height: 400px;
  border-top: 1px solid var(--border);
}

.resize-handle {
  position: absolute; z-index: 10;
  background: transparent;
  transition: background 0.15s;
}
.resize-handle:hover { background: var(--accent); opacity: 0.5; }
.resize-handle-right { right: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; }
.resize-handle-left { left: 0; top: 0; width: 4px; height: 100%; cursor: col-resize; }
.resize-handle-top { top: 0; left: 0; height: 4px; width: 100%; cursor: row-resize; }
```
</action>
<acceptance_criteria>
- `src/components/layout/NLELayout.tsx` chứa `NLELayout`
- `src/components/layout/NLELayout.tsx` chứa `leftWidth`
- `src/components/layout/NLELayout.tsx` chứa `nle-toolbar`
- `src/styles/nle-layout.css` chứa `.nle-shell`
- `src/styles/nle-layout.css` chứa `backdrop-filter: blur`
- `src/styles/nle-layout.css` chứa `.resize-handle`
- `src/styles/nle-layout.css` chứa `cursor: col-resize`
</acceptance_criteria>
</task>

## Verification

1. App khởi động → DependencyChecker popup hiện lên
2. Hiển thị ✅/❌ cho GPU và FFmpeg
3. Nếu tất cả OK → popup tự đóng sau 2s → NLE layout hiện
4. NLE layout có 5 vùng rõ ràng: toolbar, left, center, right, bottom
5. Drag resize giữa các panel hoạt động
6. Glassmorphism effect visible (backdrop blur)
