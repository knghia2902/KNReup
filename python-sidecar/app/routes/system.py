"""System check endpoint — dependency checker."""
from fastapi import APIRouter
from app.utils.gpu_detect import detect_all_dependencies

router = APIRouter()


@router.get("/system/check")
async def check_dependencies():
    """Kiểm tra tất cả dependencies (GPU, FFmpeg, etc.)."""
    return detect_all_dependencies()
