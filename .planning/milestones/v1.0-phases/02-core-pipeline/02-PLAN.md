---
phase: 2
plan: 2
title: "Abstract Engine Interfaces + Translation Engines"
wave: 1
depends_on: []
files_modified:
  - python-sidecar/app/engines/base.py
  - python-sidecar/app/engines/translation/__init__.py
  - python-sidecar/app/engines/translation/deepseek.py
  - python-sidecar/app/engines/translation/offline.py
  - python-sidecar/app/routes/pipeline.py
  - python-sidecar/requirements.txt
requirements_addressed: [R1.3, R1.4]
autonomous: true
---

# Plan 02: Abstract Engine Interfaces + Translation Engines

<objective>
Tạo abstract base classes cho Translation + TTS engines (extension pattern cho Phase 4).
Implement 2 translation engines: DeepSeek API (online) + CTranslate2/Argos (offline).
Exponential backoff retry cho API calls.
</objective>

## Tasks

<task id="2.1">
<title>Tạo abstract base classes</title>
<read_first>
- python-sidecar/app/engines/__init__.py
</read_first>
<action>
Tạo `python-sidecar/app/engines/base.py`:

```python
from abc import ABC, abstractmethod
from typing import Optional

class TranslationEngine(ABC):
    """Abstract base cho translation engines."""
    
    engine_name: str = "unknown"
    is_online: bool = True
    
    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str,
                       style: str = "default", custom_prompt: str = "") -> str:
        """Dịch text. Raise TranslationError nếu thất bại."""
        ...
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check engine available."""
        ...
    
    async def translate_segments(self, segments: list[dict], source_lang: str,
                                  target_lang: str, **kwargs) -> list[dict]:
        """Dịch list segments, giữ nguyên timing."""
        results = []
        for seg in segments:
            translated = await self.translate(seg["text"], source_lang, target_lang, **kwargs)
            results.append({**seg, "translated": translated})
        return results


class TTSEngine(ABC):
    """Abstract base cho TTS engines."""
    
    engine_name: str = "unknown"
    is_online: bool = True
    
    @abstractmethod
    async def synthesize(self, text: str, voice: str, output_path: str,
                         rate: float = 1.0, volume: float = 1.0, pitch: float = 0.5) -> str:
        """Tạo audio file. Return output_path."""
        ...
    
    @abstractmethod
    async def list_voices(self) -> list[dict]:
        """Return available voices [{name, locale, gender}]."""
        ...
    
    @abstractmethod
    async def health_check(self) -> bool:
        ...
```

Tạo exception classes:
```python
class EngineError(Exception):
    """Base engine error."""
    pass

class TranslationError(EngineError):
    pass

class TTSError(EngineError):
    pass
```
</action>
<acceptance_criteria>
- `base.py` contains `class TranslationEngine(ABC)`
- `base.py` contains `class TTSEngine(ABC)`
- `TranslationEngine` has abstract methods `translate`, `health_check`
- `TTSEngine` has abstract methods `synthesize`, `list_voices`, `health_check`
- `base.py` contains `class TranslationError(EngineError)`
- `base.py` contains `class TTSError(EngineError)`
- `translate_segments` method is non-abstract with default batch implementation
</acceptance_criteria>
</task>

<task id="2.2">
<title>Implement DeepSeek translation engine</title>
<read_first>
- python-sidecar/app/engines/base.py
</read_first>
<action>
Tạo `python-sidecar/app/engines/translation/__init__.py` (empty).

Tạo `python-sidecar/app/engines/translation/deepseek.py`:
- Class `DeepSeekTranslation(TranslationEngine)`:
  - `engine_name = "deepseek"`
  - `is_online = True`
  - Constructor: `api_key: str, base_url: str = "https://api.deepseek.com/v1"`
  - `translate()`: POST to DeepSeek chat/completions API
    - Model: `deepseek-chat`
    - System prompt: build translation prompt based on `style` param
    - Style mapping: `default` → neutral, `cinema` → cinematic/dramatic, `vlog` → casual, etc.
    - Custom prompt: append nếu `custom_prompt` not empty
  - `health_check()`: quick test translate "hello" → check response
  - **Retry logic**: exponential backoff, max 3 retries, initial delay 1s, max delay 30s
    - Catch: httpx.HTTPStatusError (429, 500, 502, 503), httpx.ConnectError
    - Log mỗi retry attempt

