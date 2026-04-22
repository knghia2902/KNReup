"""ElevenLabs TTS Engine."""
import logging
from typing import Optional
from pathlib import Path

from elevenlabs.client import ElevenLabs
from elevenlabs import save

from app.engines.base import TTSEngine, TTSError

logger = logging.getLogger(__name__)

class ElevenLabsTTSEngine(TTSEngine):
    """Cloud TTS using ElevenLabs."""
    
    engine_name = "elevenlabs"
    is_online = True

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        # Delay initialization until we actually have the key if needed
        self.client = ElevenLabs(api_key=self.api_key) if self.api_key else None

    async def synthesize(
        self,
        text: str,
        voice: str = "Rachel",
        output_path: str = "output.mp3",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Synthesize speech using ElevenLabs."""
        if not self.client:
            if not self.api_key:
                raise TTSError("ElevenLabs API key is missing.")
            self.client = ElevenLabs(api_key=self.api_key)

        try:
            # ElevenLabs does not directly support speed/rate parameter in basic generate
            # We'll just generate the standard voice.
            audio = self.client.generate(
                text=text,
                voice=voice,
                model="eleven_multilingual_v2"
            )
            save(audio, output_path)
            return output_path
        except Exception as e:
            raise TTSError(f"ElevenLabs TTS failed: {e}")

    async def list_voices(self) -> list[dict]:
        """List all available voices from ElevenLabs."""
        if not self.client:
            if not self.api_key:
                raise TTSError("ElevenLabs API key is missing.")
            self.client = ElevenLabs(api_key=self.api_key)
            
        try:
            voices_response = self.client.voices.get_all()
            result = []
            for v in voices_response.voices:
                result.append({
                    "name": v.name,
                    "id": v.voice_id,
                    "gender": "neutral",
                    "locale": "multilingual"
                })
            return result
        except Exception as e:
            raise TTSError(f"Failed to list ElevenLabs voices: {e}")

    async def health_check(self) -> bool:
        """Check if engine is configured."""
        return bool(self.api_key)
