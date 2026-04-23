---
status: resolved
trigger: VoiceCloneWindow not syncing with dark mode
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: VoiceCloneWindow Dark Mode Sync

## Symptoms
- VoiceCloneWindow does not update colors when the main app switches to dark mode.
- Hypothesis: `design-system.css` is not imported in the component or its entry point, so CSS variables are missing in the separate Tauri window.

## Current Focus
- **Hypothesis:** `design-system.css` is missing in the entry path for the tool window.
- **Next Action:** Resolved by importing `design-system.css` in `src/main.tsx`.

## Evidence
- timestamp: 2026-04-22T15:00:00Z
  - observation: `VoiceCloneWindow` is loaded dynamically in `src/main.tsx` via `getWindowType()`.
- timestamp: 2026-04-22T15:10:00Z
  - observation: `VoiceCloneWindow.css` uses `var(--...)` variables from `design-system.css`.
  - observation: `src/main.tsx` (the common entry point) was missing the `design-system.css` import.
  - action: Added `import "./styles/design-system.css";` to `src/main.tsx`.

## Resolution
- **Root Cause:** `VoiceCloneWindow` was missing the global `design-system.css` which defines the theme CSS variables. While other windows imported it individually, the common entry point `main.tsx` did not.
- **Fix:** Imported `design-system.css` in `src/main.tsx` to ensure all Tauri windows (Editor, Launcher, Tools) have access to the design system variables by default.
