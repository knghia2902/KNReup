---
slug: sidecar-cors-error
status: investigating
trigger: "Frontend (http://localhost:1420) CORS error when calling sidecar proxy (http://127.0.0.1:8008/api/proxy). Error: 'No Access-Control-Allow-Origin header is present on the requested resource'."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: Sidecar CORS Error

## Symptoms
- Frontend at `http://localhost:1420` (Tauri app) cannot call `http://127.0.0.1:8008/api/proxy`.
- Browser error: `No 'Access-Control-Allow-Origin' header is present on the requested resource`.
- This blocks the proxy functionality used for Douyin/video downloads.

## Current Focus
- **Hypothesis:** FastAPI CORS middleware is either missing, misconfigured, or the `/api/proxy` route is bypassing it (e.g., by returning a custom Response object that doesn't include the headers).
- **Next Action:** Locate the `/api/proxy` route and check `main.py` for CORS configuration.

## Evidence
- 2026-04-22: Initial report of CORS error on `/api/proxy`.

## Resolution
- **root_cause:** TBD
- **fix:** TBD
