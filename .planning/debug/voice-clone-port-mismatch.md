---
status: resolved
trigger: "fix lổi sau khi nhấn clone ERR_CONNECTION_REFUSED :8000 và sidecar chạy ở 8008"
created: 2026-04-23
updated: 2026-04-23
---

# Debug Session: voice-clone-port-mismatch

## Symptoms
1. **Expected behavior**: Voice Clone tool thực hiện fetch profiles và clone giọng thành công qua backend API.
2. **Actual behavior**: Lỗi `net::ERR_CONNECTION_REFUSED` khi gọi đến cổng 8000.
3. **Error messages**: 
   - `:8000/api/tts/profiles:1 Failed to load resource: net::ERR_CONNECTION_REFUSED`
   - `sidecar.ts:79 [sidecar] Connected on port 8008`
4. **Timeline**: Xảy ra ngay sau khi triển khai tính năng Voice Clone.
5. **Reproduction**: Mở cửa sổ Voice Clone và thực hiện các thao tác liên quan đến profile hoặc clone.

## Evidence
- `- timestamp: 2026-04-23T10:00:00Z`
  - `observation`: `VoiceCloneWindow.tsx` chứa nhiều dòng hardcode `http://localhost:8000`.
  - `action`: Tìm kiếm pattern `8000` trong codebase.
  - `result`: Xác nhận `VoiceCloneWindow.tsx` gọi API sai cổng.

## Current Focus
- **Hypothesis**: `VoiceCloneWindow.tsx` đang bị hardcode cổng 8000 trong khi Sidecar thực tế đang chạy ở cổng 8008. (VERIFIED)
- **Next action**: Fixed.

## Resolution
- **Root Cause**: `VoiceCloneWindow.tsx` hardcode `http://localhost:8000` cho tất cả các cuộc gọi API và nguồn âm thanh, trong khi Python sidecar chạy trên cổng 8008 trong môi trường dev.
- **Fix**: Tái cấu trúc `VoiceCloneWindow.tsx` để sử dụng instance `sidecar` từ bridge và gọi `sidecar.getBaseUrl()` để lấy URL động.
- **Verification**: Code đã được cập nhật để sử dụng `sidecar.getProfiles()`, `sidecar.fetch()` và `sidecar.getBaseUrl()`.
