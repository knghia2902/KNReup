# Phase 09: Home Launcher & Multi-window - Research

## Summary
Phase 09 focuses on transitioning the app from a single-window editor to a professional multi-window architecture similar to CapCut. This involves a Home Launcher for project management and launching independent Editor or Tool windows.

## Architectural Responsibility Map
| Capability | Primary Tier | Rationale |
|------------|--------------|-----------|
| Window Management | Client (Tauri) | Tauri 2.0 handles native window creation and lifecycle. |
| Project Metadata | Client (Zustand) | Persistent store for project history and thumbnails. |
| Thumbnail Gen | Sidecar (FastAPI) | FFmpeg-based extraction via existing `/api/pipeline/thumbnail` endpoint. |
| Auth Guard | Client (React) | UI-level restriction for "Guest Mode" features. |

## Standard Stack
- **Tauri 2.0 API**: `@tauri-apps/api/webviewWindow` for dynamic window creation.
- **Zustand Persistence**: For `useProjectStore` to track `recentProjects`.
- **FastAPI Sidecar**: Port 8008, used for thumbnail generation.

## Key Findings

### 1. Tauri 2.0 Multi-window
- **API**: `import { WebviewWindow } from '@tauri-apps/api/webviewWindow'`.
- **Creation**: `new WebviewWindow('editor-1', { url: 'index.html', title: 'Editor' })`.
- **Launcher vs Editor**: The `main` window should act as the Launcher. Use unique IDs for editor windows.

### 2. Guest Mode Auth Guard
- **Pattern**: `useAuthStore` for login status.
- **Guard Component**: `RequireAuth` wrapper for UI elements.
- **Flow**: Guest Mode by default; login for AI/Premium features.

### 3. Recent Projects Management
- **Storage**: `useProjectStore` persistence with `recentProjects: { id, path, name, thumbnail, lastModified }[]`.
- **Thumbnails**: existing `/api/pipeline/thumbnail` endpoint.

### 4. Launcher UI Pattern
- **Layout**: CapCut-style. Start Creating button, Tools section, Recent Projects grid with thumbnails.

## Recommended Next Steps for Planning
1. Define `useAuthStore` and `RequireAuth`.
2. Create `HomeLauncher` component as default view.
3. Implement `recentProjects` logic.
4. Update Tauri setup for window management.
