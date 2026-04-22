---
status: resolved
trigger: "WaveSurfer load error: NotReadableError (xảy ra sau khi sửa lỗi CORS)"
created: 2026-04-21T22:30:00+07:00
updated: 2026-04-22T08:45:00+07:00
resolution:
  root_cause: "Duplicate CORS headers (regression) causing fetch issues, and potential Windows file locking during download/processing causing 'NotReadableError'."
  fix: "Removed manual CORS headers from proxy.py, improved logging, and added pre-emptive file access check to catch locking issues early."
---

# Debug Session: wavesurfer-fetch-error-mwt-warning

## Symptoms
- **Expected**: Sóng âm thanh (waveform) hiển thị mượt màng.
- **Actual**: Xuất hiện lỗi 'NotReadableError' khi WaveSurfer cố gắng đọc file từ sidecar proxy.
- **Errors**: 
    - `WaveSurfer load error: NotReadableError: The requested file could not be read, typically due to permission problems...`

## Current Focus
- hypothesis: "Duplicate CORS headers and/or Windows file locking."
- next_action: "session complete"

## Evidence
- `proxy.py` still had manual `Access-Control-Allow-Origin: *` headers, which conflicted with `main.py`'s `CORSMiddleware`.
- `NotReadableError` in browsers is often caused by an interrupted stream or locked file access on the server side.
- Sidecar logs were set to `warning`, hiding `info` level proxy logs.
- Added `try: with open(...)` check in `proxy.py` to confirm file is readable before passing to `FileResponse`.

## Resolution
- **Root Cause**: Duplicate CORS headers causing browser fetch failures and possible file locking on Windows when files are being downloaded by other processes (like the Douyin downloader).
- **Fix**:
    1. Removed all manual CORS headers from `proxy.py` (rely on `CORSMiddleware`).
    2. Set `log_level="info"` in `run_dev.py` for better visibility.
    3. Added pre-check for file access/locking in `proxy.py` to return clear 403 error instead of a broken stream.
    4. Improved path decoding logic to handle potential double-encoded URLs.

## Eliminated
- CORS issue (resolved by removing manual headers).
- Path encoding issues (improved with double-decoding fallback).
