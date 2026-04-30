"""Smart Crop routes — AI face-tracking auto crop 16:9 → 9:16."""
import os
import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process")

@router.get("/smart-crop/tracking")
async def get_tracking_data(path: str):
    from fastapi.responses import FileResponse
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Tracking file not found")
    return FileResponse(path, media_type="application/json")

# ─── Models ───────────────────────────────────────────────
class SmartCropRequest(BaseModel):
    input_path: str
    output_path: str
    alpha: float = 0.08
    dead_zone: float = 0.03
    detect_every: int = 3
    fallback_center: bool = True
    encode_crf: int = 18
    encode_preset: str = "fast"


class SmartCropStatusResponse(BaseModel):
    status: str
    output: str
    mode: str  # "GPU" or "CPU"
    total_frames: int = 0


class AnalyzeRequest(BaseModel):
    input_path: str
    alpha: float = 0.08
    dead_zone: float = 0.03
    detect_every: int = 3
    fallback_center: bool = True


class RenderRequest(BaseModel):
    input_path: str
    output_path: str
    tracking_json_path: str
    keyframes: list[dict] = []
    out_width: int = 1080
    out_height: int = 1920
    encode_crf: int = 18
    encode_preset: str = "fast"


# ─── GPU Detection ────────────────────────────────────────
def _detect_gpu() -> int:
    """Try to detect NVIDIA GPU. Returns gpu_id (0) or -1 (CPU fallback)."""
    try:
        import torch
        if torch.cuda.is_available():
            return 0
    except ImportError:
        pass

    try:
        import pynvml
        pynvml.nvmlInit()
        device_count = pynvml.nvmlDeviceGetCount()
        if device_count > 0:
            return 0
    except Exception:
        pass

    return -1  # CPU fallback


# ─── Smart Crop (SSE streaming) ───────────────────────────
@router.post("/smart-crop")
async def smart_crop_video(req: SmartCropRequest):
    """
    AI Smart Crop — YOLOv8 face tracking, crop 16:9 → 9:16.
    Streams progress via SSE. Falls back to CPU if GPU unavailable.
    """
    import json

    if not os.path.exists(req.input_path):
        raise HTTPException(400, f"File not found: {req.input_path}")

    # Ensure output directory exists
    output_dir = os.path.dirname(req.output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    async def event_stream():
        mode = "GPU"
        try:
            from app.engines.tracking_face.pipeline import FaceCrop916

            # Detect GPU availability
            gpu_id = _detect_gpu()
            if gpu_id < 0:
                mode = "CPU"
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'GPU không khả dụng — chuyển sang chế độ CPU (chậm hơn)', 'mode': 'CPU'})}\n\n"
            else:
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'Đang khởi tạo AI model trên GPU...', 'mode': 'GPU'})}\n\n"

            # Try GPU first, fallback to CPU
            try:
                pipe = FaceCrop916(
                    gpu_id=gpu_id,
                    alpha=req.alpha,
                    dead_zone=req.dead_zone,
                    detect_every=req.detect_every,
                    fallback_center=req.fallback_center,
                )
            except Exception as gpu_err:
                logger.warning(f"GPU init failed, falling back to CPU: {gpu_err}")
                mode = "CPU"
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': f'GPU lỗi ({str(gpu_err)[:80]}) — chuyển sang CPU', 'mode': 'CPU'})}\n\n"
                pipe = FaceCrop916(
                    gpu_id=-1,
                    alpha=req.alpha,
                    dead_zone=req.dead_zone,
                    detect_every=req.detect_every,
                    fallback_center=req.fallback_center,
                )

            total_frames = 0
            last_progress = 0

            def progress_callback(current: int, total: int):
                nonlocal total_frames, last_progress
                total_frames = total
                last_progress = current

            # Run heavy processing in thread pool
            yield f"data: {json.dumps({'stage': 'processing', 'progress': 1, 'message': 'Bắt đầu xử lý video...', 'mode': mode})}\n\n"

            # We need to run process and stream progress simultaneously
            # Use a shared state approach
            import threading
            progress_data = {"current": 0, "total": 0, "done": False, "error": None}

            def _run_crop():
                try:
                    def _progress(current, total):
                        progress_data["current"] = current
                        progress_data["total"] = total

                    pipe.process(
                        input_path=req.input_path,
                        output_path=req.output_path,
                        progress=False,
                        progress_callback=_progress,
                        encode_crf=req.encode_crf,
                        encode_preset=req.encode_preset,
                    )
                    progress_data["done"] = True
                except Exception as e:
                    progress_data["error"] = str(e)
                    progress_data["done"] = True

            thread = threading.Thread(target=_run_crop, daemon=True)
            thread.start()

            # Stream progress updates
            while not progress_data["done"]:
                await asyncio.sleep(0.5)
                total = progress_data["total"]
                current = progress_data["current"]
                if total > 0:
                    pct = int(current / total * 95)  # Reserve 5% for muxing
                    yield f"data: {json.dumps({'stage': 'processing', 'progress': pct, 'message': f'Frame {current}/{total}', 'mode': mode, 'current_frame': current, 'total_frames': total})}\n\n"

            # Check for errors
            if progress_data["error"]:
                raise RuntimeError(progress_data["error"])

            total_frames = progress_data["total"]

            yield f"data: {json.dumps({'stage': 'done', 'progress': 100, 'message': f'Hoàn thành! {total_frames} frames đã xử lý', 'mode': mode, 'output': req.output_path, 'total_frames': total_frames})}\n\n"

        except Exception as e:
            logger.error(f"Smart Crop failed: {e}")
            yield f"data: {json.dumps({'stage': 'error', 'progress': -1, 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ─── Analyze (tracking only, no render) ──────────────────
