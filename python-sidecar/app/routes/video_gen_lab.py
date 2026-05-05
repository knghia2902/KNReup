import os
import json
import uuid
import asyncio
import logging
import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.engines.video_generator.scraper import WebScraper
from app.engines.video_generator.script_engine import OllamaScriptGenerator
from app.engines.video_generator.audio_mixer import AudioMixer
from app.engines.video_generator.hyperframes.build_composition import build_composition, THEMES
from app.engines.video_generator.hyperframes.renderer import HyperFramesRenderer

try:
    from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine
except ImportError:
    OmniVoiceTTSEngine = None

router = APIRouter(tags=["VideoGenLab"])
logger = logging.getLogger(__name__)

WORKSPACE_DIR = os.path.abspath("./workspace/video_gen/lab")
HISTORY_FILE = os.path.join(WORKSPACE_DIR, "history.json")

class LabGenerateRequest(BaseModel):
    url: str
    model: str = "gemma4:e2b"
    theme: str = "tech-blue"
    template_set: str = "default"
    voice_id: str = "vi-VN-HoaiMyNeural"
    language: str = "Vietnamese"
    mode: str = "auto"

class LabContinueRequest(BaseModel):
    script: Dict[str, Any]
    theme: str = "tech-blue"
    template_set: str = "default"
    voice_id: str = "vi-VN-HoaiMyNeural"

def get_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(entry: dict):
    os.makedirs(WORKSPACE_DIR, exist_ok=True)
    history = get_history()
    history.insert(0, entry)
    history = history[:50]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

def format_sse(step: int, stepName: str, status: str, progress: int, message: str, **kwargs) -> str:
    data = {
        "step": step,
        "totalSteps": 5,
        "stepName": stepName,
        "status": status,
        "progress": progress,
        "message": message
    }
    data.update(kwargs)
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

async def _run_pipeline_from_tts(session_id: str, session_dir: str, script_data: dict, request: dict, start_step: int = 3):
    audio_dir = os.path.join(session_dir, "audio")
    frames_dir = os.path.join(session_dir, "frames")
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)
    output_video_path = os.path.join(session_dir, f"output_{session_id}.mp4")

    tts = OmniVoiceTTSEngine() if OmniVoiceTTSEngine else None
    audio_mixer = AudioMixer(tts)

    scenes = script_data.get("scenes", [])
    voice_paths = []

    # Step 3: TTS
    yield format_sse(3, "tts", "running", 0, "Đang tạo giọng đọc...")
    for i, scene in enumerate(scenes):
        scene_content = scene.get("voiceText", "").strip()
        if scene_content:
            audio_path = os.path.join(audio_dir, f"scene_{i:03d}.mp3")
            duration = await audio_mixer.generate_scene_audio(
                text=scene_content,
                voice_id=request.get("voice_id", "vi-VN-HoaiMyNeural"),
                output_path=audio_path
            )
            scene["duration"] = duration
            voice_paths.append(audio_path)
            prog = int((i + 1) / max(len(scenes), 1) * 100)
            yield format_sse(3, "tts", "running", prog, f"Đã tạo audio {i+1}/{len(scenes)} ({duration:.1f}s)")
        else:
            scene["duration"] = 2.0
            voice_paths.append(None)
    yield format_sse(3, "tts", "complete", 100, "Hoàn tất tạo giọng đọc")

    # Step 4: Render
    yield format_sse(4, "render", "running", 0, "Đang khởi tạo HyperFrames...")
    
    mixed_audio_path = os.path.join(audio_dir, "mixed_audio.wav")
    yield format_sse(4, "render", "running", 10, "Đang mix âm thanh tổng...")
    await audio_mixer.mix_audio_tracks([p for p in voice_paths if p], None, mixed_audio_path)

    yield format_sse(4, "render", "running", 20, "Building HTML composition...")
    durations = [s.get("duration", 2.0) for s in scenes]
    
    # Map scenes from Scene schema to build_composition expected format
    comp_scenes = []
    for s in scenes:
        if "templateData" in s:
            t_data = s["templateData"]
            t_id = t_data.get("template", "hook")
            comp_scenes.append({"id": t_id, "data": t_data})
        else:
            comp_scenes.append(s)

    try:
        build_composition(
            output_dir=frames_dir,
            theme_id=request.get("theme", "tech-blue"),
            template_set=request.get("template_set", "default"),
            scenes=comp_scenes,
            durations=durations,
            audio_paths=voice_paths
        )
    except Exception as e:
        yield format_sse(4, "render", "error", 0, f"Lỗi build composition: {str(e)}")
        return

    renderer = HyperFramesRenderer(fps=30)
    async for event in renderer.render_stream(frames_dir, output_video_path):
        if event["status"] == "rendering":
            yield format_sse(4, "render", "running", 20 + int(event["progress"] * 0.8), event.get("message", "Đang render..."))
        elif event["status"] == "error":
            yield format_sse(4, "render", "error", 0, event.get("message", "Render thất bại"))
            return

    yield format_sse(4, "render", "complete", 100, "Hoàn tất render hình ảnh")

    # Step 5: Encode
    yield format_sse(5, "encode", "running", 0, "Đang tổng hợp video và âm thanh...")
    final_output_path = os.path.join(session_dir, f"final_{session_id}.mp4")
    import subprocess
    cmd = [
        "ffmpeg", "-y",
        "-i", output_video_path,
        "-i", mixed_audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        final_output_path
    ]
    proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, timeout=300)
    if proc.returncode != 0:
        yield format_sse(5, "encode", "error", 0, f"Lỗi FFmpeg: {proc.stderr.decode()}")
        return

    if os.path.exists(final_output_path):
        os.replace(final_output_path, output_video_path)

    yield format_sse(5, "encode", "complete", 100, "Render thành công!")

    size_bytes = os.path.getsize(output_video_path)
    dur_total = sum(durations)
    
    yield f"data: {json.dumps({'status':'done','videoUrl':f'/api/video-gen/lab/download/{session_id}','session_id':session_id,'metadata':{'duration':dur_total,'size_bytes':size_bytes,'resolution':'1080x1920'}})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/video-gen/lab/generate")
