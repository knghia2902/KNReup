"""
Piper TTS Engine — offline ONNX-based TTS.
No internet needed. Small models (~30MB per language).
"""
import logging
import subprocess
import shutil
from pathlib import Path
from typing import Optional

from app.engines.base import TTSEngine, TTSError

logger = logging.getLogger(__name__)

# Default: models stored alongside sidecar
MODELS_DIR = Path(__file__).parent.parent.parent / "models" / "piper"


class PiperTTSEngine(TTSEngine):
    """Offline TTS using Piper (ONNX)."""

    engine_name = "piper"
    is_online = False

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self._models_dir = MODELS_DIR
        self._models_dir.mkdir(parents=True, exist_ok=True)

    async def synthesize(
        self,
        text: str,
        voice: str = "vi_VN-vivos-x_low",
        output_path: str = "output.wav",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Tạo audio file bằng Piper TTS."""
        try:
            model = self.model_path or str(
                self._models_dir / f"{voice}.onnx"
            )

            if not Path(model).exists():
                raise TTSError(
                    f"Piper model not found: {model}. "
                    f"Download it first with download_model()"
                )

            # Piper length_scale: 1.0 = normal speed
            # Invert rate: higher rate = lower length_scale
            length_scale = 1.0 / rate if rate > 0 else 1.0

            cmd = [
                "piper",
                "--model", model,
                "--output_file", output_path,
                "--length_scale", str(length_scale),
            ]

            proc = subprocess.run(
                cmd,
                input=text,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if proc.returncode != 0:
                raise TTSError(f"Piper error: {proc.stderr}")

            logger.info(f"Piper TTS saved: {output_path}")
            return output_path

        except TTSError:
            raise
        except Exception as e:
            raise TTSError(f"Piper TTS failed: {e}")

    async def list_voices(self) -> list[dict]:
        """Scan models directory for installed .onnx models."""
        models = []
        if self._models_dir.exists():
            for onnx_file in self._models_dir.glob("*.onnx"):
                name = onnx_file.stem
                models.append(
                    {
                        "name": name,
                        "locale": name.split("-")[0].replace("_", "-")
                        if "-" in name
                        else "unknown",
                        "gender": "neutral",
                        "path": str(onnx_file),
                    }
                )
        return models

    async def health_check(self) -> bool:
        """Check piper binary available."""
        return shutil.which("piper") is not None

    async def download_model(
        self,
        model_name: str = "vi_VN-vivos-x_low",
    ) -> bool:
        """Download Piper model from GitHub releases.

        Note: Simplified version. Full implementation would download
        from https://github.com/rhasspy/piper/releases
        """
        logger.info(f"Download Piper model: {model_name}")
        # TODO: Implement actual download logic from piper releases
        # For now, return False to indicate manual download needed
        return False
