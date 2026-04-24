# Phase 24: Downloader-Editor Integration - Research

**Researched:** 2024-05-24
**Domain:** Project-Centric Architecture (Project Hub)
**Confidence:** HIGH

## Summary

This research establishes a "Project-Centric" architecture for KNReup, where Projects act as containers for all associated media. The core shift is moving from a file-centric workflow to a project-centric one where the Downloader and Editor are aware of the active project context.

**Primary recommendation:** Introduce a `project_id` throughout the download pipeline (DB, API, and Folder Structure) and use `useLauncherStore` as the source of truth for the "Active Project" across all application modules.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project Context | Frontend (Store) | Browser (URL Params) | Store manages state; URL params allow window-to-window sync. |
| Download Storage | API / Backend | Database (SQLite) | Sidecar manages file system and tracking. |
| File-Project Linking | Database (SQLite) | Frontend (Store) | SQLite persists the link; Store re-hydrates the editor. |
| Project Media Discovery | Frontend server (Sidecar) | API | Sidecar scans/queries for files belonging to a project. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| aiosqlite | ^0.20.0 | Async SQLite | [VERIFIED: python-sidecar/app/engines/downloader/database.py] |
| Zustand | ^4.5.0 | State Management | [VERIFIED: src/stores/useLauncherStore.ts] |
| FastAPI | ^0.109.0 | API Layer | [VERIFIED: python-sidecar/app/main.py] |

## Architecture Patterns

### Project Hub Data Flow

1. **Home Launcher:** User selects "Project A" -> Sets `activeProjectId = "A"`.
2. **Downloader:** Detects `activeProjectId == "A"` -> Pre-selects Project A in dropdown.
3. **Download Process:** 
   - UI sends `{ url, project_id: "A", project_name: "Project A" }` to Sidecar.
   - Sidecar saves to `Downloads/Project_A/[Platform]/file.mp4`.
   - Sidecar records `project_id="A"` in `downloads` table.
4. **Editor:** Opens with `?id=A`.
   - Queries `/api/download/history?project_id=A`.
   - Auto-populates Media Bin with completed downloads.

### Recommended Project Structure
```
python-sidecar/
├── data/
│   └── downloads.db      # Updated with project_id column
└── app/
    ├── engines/downloader/
    │   ├── database.py   # Schema & Query updates
    │   └── manager.py    # Path construction updates
    └── routes/downloader.py # API request model updates

src/
├── stores/
│   ├── useLauncherStore.ts # Added activeProjectId
│   └── useProjectStore.ts  # Logic for auto-loading project media
└── components/
    ├── setup/RecentProjects.tsx # Actions for Downloader/Editor
    └── downloader/DownloaderPanel.tsx # Project selector UI
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path Sanitization | Custom Regex | `pathlib` (Python) / `slugify` | Handling cross-platform invalid characters in project names. |
| Project Indexing | Custom File Watcher | SQLite `project_id` column | Faster and more reliable than scanning thousands of files. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| SQLite | Download tracking | ✓ | 3.x | — |
| OS File System | Path creation | ✓ | — | — |

## Common Pitfalls

### Pitfall 1: Orphaned Downloads
**What goes wrong:** A project is deleted but downloads remain on disk.
**Prevention strategy:** Implement a cleanup task or "Delete Project & Files" option that uses the `project_id` to find and remove associated assets.

### Pitfall 2: Name Collisions in Folders
**What goes wrong:** Two projects named "My Video" create identical subfolders.
**Prevention strategy:** Use project UUIDs as folder names or append the ID to the slug (e.g., `my-video-proj-123`).

## Code Examples

### Database Migration (Python)
```python
# python-sidecar/app/engines/downloader/database.py
async def init_db():
    # ...
    conn.execute("ALTER TABLE downloads ADD COLUMN project_id TEXT")
    # ...
```

### Store Update (TypeScript)
```typescript
// src/stores/useLauncherStore.ts
interface LauncherState {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  // ...
}
```

### Editor Auto-Load Logic
```typescript
// src/App.tsx
useEffect(() => {
  if (projectId && connected) {
    const fetchMedia = async () => {
      const { downloads } = await sidecar.fetch(`/api/download/history?project_id=${projectId}&status=completed`);
      downloads.forEach(dl => {
        if (!filePaths.includes(dl.file_path)) {
          handleFileSelected(dl.file_path);
        }
      });
    };
    fetchMedia();
  }
}, [projectId, connected]);
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Project names are safe for folder names | Folder Structure | Invalid path errors on Windows/macOS. Mitigation: Slugification. |
| A2 | Users want all downloads auto-added | Editor Load | Cluttered timeline if many trials were downloaded. Mitigation: "Add to Bin" instead of "Add to Timeline". |

## Open Questions

1. **Multi-File Projects:** Should the downloader support "Bundles" (multiple URLs) assigned to a project at once?
   - *Recommendation:* Keep single-URL downloads for now but allow "Bulk Add" via the project selector.
2. **Project Export:** If a project is moved to another computer, how are the relative paths handled?
   - *Recommendation:* Stick to absolute paths for now as it's a local desktop app; handle portability in a later "Package Project" phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in codebase.
- Architecture: HIGH - Follows existing store patterns.
- Pitfalls: MEDIUM - Requires robust path handling.

**Research date:** 2024-05-24
**Valid until:** 2024-06-24