@router.post("/smart-crop/analyze")
async def analyze_video(req: AnalyzeRequest):
    """
    AI Analyze — chạy YOLOv8 tracking, xuất tracking JSON.
    Streams progress via SSE. Trả tracking_json_path khi done.
    """
    import json

    if not os.path.exists(req.input_path):
        raise HTTPException(400, f"File not found: {req.input_path}")

    async def event_stream():
        mode = "GPU"
        try:
            from app.engines.tracking_face.pipeline import FaceCrop916
            from app.engines.tracking_face.tracking_io import save_tracking, tracking_path_for

            gpu_id = _detect_gpu()
            if gpu_id < 0:
                mode = "CPU"
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'GPU không khả dụng — chế độ CPU', 'mode': 'CPU'})}\n\n"
            else:
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'Đang khởi tạo AI model...', 'mode': 'GPU'})}\n\n"

            try:
                pipe = FaceCrop916(
                    gpu_id=gpu_id,
                    alpha=req.alpha,
                    dead_zone=req.dead_zone,
                    detect_every=req.detect_every,
                    fallback_center=req.fallback_center,
                )
            except Exception as gpu_err:
                logger.warning(f"GPU init failed, falling back to CPU: {gpu_err}")
                mode = "CPU"
                yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'GPU lỗi — chuyển CPU', 'mode': 'CPU'})}\n\n"
                pipe = FaceCrop916(
                    gpu_id=-1,
                    alpha=req.alpha,
                    dead_zone=req.dead_zone,
                    detect_every=req.detect_every,
                    fallback_center=req.fallback_center,
                )

            import threading
            result_data = {"tracking_json_path": None, "done": False, "error": None}
            progress_data = {"current": 0, "total": 0}

            def _run_analyze():
                try:
                    def _progress(current, total):
                        progress_data["current"] = current
                        progress_data["total"] = total

                    tracking = pipe.analyze(
                        input_path=req.input_path,
                        progress_callback=_progress,
                    )
                    # Save tracking JSON cạnh video gốc
                    json_path = tracking_path_for(req.input_path)
                    save_tracking(tracking, json_path)
                    result_data["tracking_json_path"] = str(json_path)
                    result_data["done"] = True
                except Exception as e:
                    result_data["error"] = str(e)
                    result_data["done"] = True

            thread = threading.Thread(target=_run_analyze, daemon=True)
            thread.start()

            while not result_data["done"]:
                await asyncio.sleep(0.5)
                total = progress_data["total"]
                current = progress_data["current"]
                if total > 0:
                    pct = int(current / total * 100)
                    yield f"data: {json.dumps({'stage': 'analyzing', 'progress': pct, 'message': f'Analyzing frame {current}/{total}', 'mode': mode, 'current_frame': current, 'total_frames': total})}\n\n"

            if result_data["error"]:
                raise RuntimeError(result_data["error"])

            yield f"data: {json.dumps({'stage': 'done', 'progress': 100, 'message': 'Analyze hoàn thành!', 'mode': mode, 'tracking_json_path': result_data['tracking_json_path']})}\n\n"

        except Exception as e:
            logger.error(f"Analyze failed: {e}")
            yield f"data: {json.dumps({'stage': 'error', 'progress': -1, 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ─── Render from tracking data ───────────────────────────
