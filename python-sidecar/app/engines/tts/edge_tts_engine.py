"""
Edge TTS Engine — Microsoft Neural TTS (free, online).
Default voice: vi-VN-HoaiMyNeural.
"""
import logging
from pathlib import Path

from app.engines.base import TTSEngine, TTSError

logger = logging.getLogger(__name__)


class EdgeTTSEngine(TTSEngine):
    """Microsoft Edge TTS — free neural voices."""

    engine_name = "edge_tts"
    is_online = True

    async def synthesize(
        self,
        text: str,
        voice: str = "vi-VN-HoaiMyNeural",
        output_path: str = "output.mp3",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Tạo audio file từ text bằng Edge TTS."""
        try:
            import edge_tts

            kwargs = {}
            if rate != 1.0:
                kwargs["rate"] = self._format_rate(rate)
            if volume != 1.0:
                kwargs["volume"] = self._format_volume(volume)
            if pitch != 1.0:
                kwargs["pitch"] = self._format_pitch(pitch)

            communicate = edge_tts.Communicate(
                text,
                voice,
                **kwargs
            )

            await communicate.save(output_path)
            logger.info(f"Edge TTS saved: {output_path} (voice={voice})")
            return output_path

        except Exception as e:
            raise TTSError(f"Edge TTS synthesis failed: {e}")

    async def list_voices(self, locale_filter: str = "vi") -> list[dict]:
        """Liệt kê available voices, filter theo locale."""
        try:
            import edge_tts

            voices = await edge_tts.list_voices()
            result = []
            for v in voices:
                if locale_filter and not v["Locale"].startswith(locale_filter):
                    continue
                result.append(
                    {
                        "name": v["ShortName"],
                        "locale": v["Locale"],
                        "gender": v["Gender"],
                        "friendly_name": v.get("FriendlyName", v["ShortName"]),
                    }
                )
            return result

        except Exception as e:
            logger.error(f"Edge TTS list_voices failed: {e}")
            return []

    async def health_check(self) -> bool:
        """Check Edge TTS available (cần internet)."""
        try:
            voices = await self.list_voices()
            return len(voices) > 0
        except Exception:
            return False

    @staticmethod
    def _format_rate(rate: float) -> str:
        """Convert rate float (1.0 = normal) to Edge TTS format."""
        pct = int((rate - 1.0) * 100)
        return f"+{pct}%" if pct >= 0 else f"{pct}%"

    @staticmethod
    def _format_volume(volume: float) -> str:
        """Convert volume float (1.0 = normal) to Edge TTS format."""
        pct = int((volume - 1.0) * 100)
        return f"+{pct}%" if pct >= 0 else f"{pct}%"

    @staticmethod
    def _format_pitch(pitch: float) -> str:
        """Convert pitch float (1.0 = normal) to Edge TTS format."""
        hz = int((pitch - 1.0) * 50)
        return f"+{hz}Hz" if hz >= 0 else f"{hz}Hz"
