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
from app.engines.video_generator.audio_mixer import AudioMixer, SfxOverlay
from app.engines.video_generator.sfx_selector import index_sfx_library, pick_sfx_for_scene, get_default_playback, filter_sfx_overlays
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
    voice_id: str = "default_female"
    language: str = "Vietnamese"
    mode: str = "auto"

class LabContinueRequest(BaseModel):
    script: Dict[str, Any]
    theme: str = "tech-blue"
    template_set: str = "default"
    voice_id: str = "default_female"

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
                voice_id=request.get("voice_id", "default_female"),
                output_path=audio_path,
                rate=request.get("voice_speed", 1.0)
            )
            scene["duration"] = duration
            voice_paths.append(audio_path)
            prog = int((i + 1) / max(len(scenes), 1) * 100)
            yield format_sse(3, "tts", "running", prog, f"Đã tạo audio {i+1}/{len(scenes)} ({duration:.1f}s)")
        else:
            scene["duration"] = 2.0
            voice_paths.append(None)
    yield format_sse(3, "tts", "complete", 100, "Hoàn tất tạo giọng đọc")

    # Generate SRT File
    def format_srt_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    srt_path = os.path.join(session_dir, f"subtitles_{session_id}.srt")
    try:
        with open(srt_path, "w", encoding="utf-8") as f:
            current_time = 0.0
            srt_idx = 1
            for scene in scenes:
                dur = scene.get("duration", 2.0)
                text = scene.get("voiceText", "").strip()
                if text:
                    f.write(f"{srt_idx}\n")
                    f.write(f"{format_srt_time(current_time)} --> {format_srt_time(current_time + dur)}\n")
                    f.write(f"{text}\n\n")
                    srt_idx += 1
                current_time += dur
    except Exception as e:
        logger.error(f"Failed to generate SRT: {e}")

    # Step 4: Render
    yield format_sse(4, "render", "running", 0, "Đang khởi tạo HyperFrames...")
    
    # Download source image if available
    source_image = script_data.get("metadata", {}).get("source", {}).get("image")
    if source_image and str(source_image).startswith("http"):
        yield format_sse(4, "render", "running", 5, "Đang tải ảnh nền...")
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                "Referer": request.get("url", "https://google.com")
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                img_resp = await client.get(source_image, headers=headers)
                img_resp.raise_for_status()
                assets_dir = os.path.join(frames_dir, "assets")
                os.makedirs(assets_dir, exist_ok=True)
                
                bg_path = os.path.join(assets_dir, "bg.jpg")
                with open(bg_path, "wb") as f:
                    f.write(img_resp.content)
                    
                # Update script scenes to use assets/bg.jpg
                # Force-inject bgSrc into the first hook scene regardless of LLM output
                for s in scenes:
                    if "templateData" in s:
                        td = s["templateData"]
                        tpl = td.get("template", "")
                        # If the scene already references the source image or placeholder, replace it
                        if td.get("bgSrc") in ["$source.image", source_image]:
                            td["bgSrc"] = "assets/bg.jpg"
                        # Force-inject into hook scene if no bgSrc was set by LLM
                        elif tpl == "hook" and not td.get("bgSrc"):
                            td["bgSrc"] = "assets/bg.jpg"
        except Exception as e:
            logger.warning(f"Failed to download source image {source_image}: {e}")
    
    mixed_audio_path = os.path.join(audio_dir, "mixed_audio.wav")
    yield format_sse(4, "render", "running", 10, "Đang mix âm thanh tổng...")
    try:
        await audio_mixer.mix_audio_tracks([p for p in voice_paths if p], None, mixed_audio_path)
    except Exception as e:
        yield format_sse(4, "render", "error", 0, f"Lỗi mix audio: {str(e)}")
        return

    # SFX overlay: select per-scene SFX and mix onto audio
    sfx_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "engines", "video_generator", "hyperframes", "assets", "sfx"))
    sfx_index = index_sfx_library(sfx_dir)
    if sfx_index:
        yield format_sse(4, "render", "running", 12, "Đang chọn và mix SFX...")
        overlays: list[SfxOverlay] = []
        cumulative_time = 0.0
        for i, scene in enumerate(scenes):
            tpl_name = ""
            voice_text = scene.get("voiceText", "")
            if "templateData" in scene:
                tpl_name = scene["templateData"].get("template", "")
            scene_id = f"scene_{i}"
            picked = pick_sfx_for_scene(voice_text, tpl_name, scene_id, sfx_index)
            if picked:
                sfx_path = os.path.join(sfx_dir, picked.rel_path)
                if os.path.exists(sfx_path):
                    pb = get_default_playback(picked)
                    overlays.append(SfxOverlay(
                        path=sfx_path,
                        timestamp_sec=cumulative_time,
                        volume=pb["volume"],
                        offset_sec=pb["offset_sec"],
                    ))
                    logger.info(f"SFX scene {i} ({tpl_name}): {picked.rel_path} [{picked.source}]")
            cumulative_time += scene.get("duration", 2.0)

        if overlays:
            # Filter to max 3 SFX per video, prioritizing outro
            filtered_overlays = filter_sfx_overlays(overlays, max_count=3)
            sfx_output = os.path.join(audio_dir, "mixed_with_sfx.wav")
            try:
                await audio_mixer.overlay_sfx(mixed_audio_path, filtered_overlays, sfx_output)
                mixed_audio_path = sfx_output
                yield format_sse(4, "render", "running", 14, f"Đã overlay {len(filtered_overlays)} SFX (lọc từ {len(overlays)})")
            except Exception as e:
                logger.warning(f"SFX overlay failed (non-fatal): {e}")
    else:
        logger.info("Không tìm thấy thư mục SFX, bỏ qua")

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
        "-map", "0:v:0",
        "-map", "1:a:0",
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
            script_obj = await llm.generate(
                content=scrape_data["markdown"], 
                language=request.language, 
                source_url=request.url,
                source_image=scrape_data.get("image")
            )
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
            
            if '"status": "done"' in evt or '"status":"done"' in evt:
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
            
            if '"status": "done"' in evt or '"status":"done"' in evt:
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

