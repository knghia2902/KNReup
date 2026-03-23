"""
Argos Offline Translation Engine — CTranslate2/Argos-based.
No API key needed. Works without internet.
"""
import logging
from typing import Optional

from app.engines.base import TranslationEngine, TranslationError

logger = logging.getLogger(__name__)


class ArgosTranslation(TranslationEngine):
    """Offline translation using argostranslate."""

    engine_name = "argos"
    is_online = False

    def __init__(self):
        self._initialized = False

    def _ensure_init(self):
        """Lazy init: import argostranslate khi cần."""
        if not self._initialized:
            try:
                import argostranslate.package
                import argostranslate.translate

                self._initialized = True
            except ImportError:
                raise TranslationError(
                    "argostranslate not installed. "
                    "Run: pip install argostranslate"
                )

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        style: str = "default",
        custom_prompt: str = "",
    ) -> str:
        """Dịch offline. Style/custom_prompt được bỏ qua (engine đơn giản)."""
        self._ensure_init()

        try:
            import argostranslate.translate

            # Map code ngắn sang code argos
            src = source_lang if source_lang != "auto" else "en"

            translated = argostranslate.translate.translate(
                text, src, target_lang
            )
            return translated
        except Exception as e:
            raise TranslationError(f"Argos translation failed: {e}")

    async def health_check(self) -> bool:
        """Check if argostranslate installed và models loaded."""
        try:
            self._ensure_init()
            import argostranslate.translate

            languages = argostranslate.translate.get_installed_languages()
            return len(languages) > 0
        except Exception:
            return False

    async def list_available_models(self) -> list[dict]:
        """List installed translation models."""
        try:
            self._ensure_init()
            import argostranslate.translate

            languages = argostranslate.translate.get_installed_languages()
            return [
                {"code": lang.code, "name": lang.name}
                for lang in languages
            ]
        except Exception:
            return []

    async def install_model(self, from_code: str, to_code: str) -> bool:
        """Download and install a translation model."""
        try:
            self._ensure_init()
            import argostranslate.package

            argostranslate.package.update_package_index()
            available = argostranslate.package.get_available_packages()

            pkg = next(
                (
                    p
                    for p in available
                    if p.from_code == from_code and p.to_code == to_code
                ),
                None,
            )

            if pkg:
                argostranslate.package.install_from_path(pkg.download())
                logger.info(f"Installed Argos model: {from_code} -> {to_code}")
                return True
            else:
                logger.warning(
                    f"No Argos model found for {from_code} -> {to_code}"
                )
                return False
        except Exception as e:
            logger.error(f"Argos model install failed: {e}")
            return False
