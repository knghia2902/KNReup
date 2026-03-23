"""GPU/CUDA/FFmpeg detection utilities."""
import subprocess
import ctypes
import os


def detect_gpu() -> dict:
    """Detect NVIDIA GPU và CUDA version."""
    result = {
        "gpu_available": False,
        "gpu_name": None,
        "cuda_version": None,
        "cuda_major": None,
        "compute_type": "float32",  # CPU default
        "driver_version": None,
    }

    # Check nvidia-smi
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,driver_version",
             "--format=csv,noheader"],
            timeout=5, stderr=subprocess.DEVNULL
        ).decode().strip()
        if output:
            parts = output.split(",")
            result["gpu_available"] = True
            result["gpu_name"] = parts[0].strip()
            if len(parts) > 1:
                result["driver_version"] = parts[1].strip()
    except (FileNotFoundError, subprocess.SubprocessError):
        pass

    # Check CUDA version
    if result["gpu_available"]:
        for cuda_ver, dll_name in [
            ("12", "cublas64_12.dll"),
            ("11", "cublas64_11.dll")
        ]:
            try:
                ctypes.CDLL(dll_name)
                result["cuda_version"] = cuda_ver
                result["cuda_major"] = int(cuda_ver)
                result["compute_type"] = "float16"
                break
            except OSError:
                continue

    return result


def detect_ffmpeg() -> dict:
    """Check FFmpeg có sẵn không."""
    try:
        output = subprocess.check_output(
            ["ffmpeg", "-version"], timeout=5, stderr=subprocess.DEVNULL
        ).decode().strip()
        version_line = output.split('\n')[0]
        return {"available": True, "version": version_line}
    except (FileNotFoundError, subprocess.SubprocessError):
        return {"available": False, "version": None}


def detect_all_dependencies() -> dict:
    """Kiểm tra tất cả dependencies."""
    gpu = detect_gpu()
    ffmpeg = detect_ffmpeg()

    # Tạo summary text giống VideoTransAI
    if gpu["gpu_available"]:
        gpu_text = f"✅ {gpu['gpu_name']}"
        if gpu["cuda_version"]:
            gpu_text += f" (CUDA {gpu['cuda_version']}, {gpu['compute_type']})"
    else:
        gpu_text = "❌ Không tìm thấy GPU — sẽ dùng CPU"

    ffmpeg_text = (
        f"✅ {ffmpeg['version']}" if ffmpeg["available"]
        else "❌ Chưa cài FFmpeg"
    )

    return {
        "gpu": gpu,
        "ffmpeg": ffmpeg,
        "summary": {
            "gpu": gpu_text,
            "ffmpeg": ffmpeg_text,
        },
        "all_ok": ffmpeg["available"],  # GPU optional, FFmpeg bắt buộc
    }
