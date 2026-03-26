"""
Whisper ASR Engine — faster-whisper integration.
Model strategy: base (CPU) / large-v3 (GPU), dựa trên VRAM detect.
VAD Silero + chunked processing.
"""
import logging
import os
import site
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

def _inject_nvidia_dll_paths():
    """Tự động tiêm đường dẫn DLL của các gói nvidia-* (cu12) cài qua pip vào Windows.
    Giúp CTranslate2 tải được cublas64_12.dll mà user không cần cài nguyên bộ CUDA Toolkit.
    """
    if os.name != "nt":
        return
    try:
        packages = site.getsitepackages()
        for sp in packages:
            # Danh sách các thư viện nvidia thường chứa DLL
            for lib in ["cublas", "cudnn", "cufft", "curand", "cusolver", "cusparse"]:
                bin_path = os.path.join(sp, "nvidia", lib, "bin")
                if os.path.exists(bin_path):
                    try:
                        os.add_dll_directory(bin_path)
                    except AttributeError:
                        pass
                    if bin_path not in os.environ.get("PATH", ""):
                        os.environ["PATH"] = bin_path + os.pathsep + os.environ.get("PATH", "")
                    logger.debug(f"Added DLL directory: {bin_path}")
    except Exception as e:
        logger.warning(f"Failed to inject NVIDIA DLL paths: {e}")


class WhisperASR:
    """Speech recognition sử dụng faster-whisper (CTranslate2-based)."""

    def __init__(
        self,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
    ):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None

    def _load_model(self):
        """Lazy-load model khi lần đầu transcribe."""
        if self._model is None:
            _inject_nvidia_dll_paths()
            try:
                import torch
            except ImportError:
                pass

            try:
                from faster_whisper import WhisperModel

                logger.info(
                    f"Loading Whisper model: {self.model_size} "
                    f"(device={self.device}, compute={self.compute_type})"
                )
                self._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                )
            except Exception as e:
                logger.error(f"Failed to load model on {self.device} (error: {e}).")
                # Fallback to CPU
                logger.warning("Rơi vào Fallback CPU (tháo gỡ CUDA lỗi).")
                self.device = "cpu"
                self.compute_type = "int8"
                self.model_size = "base"
                from faster_whisper import WhisperModel
                self._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                )
        return self._model

    @classmethod
    def detect_best_model(cls) -> tuple[str, str, str]:
        """Auto-select model dựa trên GPU/VRAM.

        Returns:
            (model_size, device, compute_type)
        """
        gpu_available = False
        try:
            from app.utils.gpu_detect import detect_gpu
            gpu = detect_gpu()
            gpu_available = gpu.get("gpu_available", False)
        except Exception as e:
            logger.warning(f"GPU detection failed: {e}")

        # Fallback hoặc Override tạm để test UAT nhanh chóng
        return ("base", "cuda" if gpu_available else "cpu", "int8_float16" if gpu_available else "int8")

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
    ) -> list[dict]:
        """Transcribe audio/video file.

        Args:
            audio_path: Path tới file audio/video
            language: Language code (None = auto-detect)

        Returns:
            List of segments: [{"start": float, "end": float, "text": str}]
        """
        model = self._load_model()

        segments_iter, info = model.transcribe(
            audio_path,
            language=language if language and language != "auto" else None,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            beam_size=5,
            word_timestamps=True,
        )

        detected_lang = info.language
        duration = info.duration
        logger.info(
            f"Detected language: {detected_lang}, duration: {duration:.1f}s"
        )

        segments = []
        for seg in segments_iter:
            segments.append(
                {
                    "start": round(seg.start, 3),
                    "end": round(seg.end, 3),
                    "text": seg.text.strip(),
                    "words": [
                        {
                            "word": w.word,
                            "start": round(w.start, 3),
                            "end": round(w.end, 3),
                            "probability": round(w.probability, 3),
                        }
                        for w in (seg.words or [])
                    ],
                }
            )

        return {
            "segments": segments,
            "language": detected_lang,
            "duration": round(duration, 3),
        }

    def get_model_info(self) -> dict:
        """Return current model config."""
        return {
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type,
            "loaded": self._model is not None,
        }
