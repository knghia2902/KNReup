from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
import httpx
import os
import mimetypes
import logging
import urllib.parse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/proxy")
async def proxy_url(url: str):
    """
    Proxy cho cả URL remote và file local để tránh CORS và mixed content.
    - Remote: fetch qua httpx
    - Local: Trả về trực tiếp nếu file tồn tại
    """
    logger.info(f"Proxy request for: {url}")
    
    # Headers mặc định cho CORS nếu middleware gặp vấn đề
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }

    if not url:
        return JSONResponse(
            status_code=400, 
            content={"detail": "URL is required"},
            headers=cors_headers
        )

    try:
        # 1. Xử lý path local
        target_path = url
        
        if not os.path.exists(target_path):
            decoded_url = urllib.parse.unquote(url)
            if os.path.exists(decoded_url):
                target_path = decoded_url
                logger.info(f"Using double-decoded path: {target_path}")

        if os.path.exists(target_path):
            if os.path.isfile(target_path):
                try:
                    file_size = os.path.getsize(target_path)
                    logger.info(f"Local file found: {target_path} (Size: {file_size} bytes)")
                    
                    with open(target_path, "rb") as f:
                        f.read(1)
                except Exception as access_err:
                    logger.error(f"File access error for {target_path}: {access_err}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": f"File is locked or inaccessible: {str(access_err)}"},
                        headers=cors_headers
                    )

                mime_type, _ = mimetypes.guess_type(target_path)
                return FileResponse(
                    target_path, 
                    media_type=mime_type or "application/octet-stream",
                    headers=cors_headers
                )
            else:
                logger.warning(f"Path is a directory, not a file: {target_path}")
        
        # 2. Nếu là remote URL
        if target_path.startswith("http"):
            logger.info(f"Proxying remote URL: {target_path}")
            async def stream():
                try:
                    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                        async with client.stream("GET", target_path) as req:
                            if req.status_code >= 400:
                                logger.error(f"Remote server returned {req.status_code} for {target_path}")
                                return
                                
                            async for chunk in req.aiter_bytes():
                                yield chunk
                except Exception as stream_err:
                    logger.error(f"Streaming error for {target_path}: {stream_err}")
            
            return StreamingResponse(
                stream(),
                media_type="audio/mpeg",
                headers=cors_headers
            )
        
        logger.warning(f"File or URL not found: {target_path}")
        return JSONResponse(
            status_code=404, 
            content={"detail": f"File or URL not found: {target_path}"},
            headers=cors_headers
        )
        
    except Exception as e:
        logger.error(f"Proxy internal error: {e}")
        return JSONResponse(
            status_code=500, 
            content={"detail": str(e)},
            headers=cors_headers
        )
