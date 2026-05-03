"""Pipeline routes — transcribe, translate, TTS, process endpoints."""
import os
import asyncio
import tempfile
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline")

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
def get_translation_engine(engine_name: str, api_key: str = "", base_url: str = "", model: str = ""):
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
        if model:
            return OllamaTranslation(url=api_key, model=model)
        return OllamaTranslation(url=api_key)
    elif engine_name == "nllb":
        from app.engines.translation.nllb_engine import NLLBTranslation
        return NLLBTranslation()
    elif engine_name == "opus":
        from app.engines.translation.opus_engine import HelsinkiOPUSTranslation
        return HelsinkiOPUSTranslation()
    elif engine_name == "openai":
        from app.engines.translation.openai_engine import OpenAITranslation
        if not api_key: raise HTTPException(400, "OpenAI API key required")
        kwargs = {"api_key": api_key}
        if base_url: kwargs["base_url"] = base_url
        if model: kwargs["model"] = model
        return OpenAITranslation(**kwargs)
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
def get_tts_engine(engine_name: str, api_key: str = ""):
    """Factory: tạo TTS engine instance."""
    if engine_name == "omnivoice":
        from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine
        return OmniVoiceTTSEngine()
    elif engine_name == "elevenlabs":
        from app.engines.tts.elevenlabs_engine import ElevenLabsTTSEngine
        return ElevenLabsTTSEngine(api_key=api_key)
    elif engine_name == "edge-tts":
        from app.engines.tts.edge_tts_engine import EdgeTTSEngine
        return EdgeTTSEngine()
    else:
        from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine
        return OmniVoiceTTSEngine()


# ─── TTS Voices ───────────────────────────────────────────
@router.get("/voices")
async def list_voices(engine: str = "omnivoice", api_key: str = ""):
    """Liệt kê available voices cho engine."""
    try:
        tts = get_tts_engine(engine, api_key)
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
    engine: str = "omnivoice"
    voice: str = "vi-VN-HoaiMyNeural"
    rate: float = 1.0
    volume: float = 1.0
    pitch: float = 0.5
    speed: float = 1.0
    profile_name: Optional[str] = None
    api_key: str = ""


