---
status: resolved
trigger: "Lỗi 'WaveSurfer load error: TypeError: Failed to fetch' tại AudioTrack.tsx và cảnh báo 'Language en package default expects mwt' trong log"
created: 2026-04-21T22:30:00+07:00
updated: 2026-04-21T23:15:00+07:00
resolution:
  root_cause: "Duplicate Access-Control-Allow-Origin headers in proxy response caused by manual headers in proxy.py conflicting with CORSMiddleware."
  fix: "Removed manual CORS headers from proxy.py and improved warning suppression in main.py."
---

# Debug Session: wavesurfer-fetch-error-mwt-warning

## Symptoms
- **Expected**: Sóng âm thanh (waveform) hiển thị mượt mà giống CapCut khi import video vào timeline.
- **Actual**: Xuất hiện lỗi 'Failed to fetch' trong console tại `AudioTrack.tsx` và cảnh báo thiếu gói `mwt` trong log backend.
- **Errors**: 
    - `WaveSurfer load error: TypeError: Failed to fetch`
    - `WARNING: Language en package default expects mwt, which has been added`

## Current Focus
- hypothesis: null
- next_action: "session complete"

## Evidence
- `AudioTrack.tsx` uses `getMediaSrc(url)` which proxies via `${sidecar.getBaseUrl()}/api/proxy?url=...`.
- `python-sidecar/app/routes/proxy.py` was adding manual CORS headers (`Access-Control-Allow-Origin: *`).
- `python-sidecar/app/main.py` was also applying `CORSMiddleware`.
- This caused duplicate CORS headers, which browsers reject as a security risk, resulting in `TypeError: Failed to fetch`.

## Resolution
- **Root Cause**: Duplicate `Access-Control-Allow-Origin` headers.
- **Fix**: Removed manual headers in `proxy.py` and consolidated CORS management in `main.py`. Also broadened Stanza/Argos warning suppression.

## Eliminated
(None yet)
