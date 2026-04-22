---
slug: gpu-regression-log-spam
status: root_cause_found
trigger: "Regression: Analyze reverted to CPU usage; Terminal spamming 'check-file' API requests. Occurred after cache clearing."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: GPU Regression and Log Spam

## Symptoms
- Analyze process is slow and uses 100% CPU (GPU acceleration lost).
- Terminal is spammed with `GET /api/download/check-file` requests (FastAPI INFO logs).
- Regression: GPU was working yesterday; issue started after cache clearing.

## Current Focus
- **Hypothesis:** 
    1. **Log Spam:** The frontend `Downloader` component or a background queue listener is polling `check-file` or `history` without proper debouncing or is re-triggering on every state update, leading to infinite requests. (CONFIRMED)
    2. **GPU Regression:** Clearing cache might have removed pre-compiled kernels, model weights, or more likely, reset environment variables (`CUDA_VISIBLE_DEVICES`, `PATH` to DLLs) that were previously set up to enable GPU usage in the sidecar. (CONFIRMED: Conflict between onnxruntime and onnxruntime-gpu)
- **Next Action:** Apply fixes for both issues.

## Evidence
- 2026-04-22: Terminal logs show high frequency of `/api/download/check-file` calls.
- 2026-04-22: User confirms CPU usage is back to 100% during analyze.
- 2026-04-22: `pip show` confirms both `onnxruntime` and `onnxruntime-gpu` are installed in different locations.
- 2026-04-22: `onnxruntime.get_available_providers()` only returns CPU and Azure providers.
- 2026-04-22: `DownloadHistory.tsx` found to have a `useEffect` that triggers checks on every history change.

## Specialist Review
- **Hint:** python
- **Review:** The suggested fix of uninstalling both and reinstalling only `onnxruntime-gpu` is the standard solution for the common "duplicate onnxruntime" issue. For the log spam, memoization of the results based on item ID and completion status is the correct idiomatic approach in React.

## Resolution
- **root_cause:** 1. `DownloadHistory.tsx` triggers redundant file existence checks on every history refresh (every 5s). 2. Conflict between `onnxruntime` (CPU) and `onnxruntime-gpu` packages where CPU version takes precedence.
- **fix:** 1. Optimize `DownloadHistory.tsx` to memoize check results. 2. Uninstall `onnxruntime` and ensure `onnxruntime-gpu` is correctly installed.
