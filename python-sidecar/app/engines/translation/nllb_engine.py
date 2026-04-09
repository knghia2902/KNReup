"""
NLLB Translation Engine — CTranslate2-based.
No Language Left Behind (Meta) - directly translates without pivoting.
"""
import logging
import os
from typing import Optional

from huggingface_hub import snapshot_download

from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)


class NLLBTranslation(TranslationEngine):
    """Offline direct translation using NLLB-200 via CTranslate2."""

    engine_name = "nllb"
    is_online = False

    def __init__(self):
        self._translator = None
        self._tokenizer = None
        self.model_id = "JustFrederik/nllb-200-distilled-600M-ct2-int8"
        self.local_dir = os.path.join(os.path.expanduser("~"), ".cache", "knreup_nllb")

    def _map_language_code(self, lang_code: str) -> str:
        """Map knreup standard codes to NLLB BCP-47 identifiers."""
        # NLLB requires full tokens like zho_Hans, eng_Latn, vie_Latn
        mapping = {
            "zh": "zho_Hans",
            "zh-CN": "zho_Hans",
            "ch": "zho_Hans",
            "en": "eng_Latn",
            "vi": "vie_Latn",
            "ko": "kor_Hang",
            "ja": "jpn_Jpan",
            "fr": "fra_Latn",
            "auto": "eng_Latn" # Fallback if entirely unknown
        }
        return mapping.get(lang_code, "eng_Latn")

    def _ensure_init(self, src_lang: str):
        """Auto download via huggingface hub and load CTranslate2 model."""
        if self._translator is None or self._tokenizer is None:
            try:
                import ctranslate2
                import transformers
            except ImportError:
                raise TranslationError(
                    "Missing dependencies for NLLB. "
                    "Run: pip install ctranslate2 transformers huggingface-hub"
                )

            logger.info(f"Checking/Downloading NLLB model {self.model_id} to {self.local_dir}...")
            try:
                # This will only download files if they don't exist locally
                model_path = snapshot_download(
                    repo_id=self.model_id,
                    local_dir=self.local_dir,
                    local_dir_use_symlinks=False
                )
                
                logger.info(f"Loading NLLB ctranslate2 model from {model_path}")
                # Use int8 quantization for speed, fallback to CPU if GPU has issues
                from app.engines.asr import WhisperASR, _inject_nvidia_dll_paths
                _inject_nvidia_dll_paths()
                
                _, device, compute_type = WhisperASR.detect_best_model() # Reuse robust GPU detector
                
                # NLLB might have specific compute type constraints, int8 works well
                self._translator = ctranslate2.Translator(
                    model_path, 
                    device=device,
                    compute_type="int8" if compute_type.startswith("int8") else "default"
                )
                
                mapped_src = self._map_language_code(src_lang)
                self._tokenizer = transformers.AutoTokenizer.from_pretrained(
                    model_path, 
                    src_lang=mapped_src
                )
            except Exception as e:
                logger.error(f"Failed to load NLLB model: {e}")
                raise TranslationError(f"Failed to load NLLB: {e}")
        else:
            # If already loaded, we must ensure correct source lang token is active
            mapped_src = self._map_language_code(src_lang)
            if self._tokenizer.src_lang != mapped_src:
                self._tokenizer.src_lang = mapped_src

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        """Translate directly using NLLB Seq2Seq model."""
        # Sanity check for empty strings
        if not text or not text.strip():
            return text
            
        self._ensure_init(source_lang)
        
        target_lang_mapped = self._map_language_code(target_lang)
        
        try:
            import asyncio
            
            def _run_translate():
                # Tokenize
                source = self._tokenizer.convert_ids_to_tokens(
                    self._tokenizer.encode(text)
                )
                # Translate via ctranslate2
                target_prefix = [target_lang_mapped]
                results = self._translator.translate_batch(
                    [source], 
                    target_prefix=[target_prefix]
                )
                # Detokenize
                target = results[0].hypotheses[0][1:] # Skip language prefix
                
                translated_text = self._tokenizer.decode(
                    self._tokenizer.convert_tokens_to_ids(target)
                )
                return translated_text

            return await asyncio.to_thread(_run_translate)
            
        except Exception as e:
            logger.error(f"NLLB translation failed: {e}")
            raise TranslationError(f"NLLB translation failed: {e}")

    async def health_check(self) -> bool:
        """Kiểm tra tình trạng NLLB có thể init được."""
        return True
