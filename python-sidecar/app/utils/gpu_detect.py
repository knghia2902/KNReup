"""GPU/CUDA/FFmpeg detection utilities."""
import subprocess
import ctypes
import os
import site
import logging

logger = logging.getLogger(__name__)

def _inject_nvidia_dll_paths():
    """Tự động tiêm đường dẫn DLL của các gói nvidia-* (cu12/cu11) cài qua pip vào Windows."""
    if os.name != "nt":
        return
    try:
        import sys
        # Ưu tiên các site-packages từ sys.path để bao quát cả venv
        potential_bases = [sys.prefix] + site.getsitepackages()
        for base in potential_bases:
            sp = os.path.join(base, "Lib", "site-packages")
            if not os.path.exists(sp):
                sp = base # fallback cho custom layouts
            
            for lib in ["cublas", "cudnn", "cufft", "curand", "cusolver", "cusparse"]:
                bin_path = os.path.join(sp, "nvidia", lib, "bin")
                if os.path.exists(bin_path):
                    try:
                        os.add_dll_directory(bin_path)
                    except AttributeError:
                        pass
                    if bin_path not in os.environ.get("PATH", ""):
                        os.environ["PATH"] = bin_path + os.pathsep + os.environ.get("PATH", "")
    except Exception as e:
        pass

def detect_gpu() -> dict:
    """Detect NVIDIA GPU và CUDA version."""
    _inject_nvidia_dll_paths()
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

    # Check CUDA & cuDNN DLLs on Windows
    if result["gpu_available"]:
        has_cublas = False
        has_cudnn = False
        
        # Check cuBLAS
        for dll in ["cublas64_12.dll", "cublas64_11.dll"]:
            try:
                ctypes.CDLL(dll)
                has_cublas = True
                result["cuda_version"] = "12" if "12" in dll else "11"
                result["cuda_major"] = 12 if "12" in dll else 11
                break
            except OSError:
                continue
        
        # Check cuDNN
        for dll in ["cudnn64_9.dll", "cudnn64_8.dll"]:
            try:
                ctypes.CDLL(dll)
                has_cudnn = True
                break
            except OSError:
                continue

        if has_cublas and has_cudnn:
            result["compute_type"] = "float16"
        else:
            if not has_cublas: logger.warning("Missing cuBLAS DLL")
            if not has_cudnn: logger.warning("Missing cuDNN DLL")
            # If missing one of them, we might still try CUDA but it's risky.
            # For faster-whisper (CTranslate2), both are usually needed for 'cuda' device.
            result["compute_type"] = "float32" 

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