@router.delete("/video-gen/lab/history/{session_id}")
async def delete_lab_history(session_id: str):
    import shutil
    
    # 1. Update history.json
    history = get_history()
    new_history = [e for e in history if e.get("session_id") != session_id]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(new_history, f, indent=2, ensure_ascii=False)
        
    # 2. Delete the physical workspace folder
    session_dir = os.path.join(WORKSPACE_DIR, session_id)
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
        
    return {"success": True, "history": new_history}

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

@router.get("/video-gen/lab/download_srt/{session_id}")
async def download_lab_srt(session_id: str):
    srt_path = os.path.join(WORKSPACE_DIR, session_id, f"subtitles_{session_id}.srt")
    if not os.path.exists(srt_path):
        raise HTTPException(404, f"SRT not found for session {session_id}")
    return FileResponse(
        srt_path,
        media_type="text/plain",
        filename=f"knreup_lab_{session_id}.srt"
    )

@router.get("/video-gen/lab/voices")
async def list_voices():
    if OmniVoiceTTSEngine:
        engine = OmniVoiceTTSEngine()
        voices = await engine.list_voices()
        standard_voices = [
            {"id": "default_female", "name": "Default Female"},
            {"id": "default_male", "name": "Default Male"}
        ]
        cloned_voices = [{"id": v["id"], "name": v["name"]} for v in voices if v.get("type") in ("cloned", "designed")]
        
        voices_dict = {"OmniVoice Standard": standard_voices}
        if cloned_voices:
            voices_dict["OmniVoice Cloned"] = cloned_voices
            
        return {"voices": voices_dict}
    else:
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
