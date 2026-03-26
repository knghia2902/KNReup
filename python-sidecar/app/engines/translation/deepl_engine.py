import logging
import requests
from typing import Optional
from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class DeepLTranslation(TranslationEngine):
    engine_name = "deepl"
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
        domain = "api-free.deepl.com" if self.api_key.endswith(":fx") else "api.deepl.com"
        url = f"https://{domain}/v2/translate"
        
        headers = {
            "Authorization": f"DeepL-Auth-Key {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Format language codes, e.g. "en" to "EN", deepL uses uppercase
        src = source_lang.upper() if source_lang != "auto" else None
        tgt = target_lang.upper()
        # DeepL specific EN/PT variations
        if tgt == "EN": tgt = "EN-US"
        if tgt == "PT": tgt = "PT-BR"

        payload = {
            "text": [text],
            "target_lang": tgt,
        }
        if src:
            payload["source_lang"] = src

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            return data["translations"][0]["text"].strip()
        except Exception as e:
            raise TranslationError(f"DeepL API request failed: {e}")

    async def health_check(self) -> bool:
        return bool(self.api_key)