```python
import asyncio
import httpx

STYLE_PROMPTS = {
    "default": "Translate naturally and accurately.",
    "cinema": "Translate with cinematic, dramatic tone suitable for movie dubbing.",
    "vlog": "Translate casually, like a friendly vlogger speaking.",
    "sport": "Translate with sports commentary energy.",
    "animal": "Translate warmly, suitable for animal documentary narration.",
    "science": "Translate precisely, suitable for science/tech content.",
    "review": "Translate in a product review style.",
}

async def _retry_with_backoff(self, func, max_retries=3, initial_delay=1.0):
    delay = initial_delay
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except (httpx.HTTPStatusError, httpx.ConnectError) as e:
            if attempt == max_retries:
                raise TranslationError(f"DeepSeek API failed after {max_retries} retries: {e}")
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30.0)
```
</action>
<acceptance_criteria>
- `deepseek.py` contains `class DeepSeekTranslation(TranslationEngine)`
- `engine_name` is `"deepseek"`
- `translate` method uses `httpx.AsyncClient` for API calls
- `STYLE_PROMPTS` dict contains keys: `default`, `cinema`, `vlog`, `sport`, `animal`, `science`, `review`
- Retry logic with exponential backoff present
- `max_retries=3` and `initial_delay=1.0` in retry logic
</acceptance_criteria>
</task>

<task id="2.3">
<title>Implement CTranslate2/Argos offline translation</title>
<read_first>
- python-sidecar/app/engines/base.py
- python-sidecar/app/engines/translation/deepseek.py (pattern reference)
</read_first>
<action>
Tạo `python-sidecar/app/engines/translation/offline.py`:
- Class `ArgosTranslation(TranslationEngine)`:
  - `engine_name = "argos"`
  - `is_online = False`
  - Constructor: check if `argostranslate` installed, download model nếu cần
  - `translate()`: dùng argostranslate API
    - `import argostranslate.translate`
    - `argostranslate.translate.translate(text, from_code, to_code)`
  - `health_check()`: check if models loaded
  - Note: style/custom_prompt ignored (offline engine đơn giản)
</action>
<acceptance_criteria>
- `offline.py` contains `class ArgosTranslation(TranslationEngine)`
- `engine_name` is `"argos"`
- `is_online` is `False`
- `translate` method imports from `argostranslate`
- `health_check` method present
</acceptance_criteria>
</task>

<task id="2.4">
<title>Tạo translate endpoint</title>
<read_first>
- python-sidecar/app/routes/pipeline.py (transcribe endpoint pattern)
</read_first>
<action>
Add to `python-sidecar/app/routes/pipeline.py`:

Endpoint `POST /api/pipeline/translate`:
- Body JSON: `{"segments": [...], "source_lang": "en", "target_lang": "vi", "engine": "deepseek", "style": "default", "api_key": "..."}`
- Process: instantiate engine → translate_segments → return translated segments
- Engine factory: `get_translation_engine(engine_name, api_key)` → return correct engine instance
- Return: `{"segments": [...], "engine_used": str}`
</action>
<acceptance_criteria>
- `pipeline.py` contains `POST` endpoint for `/api/pipeline/translate`
- Endpoint accepts JSON body with `segments`, `engine`, `api_key`
- `get_translation_engine` function creates correct engine instance
- Response includes `engine_used` field
</acceptance_criteria>
</task>

## Verification

- `python -c "from app.engines.base import TranslationEngine, TTSEngine; print('OK')"` succeeds
- `python -c "from app.engines.translation.deepseek import DeepSeekTranslation; print('OK')"` succeeds
- `curl -X POST http://127.0.0.1:8008/api/pipeline/translate -H "Content-Type: application/json" -d '{"segments":[{"start":0,"end":1,"text":"hello"}],"engine":"argos","target_lang":"vi"}'` returns translated segments

## must_haves
- Abstract interfaces extensible cho Phase 4 engines
- DeepSeek retry with exponential backoff
- Offline fallback works without internet
- Style prompts mapping (7 styles từ VideoTransAI config)
