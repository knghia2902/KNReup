"""Pipeline routes — transcribe, translate, TTS, process endpoints."""
import os
import tempfile
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pipeline")

# ─── Models ───────────────────────────────────────────────
class TranscribeRequest(BaseModel):
    video_path: str
    language: Optional[str] = None

class ProcessRequest(BaseModel):
    video_path: str
    config_json: str = "{}"

class RenderRequest(ProcessRequest):
    segments: list[dict]
    duration: float
    output_path: Optional[str] = None

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
    elif engine_name == "gemini":
        from app.engines.translation.gemini import GeminiTranslation
        if not api_key: raise HTTPException(400, "Gemini API key required")
        return GeminiTranslation(api_key=api_key)
    elif engine_name == "deepl":
        from app.engines.translation.deepl_engine import DeepLTranslation
        if not api_key: raise HTTPException(400, "DeepL API key required")
        return DeepLTranslation(api_key=api_key)
    elif engine_name == "ollama":
        from app.engines.translation.ollama import OllamaTranslation
        return OllamaTranslation(url=api_key)
    elif engine_name == "nllb":
        from app.engines.translation.nllb import NLLBTranslation
        return NLLBTranslation()
    elif engine_name == "openai":
        from app.engines.translation.openai_engine import OpenAITranslation
        if not api_key: raise HTTPException(400, "OpenAI API key required")
        return OpenAITranslation(api_key=api_key)
    else:
        raise HTTPException(400, f"Unknown translation engine: {engine_name}")


# ─── Transcribe ───────────────────────────────────────────
@router.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    """Whisper ASR → segments using local video path."""
    try:
        if not os.path.exists(req.video_path):
            raise HTTPException(400, f"File not found: {req.video_path}")

        # Transcribe
        from app.engines.asr import WhisperASR

        model_size, device, compute_type = WhisperASR.detect_best_model()
        asr = WhisperASR(
            model_size=model_size,
            device=device,
            compute_type=compute_type,
        )

        result = asr.transcribe(req.video_path, language=req.language)
        return result

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(500, f"Transcription failed: {str(e)}")


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
@router.post("/analyze")
async def analyze_pipeline(req: ProcessRequest):
    """Analyze pipeline (Transcribe + Translate) with SSE progress streaming."""
    import json
    from app.pipeline_runner import PipelineRunner, PipelineConfig

    if not os.path.exists(req.video_path):
        raise HTTPException(400, f"File not found: {req.video_path}")

    # Parse config
    try:
        cfg = json.loads(req.config_json)
    except json.JSONDecodeError:
        cfg = {}

    pipeline_config = PipelineConfig(**cfg)

    async def event_stream():
        runner = PipelineRunner()
        async for event in runner.run_analyze(req.video_path, pipeline_config):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )

@router.post("/render")
async def render_pipeline(req: RenderRequest):
    """Render pipeline (TTS + Merge) with SSE progress streaming."""
    import json
    from app.pipeline_runner import PipelineRunner, PipelineConfig

    if not os.path.exists(req.video_path):
        raise HTTPException(400, f"File not found: {req.video_path}")

    try:
        cfg = json.loads(req.config_json)
    except json.JSONDecodeError:
        cfg = {}

    pipeline_config = PipelineConfig(**cfg)

    async def event_stream():
        runner = PipelineRunner()
        async for event in runner.run_render(req.video_path, pipeline_config, req.segments, req.duration, target_path=req.output_path):
            yield f"data: {json.dumps(event)}\n\n"

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
async def process_simple(req: ProcessRequest):
    """Non-streaming pipeline for testing."""
    import json
    from app.pipeline_runner import PipelineRunner, PipelineConfig

    if not os.path.exists(req.video_path):
        raise HTTPException(400, f"File not found: {req.video_path}")

    try:
        cfg = json.loads(req.config_json) if req.config_json != "{}" else {}
        pipeline_config = PipelineConfig(**cfg)

        runner = PipelineRunner()
        last_event = {}
        async for event in runner.run_analyze(req.video_path, pipeline_config):
            last_event = event

        return last_event

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(500, f"Pipeline failed: {str(e)}")

