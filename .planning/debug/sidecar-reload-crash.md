status: resolved
trigger: "Python sidecar crashed with exit code 1 during reload after updating downloader logic."
updated: "2026-04-17"
---

# Resolution
- **Root Cause**: The inclusion of `js_runtimes=['node']` in `yt-dlp`'s `ydl_opts` caused a data structure mismatch ('expected a dict of {runtim'). Additionally, an attempt to trigger a reload via `echo` corrupted `downloader.py` with null bytes.
- **Fix**: Removed the `js_runtimes` configuration and restored `downloader.py` to a clean state.
- **Verification**: Sidecar reloads successfully upon code changes without crashing.

# Evidence

- [2026-04-17] Command `py run_dev.py` failed with exit code 1.
- [2026-04-17] Uvicorn logs show `CancelledError` during shutdown/reload.

# Eliminated
- None
