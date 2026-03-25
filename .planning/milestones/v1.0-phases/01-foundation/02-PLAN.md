---
phase: 1
plan: 2
title: "Sidecar Bridge + Tauri Integration"
wave: 2
depends_on: [1]
files_modified:
  - src-tauri/src/main.rs
  - src-tauri/tauri.conf.json
  - src-tauri/capabilities/default.json
  - src/lib/sidecar.ts
  - src/hooks/useSidecar.ts
  - src/App.tsx
autonomous: true
requirements_addressed: [R3.2]
---

# Plan 02: Sidecar Bridge + Tauri Integration

<objective>
Kết nối Tauri frontend với Python FastAPI sidecar: spawn process, đọc port, giao tiếp HTTP/JSON, quản lý lifecycle.
</objective>

<must_haves>
- Tauri spawn sidecar process khi app start
- Frontend đọc được port từ sidecar stdout
- Frontend gọi được `/api/health` endpoint
- Sidecar tự tắt khi app đóng
</must_haves>

## Tasks

<task id="2.1">
<title>Cấu hình Tauri sidecar permissions</title>
<read_first>
- D:\Tools\KNReup\src-tauri\tauri.conf.json
- D:\Tools\KNReup\src-tauri\capabilities\default.json
</read_first>
<action>
1. Cập nhật `src-tauri/tauri.conf.json` — thêm externalBin:
```json
{
  "bundle": {
    "externalBin": ["binaries/python-sidecar"]
  }
}
```

2. Cập nhật `src-tauri/capabilities/default.json` — thêm shell permissions:
```json
{
  "permissions": [
    "core:default",
    "shell:allow-spawn",
    "shell:allow-execute",
    "shell:allow-stdin-write"
  ]
}
```

3. Trong dev mode, thay vì dùng externalBin, chạy FastAPI trực tiếp:
Tạo `src-tauri/src/sidecar.rs`:
```rust
use std::process::{Command, Child};
use std::sync::Mutex;

pub struct SidecarState {
    pub process: Mutex<Option<Child>>,
    pub port: Mutex<Option<u16>>,
}

impl SidecarState {
    pub fn new() -> Self {
        Self {
            process: Mutex::new(None),
            port: Mutex::new(None),
        }
    }
}
```
</action>
<acceptance_criteria>
- `src-tauri/tauri.conf.json` chứa `externalBin`
- `src-tauri/capabilities/default.json` chứa `shell:allow-spawn`
- `src-tauri/src/sidecar.rs` chứa `SidecarState`
</acceptance_criteria>
</task>

<task id="2.2">
<title>Tạo TypeScript sidecar bridge</title>
<read_first>
- D:\Tools\KNReup\.planning\phases\01-foundation\01-RESEARCH.md
</read_first>
<action>
Tạo `src/lib/sidecar.ts`:
```typescript
const SIDECAR_DEV_PORT = 8008;

class SidecarBridge {
  private port: number | null = null;
  private baseUrl: string = '';

  async init(): Promise<void> {
    // Dev mode: connect trực tiếp tới port 8008
    if (import.meta.env.DEV) {
      this.port = SIDECAR_DEV_PORT;
      this.baseUrl = `http://127.0.0.1:${this.port}`;
      return;
    }
    
    // Production: spawn sidecar, read port from stdout
    const { Command } = await import('@tauri-apps/plugin-shell');
    const command = Command.sidecar('binaries/python-sidecar');
    
    command.stdout.on('data', (line: string) => {
      const match = line.match(/^PORT:(\d+)$/);
      if (match) {
        this.port = parseInt(match[1], 10);
        this.baseUrl = `http://127.0.0.1:${this.port}`;
      }
    });

    await command.spawn();
    
    // Wait for port
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Sidecar timeout')), 10000);
      const check = setInterval(() => {
        if (this.port) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
    });
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  getPort(): number | null { return this.port; }
  getBaseUrl(): string { return this.baseUrl; }
}

export const sidecar = new SidecarBridge();
```

Tạo `src/hooks/useSidecar.ts`:
```typescript
import { useState, useEffect } from 'react';
import { sidecar } from '../lib/sidecar';

interface HealthStatus {
  status: string;
  gpu: boolean;
  cuda_version: string | null;
}

export function useSidecar() {
  const [connected, setConnected] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sidecar.init()
      .then(() => sidecar.fetch<HealthStatus>('/api/health'))
      .then(data => {
        setHealth(data);
        setConnected(true);
      })
      .catch(err => setError(err.message));
  }, []);

  return { connected, health, error };
}
```
</action>
<acceptance_criteria>
- `src/lib/sidecar.ts` chứa `class SidecarBridge`
- `src/lib/sidecar.ts` chứa `find(/^PORT:(\d+)$/)`
- `src/lib/sidecar.ts` chứa `async fetch<T>`
- `src/hooks/useSidecar.ts` chứa `useSidecar`
- `src/hooks/useSidecar.ts` chứa `/api/health`
</acceptance_criteria>
</task>

<task id="2.3">
<title>Cập nhật App.tsx hiển thị sidecar status</title>
<read_first>
- D:\Tools\KNReup\src\App.tsx
- D:\Tools\KNReup\src\styles\design-system.css
</read_first>
<action>
Cập nhật `src/App.tsx`:
```tsx
import { useSidecar } from './hooks/useSidecar';
import './styles/design-system.css';

function App() {
  const { connected, health, error } = useSidecar();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>KNReup</h1>
        <div className="status-indicator">
          {error ? (
            <span className="status-badge error">❌ {error}</span>
          ) : connected ? (
            <span className="status-badge success">
              ✅ Backend connected (port: {health?.gpu ? 'GPU' : 'CPU'})
            </span>
          ) : (
            <span className="status-badge loading">⏳ Connecting...</span>
          )}
        </div>
      </header>
      <main className="nle-layout">
        <aside className="panel panel-left">Subtitle List</aside>
        <section className="panel panel-center">Video Preview</section>
        <aside className="panel panel-right">Properties</aside>
      </main>
      <footer className="panel panel-bottom">Timeline</footer>
    </div>
  );
}

export default App;
```
</action>
<acceptance_criteria>
- `src/App.tsx` chứa `useSidecar`
- `src/App.tsx` chứa `nle-layout`
- `src/App.tsx` chứa `panel-left`
- `src/App.tsx` chứa `panel-center`
- `src/App.tsx` chứa `Backend connected`
</acceptance_criteria>
</task>

## Verification

1. Chạy `cd python-sidecar && python run_dev.py` → FastAPI start trên port 8008
2. Chạy `npm run tauri dev` → Window mở, hiển thị "Backend connected"
3. NLE layout skeleton hiển thị 4 panels