async def generate_lab_video(request: LabGenerateRequest):
    async def _stream():
        session_id = uuid.uuid4().hex[:12]
        session_dir = os.path.join(WORKSPACE_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)

        yield format_sse(1, "crawl", "running", 0, "Đang cào nội dung...")
        scraper = WebScraper()
        scrape_data = await scraper.scrape(request.url)
        if not scrape_data["success"]:
            yield format_sse(1, "crawl", "error", 0, f"Lỗi cào nội dung: {scrape_data.get('error', '')}")
            return
        word_count = scrape_data.get("word_count", 0)
        yield format_sse(1, "crawl", "complete", 100, "Hoàn tất", data={"word_count": word_count, "title": scrape_data.get("title", "")})

        tts = OmniVoiceTTSEngine() if OmniVoiceTTSEngine else None
        if tts and hasattr(tts, "force_unload"):
            tts.force_unload()

        yield format_sse(2, "script", "running", 0, "Đang sinh kịch bản...")
        llm = OllamaScriptGenerator(model=request.model)
        try:
            script_obj = await llm.generate(content=scrape_data["markdown"], language=request.language, source_url=request.url)
        except Exception as e:
            yield format_sse(2, "script", "error", 0, f"Lỗi sinh kịch bản: {str(e)}")
            return
            
        script_dict = script_obj.model_dump()
        script_path = os.path.join(session_dir, "script.json")
        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(script_dict, f, ensure_ascii=False, indent=2)

        yield format_sse(2, "script", "complete", 100, f"{len(script_dict.get('scenes', []))} scenes", data={"script": script_dict})

        if request.mode == "manual":
            yield format_sse(2, "script", "paused", 100, "Chờ duyệt kịch bản", script=script_dict, session_id=session_id)
            return
            
        async for evt in _run_pipeline_from_tts(session_id, session_dir, script_dict, request.model_dump()):
            yield evt
            
            if '"status":"done"' in evt:
                entry = {
                    "session_id": session_id,
                    "url": request.url,
                    "model": request.model,
                    "theme": request.theme,
                    "template_set": request.template_set,
                    "language": request.language,
                    "timestamp": datetime.now().isoformat(),
                    "video_path": os.path.join(session_dir, f"output_{session_id}.mp4"),
                }
                save_history(entry)

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )


@router.post("/video-gen/lab/continue/{session_id}")
async def continue_lab_pipeline(session_id: str, request: LabContinueRequest):
    session_dir = os.path.join(WORKSPACE_DIR, session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(status_code=404, detail="Session not found")
        
    async def _stream():
        script_path = os.path.join(session_dir, "script.json")
        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(request.script, f, ensure_ascii=False, indent=2)
            
        req_dict = request.model_dump()
        async for evt in _run_pipeline_from_tts(session_id, session_dir, request.script, req_dict):
            yield evt
            
            if '"status":"done"' in evt:
                url = request.script.get("metadata", {}).get("source", {}).get("url", "")
                entry = {
                    "session_id": session_id,
                    "url": url,
                    "model": "manual-continue",
                    "theme": request.theme,
                    "template_set": request.template_set,
                    "language": "Vietnamese",
                    "timestamp": datetime.now().isoformat(),
                    "video_path": os.path.join(session_dir, f"output_{session_id}.mp4"),
                }
                save_history(entry)

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )


@router.get("/video-gen/lab/models")
async def list_ollama_models():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            return {"models": models, "online": True}
    except Exception as e:
        return {"models": [], "online": False, "error": str(e)}


@router.get("/video-gen/lab/history")
async def get_lab_history():
    return {"history": get_history()}


@router.get("/video-gen/lab/download/{session_id}")
async def download_lab_video(session_id: str):
    video_path = os.path.join(WORKSPACE_DIR, session_id, f"output_{session_id}.mp4")
    if not os.path.exists(video_path):
        raise HTTPException(404, f"Video not found for session {session_id}")
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"knreup_lab_{session_id}.mp4"
    )

@router.get("/video-gen/lab/voices")
async def list_voices():
    return {
        "voices": {
            "Vietnamese": [
                {"id": "vi-VN-HoaiMyNeural", "name": "Hoài My (Nữ)"}, 
                {"id": "vi-VN-NamMinhNeural", "name": "Nam Minh (Nam)"}
            ],
            "English": [
                {"id": "en-US-JennyMultilingualNeural", "name": "Jenny (Female)"},
                {"id": "en-US-GuyNeural", "name": "Guy (Male)"}
            ]
        }
    }
