import logging
import requests
from typing import Optional
from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class GeminiTranslation(TranslationEngine):
    engine_name = "gemini"
    is_online = True

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        prompt = (
            f"Translate the following text from {source_lang} to {target_lang}. "
            f"Ensure the translation is natural and fits a {style} style. "
            f"Return ONLY the translated text without any explanation, quotes or markdown.\n"
            f"User context: {custom_prompt}\n\n"
            f"Text to translate:\n{text}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
            }
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            try:
                translated = data["candidates"][0]["content"]["parts"][0]["text"]
                return translated.strip()
            except (KeyError, IndexError):
                raise TranslationError("Invalid response structure from Gemini API.")
        except Exception as e:
            raise TranslationError(f"Gemini API request failed: {e}")

    async def health_check(self) -> bool:
        return bool(self.api_key)