@router.post("/smart-crop/render")
async def render_from_tracking(req: RenderRequest):
    """
    Render video 9:16 từ tracking JSON đã có.
    Không cần chạy lại AI. Hỗ trợ keyframe overrides.
    """
    import json

    if not os.path.exists(req.input_path):
        raise HTTPException(400, f"Video not found: {req.input_path}")
    if not os.path.exists(req.tracking_json_path):
        raise HTTPException(400, f"Tracking JSON not found: {req.tracking_json_path}")

    output_dir = os.path.dirname(req.output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    async def event_stream():
        try:
            from app.engines.tracking_face.pipeline import FaceCrop916
            from app.engines.tracking_face.tracking_io import load_tracking, apply_keyframes

            yield f"data: {json.dumps({'stage': 'init', 'progress': 0, 'message': 'Đang tải tracking data...'})}\n\n"

            tracking_data = load_tracking(req.tracking_json_path)

            # Apply keyframes nếu có
            if req.keyframes:
                tracking_data = apply_keyframes(tracking_data, req.keyframes)

            pipe = FaceCrop916(
                out_resolution=(req.out_width, req.out_height),
            )

            import threading
            progress_data = {"current": 0, "total": 0, "done": False, "error": None}

            def _run_render():
                try:
                    def _progress(current, total):
                        progress_data["current"] = current
                        progress_data["total"] = total

                    pipe.render_from_tracking(
                        input_path=req.input_path,
                        output_path=req.output_path,
                        tracking_data=tracking_data,
                        out_resolution=(req.out_width, req.out_height),
                        encode_crf=req.encode_crf,
                        encode_preset=req.encode_preset,
                        progress_callback=_progress,
                    )
                    progress_data["done"] = True
                except Exception as e:
                    progress_data["error"] = str(e)
                    progress_data["done"] = True

            thread = threading.Thread(target=_run_render, daemon=True)
            thread.start()

            while not progress_data["done"]:
                await asyncio.sleep(0.5)
                total = progress_data["total"]
                current = progress_data["current"]
                if total > 0:
                    pct = int(current / total * 95)
                    yield f"data: {json.dumps({'stage': 'rendering', 'progress': pct, 'message': f'Rendering frame {current}/{total}', 'current_frame': current, 'total_frames': total})}\n\n"

            if progress_data["error"]:
                raise RuntimeError(progress_data["error"])

            yield f"data: {json.dumps({'stage': 'done', 'progress': 100, 'message': 'Render hoàn thành!', 'output': req.output_path})}\n\n"

        except Exception as e:
            logger.error(f"Render failed: {e}")
            yield f"data: {json.dumps({'stage': 'error', 'progress': -1, 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# ─── GPU Status Check ────────────────────────────────────
@router.get("/smart-crop/gpu-status")
async def gpu_status():
    """Check GPU availability for Smart Crop."""
    gpu_id = _detect_gpu()
    if gpu_id >= 0:
        try:
            import torch
            gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "Unknown NVIDIA GPU"
            vram_total = torch.cuda.get_device_properties(0).total_memory / (1024**3) if torch.cuda.is_available() else 0
            return {"available": True, "mode": "GPU", "device": gpu_name, "vram_gb": round(vram_total, 1)}
        except ImportError:
            return {"available": True, "mode": "GPU", "device": "NVIDIA GPU (torch not available for details)"}
    return {"available": False, "mode": "CPU", "device": "CPU only"}
