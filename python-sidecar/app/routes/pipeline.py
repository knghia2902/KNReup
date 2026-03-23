"""Pipeline routes — transcribe, translate, TTS, process endpoints."""
import os
import tempfile
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pipeline")


# ─── Models ───────────────────────────────────────────────
class TranslateRequest(BaseModel):
    segments: list[dict]
    source_lang: str = "auto"
    target_lang: str = "vi"
    engine: str = "deepseek"
    style: str = "default"
    custom_prompt: str = ""
    api_key: str = ""


# ─── Engine factories ─────────────────────────────────────
def get_translation_engine(engine_name: str, api_key: str = ""):
    """Factory: tạo translation engine instance."""
    if engine_name == "deepseek":
        from app.engines.translation.deepseek import DeepSeekTranslation

        if not api_key:
            raise HTTPException(400, "DeepSeek API key required")
        return DeepSeekTranslation(api_key=api_key)
    elif engine_name == "argos":
        from app.engines.translation.offline import ArgosTranslation

        return ArgosTranslation()
    else:
        raise HTTPException(400, f"Unknown translation engine: {engine_name}")


# ─── Transcribe ───────────────────────────────────────────
@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = None,
):
    """Upload audio/video → Whisper ASR → segments."""
    temp_path = None
    try:
        # Save uploaded file to temp
        suffix = os.path.splitext(file.filename or "upload.mp4")[1]
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, mode="wb"
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        # Transcribe
        from app.engines.asr import WhisperASR

        model_size, device, compute_type = WhisperASR.detect_best_model()
        asr = WhisperASR(
            model_size=model_size,
            device=device,
            compute_type=compute_type,
        )

        result = asr.transcribe(temp_path, language=language)
        return result

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(500, f"Transcription failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


# ─── Translate ────────────────────────────────────────────
@router.post("/translate")
async def translate(req: TranslateRequest):
    """Dịch segments qua translation engine."""
    try:
        engine = get_translation_engine(req.engine, req.api_key)

        translated = await engine.translate_segments(
            segments=req.segments,
            source_lang=req.source_lang,
            target_lang=req.target_lang,
            style=req.style,
            custom_prompt=req.custom_prompt,
        )

        return {
            "segments": translated,
            "engine_used": engine.engine_name,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(500, f"Translation failed: {str(e)}")
