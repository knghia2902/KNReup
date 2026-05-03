"""Edge TTS Engine."""
import logging
import edge_tts
from typing import Optional

from app.engines.base import TTSEngine, TTSError

logger = logging.getLogger(__name__)

class EdgeTTSEngine(TTSEngine):
    """TTS using Microsoft Edge TTS (free, online, lightweight)."""
    
    engine_name = "edge-tts"
    is_online = True

    def __init__(self):
        pass

    async def synthesize(
        self,
        text: str,
        voice: str = "vi-VN-HoaiMyNeural",
        output_path: str = "output.mp3",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Synthesize speech using Edge TTS."""
        try:
            # Map parameters
            # edge-tts rate is +0% or -0%
            rate_pct = int((rate - 1.0) * 100)
            rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"
            
            communicate = edge_tts.Communicate(text, voice, rate=rate_str)
            await communicate.save(output_path)
            return output_path
        except Exception as e:
            raise TTSError(f"Edge TTS failed: {e}")

    async def list_voices(self) -> list[dict]:
        """List common Vietnamese voices from Edge TTS."""
        return [
            {"name": "Hoài My (Nữ)", "id": "vi-VN-HoaiMyNeural", "gender": "female", "locale": "vi-VN"},
            {"name": "Nam Minh (Nam)", "id": "vi-VN-NamMinhNeural", "gender": "male", "locale": "vi-VN"},
            {"name": "Christopher (En)", "id": "en-US-ChristopherNeural", "gender": "male", "locale": "en-US"},
            {"name": "Jenny (En)", "id": "en-US-JennyNeural", "gender": "female", "locale": "en-US"}
        ]

    async def health_check(self) -> bool:
        """Check if engine is configured."""
        return True
