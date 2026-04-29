import logging
import httpx
from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class OllamaTranslation(TranslationEngine):
    engine_name = "ollama"
    is_online = False

    def __init__(self, url: str, model: str = ""):
        self.url = url.rstrip('/')
        self.preset_model = model

    async def _get_model(self) -> str:
        if self.preset_model:
            return self.preset_model
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.url}/api/tags")
                resp.raise_for_status()
                models = [m["name"] for m in resp.json().get("models", [])]
                if not models:
                    raise TranslationError("No downloaded models found in Ollama.")
                # Prefer gemma4:e4b explicit user request
                chosen = next((m for m in models if "gemma" in m.lower()), None)
                if not chosen:
                    chosen = next((m for m in models if "qwen" in m.lower()), None)
                if not chosen:
                    chosen = next((m for m in models if "llama" in m.lower()), models[0])
                return chosen
        except Exception as e:
            raise TranslationError(f"Failed to fetch Ollama models: {e}")

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        model = await self._get_model()
        prompt = (
            f"You are a professional translator. Translate the following text from {source_lang} to {target_lang}. "
            f"Return ONLY the translated text without any explanation, markdown or reasoning.\n\n"
            f"Text:\n{text}"
        )

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1}
        }

        try:
            # Increase timeout to 300 seconds to allow for model loading into memory
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(f"{self.url}/api/generate", json=payload)
                resp.raise_for_status()
                return resp.json().get("response", "").strip()
        except Exception as e:
            raise TranslationError(f"Ollama generation failed: {e}")

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.url}/api/tags")
                return resp.status_code == 200
        except:
            return False
