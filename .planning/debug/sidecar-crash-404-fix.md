---
status: investigating
trigger: "GET http://127.0.0.1:8008/api/health 404 (Not Found) & net::ERR_CONNECTION_RESET"
created: 2026-04-21T23:20:00+07:00
updated: 2026-04-21T23:20:00+07:00
---

# Debug Session: sidecar-crash-404-fix

## Symptoms
- **Expected**: Endpoint `/api/health` trả về 200 và `/api/proxy` nạp được audio cho WaveSurfer.
- **Actual**: Health check bị 404, và WaveSurfer bị `Failed to fetch` kèm lỗi `net::ERR_CONNECTION_RESET`.
- **Errors**: 
    - `GET http://127.0.0.1:8008/api/health 404 (Not Found)`
    - `AudioTrack.tsx:83 WaveSurfer load error: TypeError: Failed to fetch`
    - `net::ERR_CONNECTION_RESET` (trong console log)
- **Timeline**: Sau khi đồng bộ hóa CUDA 12.4 và cấu hình lại Proxy.
- **Reproduction**: Khởi động backend và frontend, import video.

## Current Focus
- hypothesis: Có sự không nhất quán trong việc định nghĩa prefix /api giữa các router và main.py dẫn đến 404. Ngoài ra, proxy có thể gây crash server khi nạp file do lỗi encoding hoặc timeout.
- test: Chuẩn hóa toàn bộ prefix router trong backend và thêm error handling cho proxy.
- expecting: Toàn bộ API hoạt động ổn định dưới prefix /api.
- next_action: "refactor backend routers and proxy"

## Evidence
(None yet)

## Eliminated
(None yet)
