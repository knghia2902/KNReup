"""GPU/CUDA/FFmpeg detection utilities."""
import subprocess
import ctypes
import os
import site
import logging

logger = logging.getLogger(__name__)

# Lưu trữ handles để tránh bị garbage collected và lặp lại
_injected_handles = []
_injected_paths = set()

def _inject_nvidia_dll_paths():
    """Đăng ký bộ thư viện CUDA 12.4 thống nhất từ Torch Lib cho toàn bộ ứng dụng."""
    global _injected_handles, _injected_paths
    if os.name != "nt":
        return
    
    if _injected_handles and _injected_handles[0] is not None:
        return

    try:
        import sys
        import site
        
        # 1. Tìm đường dẫn Torch Lib
        torch_lib = None
        bases = [sys.prefix]
        try:
            bases += site.getsitepackages()
        except: pass
        
        for base in bases:
            path = os.path.join(base, "Lib", "site-packages", "torch", "lib")
            if os.path.exists(path):
                torch_lib = os.path.abspath(path)
                break
        
        if torch_lib:
            # ƯU TIÊN TUYỆT ĐỐI: Thêm vào đầu PATH và dùng add_dll_directory
            # Điều này giúp tránh Error 127 (cudnnGetLibConfig) do load nhầm DLL cũ trong System32
            os.environ["PATH"] = torch_lib + os.pathsep + os.environ.get("PATH", "")
            try:
                handle = os.add_dll_directory(torch_lib)
                _injected_handles.append(handle)
                logger.info(f"Fixed Error 127: Prioritized CUDA 12.4 from {torch_lib}")
            except: pass
            
        # 2. Vô hiệu hóa việc tìm kiếm DLL trong thư mục hệ thống để tránh xung đột
        # (Chỉ áp dụng cho tiến trình này)
        try:
            import kernel32
            kernel32 = ctypes.windll.kernel32
            # LOAD_LIBRARY_SEARCH_DEFAULT_DIRS | LOAD_LIBRARY_SEARCH_USER_DIRS
            kernel32.SetDefaultDllDirectories(0x00001000 | 0x00000400)
        except: pass
            
        if not _injected_handles:
            _injected_handles.append(None)
            
    except Exception as e:
        logger.warning(f"CUDA Unification warning: {e}")

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
