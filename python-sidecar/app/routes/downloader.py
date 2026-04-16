"""
Download routes — analyze, start, status, stream, history, cancel, cookie management.
SSE progress streaming follows the same pattern as pipeline.py.
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.engines.downloader import get_download_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/download")


# ─── Models ───────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    url: str


class StartDownloadRequest(BaseModel):
    url: str
    format_id: str = ""
    output_dir: str = ""


class CookieSyncRequest(BaseModel):
    browser: str = "edge"


# ─── Analyze ──────────────────────────────────────────────
@router.post("/analyze")
async def analyze_url(req: AnalyzeRequest):
    """Analyze video URL — extract metadata and available formats."""
    try:
        manager = get_download_manager()
        result = await manager.analyze(req.url)
        return result
    except Exception as e:
        logger.error(f"Analyze failed: {e}")
        raise HTTPException(400, f"Failed to analyze URL: {str(e)}")


# ─── Start Download ──────────────────────────────────────
@router.post("/start")
async def start_download(req: StartDownloadRequest):
    """Start downloading a video. Returns download_id for tracking."""
    try:
        manager = get_download_manager()
        download_id = await manager.start_download(
            url=req.url,
            format_id=req.format_id,
            output_dir=req.output_dir,
        )
        return {"download_id": download_id, "status": "started"}
    except Exception as e:
        logger.error(f"Start download failed: {e}")
        raise HTTPException(400, f"Failed to start download: {str(e)}")


# ─── Status ──────────────────────────────────────────────
@router.get("/status/{download_id}")
async def get_status(download_id: int):
    """Get current download status."""
    manager = get_download_manager()
    status = await manager.get_status(download_id)
    if not status:
        raise HTTPException(404, f"Download {download_id} not found")
    return status


# ─── SSE Progress Stream ────────────────────────────────
@router.get("/stream/{download_id}")
async def stream_progress(download_id: int):
    """SSE stream for real-time download progress updates."""
    manager = get_download_manager()
    
    # Verify download exists
    status = await manager.get_status(download_id)
    if not status:
        raise HTTPException(404, f"Download {download_id} not found")

    async def event_stream():
        queue: asyncio.Queue = asyncio.Queue()

        async def on_progress(data):
            await queue.put(data)

        manager.register_progress_callback(download_id, on_progress)

        try:
            # Send initial status
            yield f"data: {json.dumps({'download_id': download_id, 'status': status.get('status', 'pending'), 'progress': status.get('progress', 0)})}\n\n"

            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(data)}\n\n"

                    # Stop streaming when download finishes
                    if data.get('status') in ('completed', 'error', 'cancelled'):
                        break
                except asyncio.TimeoutError:
                    # Send keepalive
                    current = await manager.get_status(download_id)
                    if current:
                        yield f"data: {json.dumps({'download_id': download_id, 'status': current.get('status'), 'progress': current.get('progress', 0), 'keepalive': True})}\n\n"
                        if current.get('status') in ('completed', 'error', 'cancelled'):
                            break
                    else:
                        break
        finally:
            manager.unregister_progress_callback(download_id, on_progress)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# ─── History ─────────────────────────────────────────────
@router.get("/history")
async def get_history(
    limit: int = 50,
    offset: int = 0,
    platform: Optional[str] = "all",
):
    """Get download history with optional platform filter."""
    manager = get_download_manager()
    history = await manager.get_history(
        limit=limit,
        offset=offset,
        platform=platform if platform != 'all' else None,
    )
    return {"downloads": history, "total": len(history)}


# ─── Delete ──────────────────────────────────────────────
@router.delete("/{download_id}")
async def delete_download(download_id: int, delete_file: bool = False):
    """Delete download record and optionally the file."""
    manager = get_download_manager()
    deleted = await manager.delete_download_record(download_id, delete_file=delete_file)
    if not deleted:
        raise HTTPException(404, f"Download {download_id} not found")
    return {"deleted": True}


# ─── Cancel ──────────────────────────────────────────────
@router.post("/cancel/{download_id}")
async def cancel_download(download_id: int):
    """Cancel a running download."""
    manager = get_download_manager()
    cancelled = await manager.cancel_download(download_id)
    if not cancelled:
        raise HTTPException(400, f"Download {download_id} is not running")
    return {"cancelled": True}


# ─── Cookie Sync ─────────────────────────────────────────
@router.post("/cookie/sync")
async def sync_cookie(req: CookieSyncRequest):
    """Sync Douyin cookie from browser."""
    manager = get_download_manager()
    result = await manager.sync_douyin_cookie(req.browser)
    return result


# ─── Cookie Status ───────────────────────────────────────
@router.get("/cookie/status")
async def cookie_status():
    """Check Douyin cookie validity."""
    manager = get_download_manager()
    result = await manager.check_douyin_cookie()
    return result
