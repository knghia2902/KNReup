---
slug: react-illegal-state-update
status: resolved
trigger: "Warning: Cannot update a component (TextTab) while rendering a different component (App). Occurs after Analyze completes."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: React Illegal State Update

## Symptoms
- React warning in console: `Cannot update a component (TextTab) while rendering a different component (App)`.
- User reports subtitles are "not quite right" (potential synchronization issue).
- Hard to reproduce consistently; occurs after some time following an "Analyze" task.

## Current Focus
- **Hypothesis:** 
    1. The React warning is caused by `handleAnalyze` in `App.tsx` calling `useSubtitleStore.getState().setSegments(...)` immediately after `analyzeVideo` resolves. Since `analyzeVideo` (via `usePipeline`'s `runStream`) calls `setProcessing(false)` just before resolving, it triggers a render of `App`. The subsequent (microtask) call to `setSegments` triggers an update for `TextTab` while `App` (and thus `TextTab`) is still in its render cycle for the `processing` state change.
    2. "Subtitles not quite right" is caused by a synchronization bug in the queue processor in `App.tsx`: it uses global `videoDimensions` from the store (which might belong to a different file if the user switched files) and passes a hardcoded `0` duration to the rendering backend.
- **Next Action:** 
    1. Applied fix: Wrap `setSegments` in `setTimeout` in `App.tsx`.
    2. Applied fix: Capture `videoDimensions` and `duration` in the job object and use them during render.
    3. Optimized: Remove `segments` subscription from `App` to reduce re-render contention.

## Evidence
- 2026-04-22: User reported the specific React error message. Note on "sub not quite right".
- 2026-04-22: Audit of `src/App.tsx` and `src/hooks/usePipeline.ts` confirmed the overlapping state updates.
- 2026-04-22: Audit of `src/stores/useSubtitleStore.ts` confirmed that `segments` is a derived/mirrored state that triggers updates on all subscribers.

## Resolution
- **root_cause:** Race condition between `usePipeline` state update (`setProcessing`) and `useSubtitleStore` update (`setSegments`) in the same microtask loop, causing React 19 to flag an illegal update during render. Also, job processing used global state instead of job-specific state for video dimensions and duration.
- **fix:** Wrapped the final store update in `setTimeout` to ensure it runs in a separate task. Updated the job queue to capture and use per-job video metadata (dimensions, duration) instead of relying on global state which may change if the user switches active files.
