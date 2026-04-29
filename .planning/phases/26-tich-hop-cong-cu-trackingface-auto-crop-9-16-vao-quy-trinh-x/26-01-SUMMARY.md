---
status: complete
---

# Plan 26-01 Summary: Backend Integration (TrackingFace API)

## What was built
- Copy toàn bộ mã nguồn TrackingFace (pipeline.py, detector.py, tracker.py, smoother.py, speaker.py) vào `python-sidecar/app/engines/tracking_face/`
- Sửa imports từ bare (`from detector import ...`) sang relative (`from .detector import ...`)
- Tạo API route `POST /process/smart-crop` tại `python-sidecar/app/routes/face_crop.py`:
  - SSE streaming progress (frame-by-frame)
  - GPU auto-detection + CPU fallback
  - Chạy trong thread pool qua threading (không block event loop FastAPI)
- Tạo endpoint `GET /process/smart-crop/gpu-status` để check GPU
- Đăng ký router vào `main.py`
- Thêm dependencies: `ultralytics>=8.0.0`, `numpy>=1.24`, `ffmpeg-python>=0.2`

## Key files
- `python-sidecar/app/engines/tracking_face/` (5 files)
- `python-sidecar/app/routes/face_crop.py`
- `python-sidecar/app/main.py`
- `python-sidecar/requirements.txt`

## Self-Check: PASSED
- [x] API route registered with `/api/process/smart-crop` prefix
- [x] GPU fallback logic implemented
- [x] SSE streaming cho progress
- [x] Không block FastAPI event loop
