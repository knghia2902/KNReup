import logging
from typing import Optional
from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class NLLBTranslation(TranslationEngine):
    engine_name = "nllb"
    is_online = False

    def __init__(self):
        self._model = None
        self._tokenizer = None

    def _ensure_init(self):
        if self._model is None:
            try:
                from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
                # Fallback model size: 600M is capable enough and ~1.2GB in RAM
                model_name = "facebook/nllb-200-distilled-600M"
                logger.info(f"Loading NLLB model: {model_name}")
                self._tokenizer = AutoTokenizer.from_pretrained(model_name)
                self._model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            except ImportError:
                raise TranslationError("Transformers/Torch not installed. Run: pip install transformers torch sentencepiece")
            except Exception as e:
                raise TranslationError(f"Failed to load NLLB model: {e}")

    def _map_lang(self, code: str) -> str:
        """Map ISO codes to NLLB flores-200 codes."""
        code = code.lower()
        mapping = {
            "en": "eng_Latn",
            "vi": "vie_Latn",
            "zh": "zho_Hans",
            "ja": "jpn_Jpan",
            "ko": "kor_Hang",
            "fr": "fra_Latn",
        }
        return mapping.get(code, "eng_Latn")

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        self._ensure_init()
        try:
            import torch
            src_lang = self._map_lang(source_lang if source_lang != "auto" else "en")
            tgt_lang = self._map_lang(target_lang)

            self._tokenizer.src_lang = src_lang
            inputs = self._tokenizer(text, return_tensors="pt")
            
            # Generate translation
            forced_bos_token_id = self._tokenizer.convert_tokens_to_ids(tgt_lang)
            outputs = self._model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_token_id,
                max_length=200
            )
            
            return self._tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        except Exception as e:
            raise TranslationError(f"NLLB translation failed: {e}")

    async def health_check(self) -> bool:
        try:
            import transformers
            return True
        except ImportError:
            return False
