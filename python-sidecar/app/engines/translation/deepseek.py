"""
DeepSeek Translation Engine — online API.
Retry with exponential backoff. 7 translation styles.
"""
import asyncio
import logging
from typing import Optional

import httpx

from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

STYLE_PROMPTS = {
    "default": (
        "You are a professional translator. Translate the following text "
        "naturally and accurately into {target_lang}. Keep the original "
        "meaning, tone, and context. Return ONLY the translated text."
    ),
    "cinema": (
        "You are a professional movie dubbing translator. Translate with "
        "cinematic, dramatic tone suitable for movie/drama dubbing into "
        "{target_lang}. Maintain emotional intensity. Return ONLY the translated text."
    ),
    "vlog": (
        "You are a friendly vlogger translator. Translate casually and "
        "naturally as if speaking to your audience in {target_lang}. "
        "Return ONLY the translated text."
    ),
    "sport": (
        "You are a sports commentator translator. Translate with energy "
        "and excitement suitable for sports commentary in {target_lang}. "
        "Return ONLY the translated text."
    ),
    "animal": (
        "You are a nature documentary narrator translator. Translate warmly "
        "and gently, suitable for animal/nature content in {target_lang}. "
        "Return ONLY the translated text."
    ),
    "science": (
        "You are a science communicator translator. Translate precisely and "
        "clearly, suitable for educational/tech content in {target_lang}. "
        "Return ONLY the translated text."
    ),
    "review": (
        "You are a product reviewer translator. Translate in an engaging "
        "review style suitable for product/tech reviews in {target_lang}. "
        "Return ONLY the translated text."
    ),
}


class DeepSeekTranslation(TranslationEngine):
    """DeepSeek API translation engine."""

    engine_name = "deepseek"
    is_online = True

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.deepseek.com/v1",
        model: str = "deepseek-chat",
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        """Dịch text qua DeepSeek API với retry exponential backoff."""
        system_prompt = self._build_prompt(target_lang, style, custom_prompt)

        async def _call():
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": text},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2048,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

        return await self._retry_with_backoff(_call)

    async def health_check(self) -> bool:
        """Quick check: dịch 'hello' để verify API key."""
        try:
            result = await self.translate("hello", "en", "vi")
            return bool(result)
        except Exception:
            return False

    def _build_prompt(
        self, target_lang: str, style: str, custom_prompt: str
    ) -> str:
        """Build system prompt từ style + custom prompt."""
        base = STYLE_PROMPTS.get(style, STYLE_PROMPTS["default"])
        prompt = base.format(target_lang=target_lang)

        if custom_prompt:
            prompt += f"\n\nAdditional instructions: {custom_prompt}"

        return prompt

    async def _retry_with_backoff(
        self,
        func,
        max_retries: int = 3,
        initial_delay: float = 1.0,
    ):
        """Retry với exponential backoff cho API errors."""
        delay = initial_delay
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                return await func()
            except httpx.HTTPStatusError as e:
                last_error = e
                status = e.response.status_code
                if status in (429, 500, 502, 503) and attempt < max_retries:
                    logger.warning(
                        f"DeepSeek API error {status}, "
                        f"retry {attempt + 1}/{max_retries} "
                        f"in {delay:.1f}s"
                    )
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, 30.0)
                else:
                    raise
            except httpx.ConnectError as e:
                last_error = e
                if attempt < max_retries:
                    logger.warning(
                        f"DeepSeek connection error, "
                        f"retry {attempt + 1}/{max_retries} "
                        f"in {delay:.1f}s"
                    )
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, 30.0)
                else:
                    raise

        raise TranslationError(
            f"DeepSeek API failed after {max_retries} retries: {last_error}"
        )
