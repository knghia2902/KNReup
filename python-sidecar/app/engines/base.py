"""
Abstract base classes for KNReup engines.
Extension pattern: tất cả Translation/TTS engines kế thừa từ đây.
Phase 4 sẽ thêm: Gemini, OpenAI, gTTS, SmartVoice.
"""
from abc import ABC, abstractmethod
from typing import Optional


class EngineError(Exception):
    """Base engine error."""
    pass


class TranslationError(EngineError):
    """Lỗi khi dịch thuật."""
    pass


class TTSError(EngineError):
    """Lỗi khi tạo giọng nói."""
    pass


class TranslationEngine(ABC):
    """Abstract base cho translation engines.

    Tất cả translation engines (DeepSeek, Argos, Gemini, OpenAI) phải implement:
    - translate(): dịch 1 đoạn text
    - health_check(): kiểm tra engine còn hoạt động
    """

    engine_name: str = "unknown"
    is_online: bool = True

    @abstractmethod
    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        """Dịch text. Raise TranslationError nếu thất bại."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check engine available."""
        ...

    async def translate_segments(
        self,
        segments: list[dict],
        source_lang: str,
        target_lang: str,
        **kwargs,
    ) -> list[dict]:
        """Dịch list segments, giữ nguyên timing."""
        results = []
        for seg in segments:
            translated = await self.translate(
                seg["text"], source_lang, target_lang, **kwargs
            )
            results.append({**seg, "translated": translated})
        return results


class TTSEngine(ABC):
    """Abstract base cho TTS engines.

    Tất cả TTS engines (Edge TTS, Piper, gTTS, SmartVoice) phải implement:
    - synthesize(): tạo audio file từ text
    - list_voices(): liệt kê giọng có sẵn
    - health_check(): kiểm tra engine
    """

    engine_name: str = "unknown"
    is_online: bool = True

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: str,
        output_path: str,
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Tạo audio file. Return output_path."""
        ...

    @abstractmethod
    async def list_voices(self) -> list[dict]:
        """Return available voices [{name, locale, gender}]."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check engine available."""
        ...
