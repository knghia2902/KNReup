from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
import httpx
import os
import mimetypes
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/proxy")
async def proxy_url(url: str):
    """
    Proxy cho cả URL remote và file local để tránh CORS và mixed content.
    - Remote: fetch qua httpx
    - Local: Trả về trực tiếp nếu file tồn tại
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        # Kiểm tra nếu là file local
        # url đã được FastAPI tự động decode từ query param
        if os.path.exists(url) and os.path.isfile(url):
            mime_type, _ = mimetypes.guess_type(url)
            logger.info(f"Proxying local file: {url} ({mime_type})")
            return FileResponse(
                url, 
                media_type=mime_type or "application/octet-stream"
            )

        # Nếu là remote URL
        if url.startswith("http"):
            logger.info(f"Proxying remote URL: {url}")
            async def stream():
                try:
                    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                        async with client.stream("GET", url) as req:
                            if req.status_code >= 400:
                                logger.error(f"Remote server returned {req.status_code} for {url}")
                                yield b"Error: Remote server returned " + str(req.status_code).encode()
                                return
                                
                            async for chunk in req.aiter_bytes():
                                yield chunk
                except Exception as stream_err:
                    logger.error(f"Streaming error for {url}: {stream_err}")
                    # Không thể yield lỗi ở đây vì header đã được gửi, nhưng ít nhất không làm crash server
            
            return StreamingResponse(
                stream(),
                media_type="audio/mpeg" # Mặc định cho audio, browser sẽ tự detect nếu là video
            )
        
        logger.warning(f"File or URL not found: {url}")
        raise HTTPException(status_code=404, detail="File or URL not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Proxy internal error for {url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
