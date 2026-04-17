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

# safe reload test
router = APIRouter(prefix="/api/download")



# ─── Models ───────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    url: str


class StartDownloadRequest(BaseModel):
    url: str
    format_id: str = ""
    output_dir: str = ""
    overwrites: bool = False


class CookieSyncRequest(BaseModel):
    browser: str = "auto"


class CookieSetRequest(BaseModel):
    cookie_string: str


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
            overwrites=req.overwrites,
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
    """Delete download record and optionally the file. Idempotent."""
    logger.info(f"DELETE request for download_id={download_id}")
    manager = get_download_manager()
    await manager.delete_download_record(download_id, delete_file=delete_file)
    return {"deleted": True}


# ─── Cancel ──────────────────────────────────────────────
@router.post("/cancel/{download_id}")
async def cancel_download(download_id: int):
    """Cancel a running download. Idempotent."""
    logger.info(f"CANCEL request for download_id={download_id}")
    manager = get_download_manager()
    await manager.cancel_download(download_id)
    return {"cancelled": True}



# ─── Cookie Sync ─────────────────────────────────────────
@router.post("/cookie/sync")
async def sync_cookie(req: CookieSyncRequest):
    """Sync Douyin cookie from browser."""
    manager = get_download_manager()
    result = await manager.sync_douyin_cookie(req.browser)
    return result


@router.post("/cookie/set")
async def set_cookie(req: CookieSetRequest):
    """Set Douyin cookie manually."""
    manager = get_download_manager()
    result = await manager.set_douyin_cookie(req.cookie_string)
    return result


# ─── Cookie Status ───────────────────────────────────────
@router.get("/cookie/status")
async def cookie_status():
    """Check Douyin cookie validity."""
    manager = get_download_manager()
    result = await manager.check_douyin_cookie()
    return result

@router.post("/open/{download_id}")
async def open_download_file(download_id: int):
    """Open the downloaded file."""
    manager = get_download_manager()
    success = await manager.open_file(download_id)
    if not success:
        raise HTTPException(400, "Failed to open file or file not found")
    return {"success": True}

@router.post("/show/{download_id}")
async def show_download_folder(download_id: int):
    """Show the downloaded file in folder."""
    manager = get_download_manager()
    success = await manager.show_in_folder(download_id)
    if not success:
        raise HTTPException(400, "Failed to show folder or file not found")
    return {"success": True}

@router.get("/check-file")
async def check_file(title: str, platform: str, video_id: str = ""):
    """Check if a video file exists on disk."""
    manager = get_download_manager()
    exists = await manager.check_file_existence(title, platform, video_id)
    return {"exists": exists}