@router.post("/tts-preview")
async def tts_preview(req: TTSRequest):
    """Tạo audio preview cho 1 đoạn text."""
    try:
        tts = get_tts_engine(req.engine, req.api_key)
        output_path = tempfile.mktemp(suffix=".mp3")
        
        # Map profile_name to voice if needed for omnivoice
        voice = req.profile_name if req.profile_name else req.voice
        
        # Pass speed to rate
        await tts.synthesize(
            text=req.text,
            voice=voice,
            output_path=output_path,
            rate=req.speed,
            volume=req.volume,
            pitch=req.pitch,
        )
        return {"audio_path": output_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS preview failed: {e}")
        raise HTTPException(500, f"TTS preview failed: {str(e)}")

@router.post("/tts-demo")
async def tts_demo(req: TTSRequest):
    """Tạo audio preview và trả về Binary để nghe trực tiếp."""
    from fastapi.responses import FileResponse
    try:
        tts = get_tts_engine(req.engine, req.api_key)
        output_path = tempfile.mktemp(suffix=".mp3")
        
        voice = req.profile_name if req.profile_name else req.voice
        
        await tts.synthesize(
            text=req.text,
            voice=voice,
            output_path=output_path,
            rate=req.speed,
            volume=req.volume,
            pitch=req.pitch,
        )
        return FileResponse(output_path, media_type="audio/mpeg", filename="demo.mp3")
    except Exception as e:
        logger.error(f"TTS demo failed: {e}")
        raise HTTPException(500, f"TTS Demo failed: {str(e)}")

# ─── Full Pipeline (SSE) ─────────────────────────────────
from fastapi.responses import FileResponse
from pathlib import Path
import hashlib
import subprocess

thumb_semaphore = asyncio.Semaphore(2)

@router.get("/thumbnail")
async def get_thumbnail(video_path: str, time: float):
    """Lấy thumbnail ngẫu nhiên tại {time} của video có cache an toàn."""
    if not os.path.exists(video_path):
        raise HTTPException(400, "Video not found")
        
    cache_dir = Path(video_path).parent / ".thumbs"
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    vhash = hashlib.md5(video_path.encode()).hexdigest()[:8]
    cache_path = cache_dir / f"{vhash}_{time:.1f}.jpg"
    
    if cache_path.exists():
        return FileResponse(cache_path)
        
    async with thumb_semaphore:
        if cache_path.exists():
            return FileResponse(cache_path)
            
        def _extract():
            subprocess.run(
                [
                    'ffmpeg', '-y', '-ss', str(time), '-i', video_path, 
                    '-vframes', '1', '-q:v', '5', '-s', '160x90', str(cache_path)
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
            
        await asyncio.to_thread(_extract)
        
    if not cache_path.exists():
        raise HTTPException(500, "Thumbnail extraction failed")
        
    return FileResponse(cache_path)

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
    from app.pipeline_runner import PipelineRunner, PipelineConfig, _active_runner, cancel_active_pipeline
    import app.pipeline_runner as pr

    if not os.path.exists(req.video_path):
        raise HTTPException(400, f"File not found: {req.video_path}")

    try:
        cfg = json.loads(req.config_json)
    except json.JSONDecodeError:
        cfg = {}

    pipeline_config = PipelineConfig(**cfg)

    # Extract pre-generated dubbed audio path from config (if user ran "Generate Voice")
    pre_dubbed_path = cfg.get("dubbed_audio_path", None)

    async def event_stream():
        runner = PipelineRunner()
        pr._active_runner = runner  # Store for cancel
        try:
            async for event in runner.run_render(req.video_path, pipeline_config, req.segments, req.duration, target_path=req.output_path, dubbed_audio_path=pre_dubbed_path):
                yield f"data: {json.dumps(event)}\n\n"
        finally:
            pr._active_runner = None

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )

@router.post("/cancel")
async def cancel_pipeline():
    """Cancel the currently running pipeline and kill FFmpeg."""
    from app.pipeline_runner import cancel_active_pipeline
    cancel_active_pipeline()
    return {"cancelled": True}


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


# ─── TTS Batch (SSE) ─────────────────────────────────────
class TTSBatchRequest(BaseModel):
    project_id: str
    segments: list[dict]
    tts_engine: str = "omnivoice"
    voice: str = "vi-VN-HoaiMyNeural"
    speed: float = 1.0
    pitch: float = 0.5
    volume: float = 1.0
    voice_mapping: dict = {}
    duration: float = 0
    api_key: str = ""


class TTSSegmentRequest(BaseModel):
    project_id: str
    segment: dict
    tts_engine: str = "omnivoice"
    voice: str = "vi-VN-HoaiMyNeural"
    speed: float = 1.0
    pitch: float = 0.5
    volume: float = 1.0
    api_key: str = ""


@router.post("/tts-batch")
async def tts_batch(req: TTSBatchRequest):
    """TTS batch — generate voice cho tất cả segments, stream SSE progress."""
    import json
    import gc
    from pathlib import Path

    DATA_DIR = Path(__file__).parent.parent.parent / "data" / "projects"
    project_dir = DATA_DIR / req.project_id
    tts_dir = project_dir / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)

    async def event_stream():
        tts = None
        try:
            tts = get_tts_engine(req.tts_engine, req.api_key)
            total = len(req.segments)
            audio_files = []
            completed = 0

            yield f"data: {json.dumps({'stage': 'tts-batch', 'progress': 0, 'message': f'Starting TTS for {total} segments...'})}\n\n"

            # Reduce concurrency to 1 to prevent GPU Out Of Memory hard crashes on Windows
            sem = asyncio.Semaphore(1)

            async def _synth_one(i: int, seg: dict):
                async with sem:
                    seg_id = seg.get("id", i)
                    audio_path = tts_dir / f"seg_{int(seg_id):04d}.mp3"
                    text = seg.get("translated_text", seg.get("translated", seg.get("source_text", seg.get("text", ""))))

                    if not text.strip():
                        return None

                    # Determine voice — per-segment voice_mapping or default
                    voice = req.voice_mapping.get(str(seg_id), req.voice)

                    await tts.synthesize(
                        text=text,
                        voice=voice,
                        output_path=str(audio_path),
                        rate=req.speed,
                        volume=req.volume,
                        pitch=req.pitch,
                    )
                    return {
                        "seg_id": seg_id,
                        "audio_path": str(audio_path),
                        "filename": audio_path.name,
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                    }

            tasks = [asyncio.ensure_future(_synth_one(i, seg)) for i, seg in enumerate(req.segments)]

            for coro in asyncio.as_completed(tasks):
                res = await coro
                completed += 1
                progress = int(completed / total * 90)

                if res:
                    audio_files.append(res)
                    yield f"data: {json.dumps({'stage': 'tts-batch', 'progress': progress, 'message': f'Segment {completed}/{total} done', 'segment_result': res})}\n\n"
                else:
                    yield f"data: {json.dumps({'stage': 'tts-batch', 'progress': progress, 'message': f'Segment {completed}/{total} skipped (empty)'})}\n\n"

            # Merge into dubbed_audio.wav
            dubbed_path = None
            if audio_files:
                audio_files.sort(key=lambda x: x["start"])
                from app.pipeline_runner import PipelineRunner
                runner = PipelineRunner()
                merge_input = [{"path": af["audio_path"], "start": af["start"], "end": af["end"]} for af in audio_files]
                dubbed_path_str = str(tts_dir / "dubbed_audio.wav")
                try:
                    await runner._merge_tts_audio(merge_input, dubbed_path_str, req.duration, req.speed, req.pitch)
                    dubbed_path = dubbed_path_str
                except Exception as me:
                    logger.error(f"TTS merge failed: {me}")

            # Save project.json update with TTS paths
            project_json = project_dir / "project.json"
            if project_json.exists():
                proj_data = json.loads(project_json.read_text(encoding="utf-8"))
            else:
                proj_data = {}
            proj_data["tts_generated_at"] = __import__("time").time()
            if dubbed_path:
                proj_data["dubbed_audio_path"] = dubbed_path
            project_json.write_text(json.dumps(proj_data, ensure_ascii=False, indent=2), encoding="utf-8")

            yield f"data: {json.dumps({'stage': 'done', 'progress': 100, 'message': f'TTS complete: {len(audio_files)}/{total} segments', 'dubbed_audio_path': dubbed_path or '', 'audio_files': audio_files})}\n\n"

        except Exception as e:
            logger.error(f"TTS batch failed: {e}")
            yield f"data: {json.dumps({'stage': 'error', 'progress': -1, 'message': str(e)})}\n\n"
        finally:
            if tts:
                del tts
            gc.collect()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/tts-segment")
async def tts_segment(req: TTSSegmentRequest):
    """TTS single segment — generate voice cho 1 segment, trả kết quả JSON."""
    import gc
    from pathlib import Path

    DATA_DIR = Path(__file__).parent.parent.parent / "data" / "projects"
    tts_dir = DATA_DIR / req.project_id / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)

    tts = None
    try:
        tts = get_tts_engine(req.tts_engine, req.api_key)
        seg = req.segment
        seg_id = seg.get("id", 0)
        audio_path = tts_dir / f"seg_{int(seg_id):04d}.mp3"
        text = seg.get("translated_text", seg.get("translated", seg.get("source_text", seg.get("text", ""))))

        if not text.strip():
            return {"status": "skipped", "reason": "empty text"}

        await tts.synthesize(
            text=text,
            voice=req.voice,
            output_path=str(audio_path),
            rate=req.speed,
            volume=req.volume,
            pitch=req.pitch,
        )

        return {
            "status": "ok",
            "seg_id": seg_id,
            "audio_path": str(audio_path),
            "filename": audio_path.name,
        }

    except Exception as e:
        logger.error(f"TTS segment failed: {e}")
        raise HTTPException(500, f"TTS segment failed: {str(e)}")
    finally:
        if tts:
            del tts
        gc.collect()

