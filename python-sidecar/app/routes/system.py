"""System check endpoint — dependency checker."""
from fastapi import APIRouter
from app.utils.gpu_detect import detect_all_dependencies

router = APIRouter()


@router.get("/system/check")
async def check_dependencies():
    """Kiểm tra tất cả dependencies (GPU, FFmpeg, etc.)."""
    data = detect_all_dependencies()
    
    # Bổ sung check ONNX Runtime providers
    try:
        import onnxruntime
        data["onnx_providers"] = onnxruntime.get_available_providers()
    except:
        data["onnx_providers"] = ["onnxruntime not installed"]
        
    return data
