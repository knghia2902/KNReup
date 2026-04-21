from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import httpx

router = APIRouter()

@router.get("/proxy")
async def proxy_url(url: str):
    async def stream():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url) as req:
                async for chunk in req.aiter_bytes():
                    yield chunk
    return StreamingResponse(
        stream(),
        media_type="audio/mpeg",
        headers={"Access-Control-Allow-Origin": "*"}
    )
