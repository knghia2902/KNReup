"""
Helsinki-NLP OPUS-MT Translation Engine.
MarianMT based models. Directly translates specific language pairs (e.g., zh-vi).
Extremely fast and lightweight (~300MB), fine-tuned on OpenSubtitles.
"""
import logging
import os
import asyncio
from typing import Optional

from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)

class HelsinkiOPUSTranslation(TranslationEngine):
    """Offline direct translation using Helsinki-NLP OPUS-MT models."""

    engine_name = "opus"
    is_online = False

    def __init__(self):
        self._model = None
        self._tokenizer = None
        # Default model for zh -> vi
        self.model_id = "Helsinki-NLP/opus-mt-zh-vi"
        self._device = "cpu"

    def _ensure_init(self, src_lang: str, tgt_lang: str):
        """Lazy-load the specific MarianMT model based on language pair."""
        # For now, we hardcode the fallback or mapping since OPUS models are pair-specific.
        # If user asks for something else, OPUS might not have it loaded.
        # Our main use case is zh -> vi.
        
        # If source is "auto", we default to "zh" for OPUS because it's a dedicated zh-vi model.
        if src_lang == "auto":
            src_lang = "zh"
            
        pair = f"{src_lang}-{tgt_lang}"
        # We only strictly support zh-vi natively without dynamic loading overhead in this version
        if pair not in ["zh-vi", "ch-vi", "zh-CN-vi"]:
            logger.warning(f"OPUS-MT engine optimized for zh-vi. Using fallback for {pair} might fail.")
            
        if self._model is None or self._tokenizer is None:
            try:
                import torch
                from transformers import MarianMTModel, MarianTokenizer
                import sentencepiece # Required checks
            except ImportError:
                raise TranslationError(
                    "Missing dependencies. Run: pip install transformers sentencepiece huggingface-hub"
                )

            logger.info(f"Downloading/Loading OPUS-MT model {self.model_id}...")
            
            # Use GPU if available
            try:
                from app.engines.asr import WhisperASR
                _, device, _ = WhisperASR.detect_best_model()
                # MarianMT in transformers uses "cuda" 
                self._device = "cuda" if device == "cuda" else "cpu"
                if self._device == "cuda":
                    from app.engines.asr import _inject_nvidia_dll_paths
                    _inject_nvidia_dll_paths()
            except Exception:
                self._device = "cpu"

            try:
                self._tokenizer = MarianTokenizer.from_pretrained(self.model_id)
                self._model = MarianMTModel.from_pretrained(self.model_id).to(self._device)
                
                # OPUS models can be put into half precision for faster inference on GPU
                if self._device == "cuda":
                    self._model = self._model.half()
                    
                logger.info(f"Loaded OPUS-MT model {self.model_id} on {self._device}")
            except Exception as e:
                logger.error(f"Failed to load OPUS-MT model: {e}")
                raise TranslationError(f"Failed to load OPUS-MT: {e}")

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        """Translate directly using MarianMT Seq2Seq model."""
        if not text or not text.strip():
            return text
            
        self._ensure_init(source_lang, target_lang)
        
        try:
            def _run_translate():
                # Tokenize
                inputs = self._tokenizer(text, return_tensors="pt", padding=True)
                inputs = {k: v.to(self._device) for k, v in inputs.items()}
                
                # Generate translation
                translated_ids = self._model.generate(**inputs, max_length=128, num_beams=4)
                
                # Detokenize
                translated_text = self._tokenizer.batch_decode(translated_ids, skip_special_tokens=True)[0]
                return translated_text

            return await asyncio.to_thread(_run_translate)
            
        except Exception as e:
            logger.error(f"OPUS-MT translation failed: {e}")
            raise TranslationError(f"OPUS-MT translation failed: {e}")

    async def health_check(self) -> bool:
        return True
