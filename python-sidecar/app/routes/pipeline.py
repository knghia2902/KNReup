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


# ─── TTS engine factory ──────────────────────────────────
def get_tts_engine(engine_name: str):
    """Factory: tạo TTS engine instance."""
    if engine_name == "edge_tts":
        from app.engines.tts.edge_tts_engine import EdgeTTSEngine

        return EdgeTTSEngine()
    elif engine_name == "piper":
        from app.engines.tts.piper_engine import PiperTTSEngine

        return PiperTTSEngine()
    else:
        raise HTTPException(400, f"Unknown TTS engine: {engine_name}")


# ─── TTS Voices ───────────────────────────────────────────
@router.get("/voices")
async def list_voices(engine: str = "edge_tts"):
    """Liệt kê available voices cho engine."""
    try:
        tts = get_tts_engine(engine)
        voices = await tts.list_voices()
        return {"voices": voices, "engine": engine}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List voices failed: {e}")
        raise HTTPException(500, f"List voices failed: {str(e)}")


# ─── TTS Synthesis ────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    engine: str = "edge_tts"
    voice: str = "vi-VN-HoaiMyNeural"
    rate: float = 1.0
    volume: float = 1.0
    pitch: float = 0.5


@router.post("/tts-preview")
async def tts_preview(req: TTSRequest):
    """Tạo audio preview cho 1 đoạn text."""
    try:
        tts = get_tts_engine(req.engine)
        output_path = tempfile.mktemp(suffix=".mp3")
        await tts.synthesize(
            text=req.text,
            voice=req.voice,
            output_path=output_path,
            rate=req.rate,
            volume=req.volume,
            pitch=req.pitch,
        )
        return {"audio_path": output_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS preview failed: {e}")
        raise HTTPException(500, f"TTS preview failed: {str(e)}")


# ─── Full Pipeline (SSE) ─────────────────────────────────
@router.post("/process")
async def process_pipeline(
    file: UploadFile = File(...),
    config_json: str = "{}",
):
    """Full pipeline with SSE progress streaming."""
    import json
    from fastapi.responses import StreamingResponse
    from app.pipeline_runner import PipelineRunner, PipelineConfig

    # Save uploaded file
    temp_path = None
    try:
        suffix = os.path.splitext(file.filename or "upload.mp4")[1]
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, mode="wb"
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name
    except Exception as e:
        raise HTTPException(500, f"File upload failed: {str(e)}")

    # Parse config
    try:
        cfg = json.loads(config_json)
    except json.JSONDecodeError:
        cfg = {}

    pipeline_config = PipelineConfig(**cfg)

    async def event_stream():
        runner = PipelineRunner()
        async for event in runner.run(temp_path, pipeline_config):
            yield f"data: {json.dumps(event)}\n\n"
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# ─── Simple (non-streaming) ──────────────────────────────
@router.post("/process-simple")
async def process_simple(
    file: UploadFile = File(...),
    config_json: str = "{}",
):
    """Non-streaming pipeline for testing."""
    import json
    from app.pipeline_runner import PipelineRunner, PipelineConfig

    temp_path = None
    try:
        suffix = os.path.splitext(file.filename or "upload.mp4")[1]
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, mode="wb"
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        cfg = json.loads(config_json) if config_json != "{}" else {}
        pipeline_config = PipelineConfig(**cfg)

        runner = PipelineRunner()
        last_event = {}
        async for event in runner.run(temp_path, pipeline_config):
            last_event = event

        return last_event

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(500, f"Pipeline failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

