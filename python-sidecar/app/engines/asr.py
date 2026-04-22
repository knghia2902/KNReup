"""
Whisper ASR Engine — faster-whisper integration.
Model strategy: base (CPU) / large-v3 (GPU), dựa trên VRAM detect.
VAD Silero + chunked processing.
"""
import logging
import os
from pathlib import Path
from typing import Optional
from app.utils.gpu_detect import _inject_nvidia_dll_paths

logger = logging.getLogger(__name__)

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
                    num_workers=1
                )
            except Exception as e:
                logger.error(f"CRITICAL: Failed to load model on {self.device} (error: {e}).")
                # MANDATORY GPU: Không tự ý quay về CPU theo yêu cầu của người dùng
                raise RuntimeError(
                    f"GPU Mandatory mode failed: Could not load Whisper on {self.device}. "
                    f"Reason: {str(e)}. Please check CUDA/cuDNN installation."
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

        # Ưu tiên large-v3 cho GPU, base cho CPU
        if gpu_available:
            logger.info("GPU identified: Forcing large-v3 on CUDA.")
            return ("large-v3", "cuda", "int8_float16")
        
        logger.info("GPU not found: Falling back to base on CPU.")
        return ("base", "cpu", "int8")

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
