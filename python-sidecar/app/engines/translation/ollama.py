import logging
import requests
from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class OllamaTranslation(TranslationEngine):
    engine_name = "ollama"
    is_online = False

    def __init__(self, url: str):
        self.url = url.rstrip('/')

    def _get_model(self) -> str:
        try:
            resp = requests.get(f"{self.url}/api/tags", timeout=5)
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            if not models:
                raise TranslationError("No downloaded models found in Ollama.")
            # Prefer qwen or llama
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
        model = self._get_model()
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
            resp = requests.post(f"{self.url}/api/generate", json=payload, timeout=60)
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
        except Exception as e:
            raise TranslationError(f"Ollama generation failed: {e}")

    async def health_check(self) -> bool:
        try:
            resp = requests.get(f"{self.url}/api/tags", timeout=5)
            return resp.status_code == 200
        except:
            return False
