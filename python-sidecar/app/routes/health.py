"""Health check endpoint."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Kiểm tra sidecar đang chạy."""
    return {
        "status": "ok",
        "service": "knreup-sidecar",
        "version": "0.1.0",
    }
