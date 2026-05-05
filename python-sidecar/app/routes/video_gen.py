import os
import json
import uuid
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
from app.engines.video_generator.schema import VideoGenRequest, AVAILABLE_TEMPLATES
from app.engines.video_generator.pipeline import VideoGenerationPipeline
from app.engines.video_generator.hyperframes.build_composition import (
    build_composition, SAMPLE_DATA, THEMES, get_voice_text
)
from app.engines.video_generator.hyperframes.renderer import HyperFramesRenderer

router = APIRouter(tags=["VideoGenerator"])

WORKSPACE_DIR = os.path.abspath("./workspace/video_gen")

@router.post("/video-gen/generate-script")
async def generate_script(request: VideoGenRequest):
    """
    Step 1: Scrape URL and generate script via LLM. Returns the script JSON.
    """
    pipeline = VideoGenerationPipeline()
    script_data = await pipeline.generate_script_only(request)
    return script_data

@router.post("/video-gen/render")
async def render_video(request: dict):
    """
    Step 2: Take the modified script and render the video.
    """
    pipeline = VideoGenerationPipeline()
    return StreamingResponse(
        pipeline.render_only(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@router.get("/video-gen/download/{session_id}")
async def download_video(session_id: str):
    """
    Serve the rendered video file for a given session.
    """
    session_dir = os.path.join(WORKSPACE_DIR, session_id)
    
    # Look for the output video
    video_path = os.path.join(session_dir, f"output_{session_id}.mp4")
    
    if not os.path.exists(video_path):
        raise HTTPException(404, f"Video not found for session {session_id}")
    
    return FileResponse(
        video_path, 
        media_type="video/mp4",
        filename=f"knreup_video_{session_id}.mp4"
    )

@router.get("/video-gen/session/{session_id}")
async def get_session_info(session_id: str):
    """
    Get session info including script and video availability.
    """
    session_dir = os.path.join(WORKSPACE_DIR, session_id)
    
    if not os.path.exists(session_dir):
        raise HTTPException(404, f"Session {session_id} not found")
    
    video_path = os.path.join(session_dir, f"output_{session_id}.mp4")
    script_path = os.path.join(session_dir, "script.json")
    
    result = {
        "session_id": session_id,
        "has_video": os.path.exists(video_path),
        "has_script": os.path.exists(script_path),
    }
    
    if os.path.exists(video_path):
        result["video_size"] = os.path.getsize(video_path)
    
    return result

@router.get("/video-gen/templates")
async def list_templates():
    """
    List all available scene template types (matching Auto-Create-Video repo).
    """
    return {"templates": AVAILABLE_TEMPLATES}


# ─────────────────────────────────────────────────────────
# HyperFrames Preview Export
# ─────────────────────────────────────────────────────────

class PreviewRenderRequest(BaseModel):
    theme: str = "tech-blue"
    sceneDuration: float = 4.0
    fps: int = 30

@router.post("/video-gen/render-preview")
async def render_preview(request: PreviewRenderRequest):
    """
    Export all 12 templates as a slideshow MP4 using HyperFrames.
    Returns SSE stream with progress events, ending with a download URL.
    """
    async def _stream():
        session_id = uuid.uuid4().hex[:12]
        session_dir = os.path.join(WORKSPACE_DIR, "preview", session_id)
        os.makedirs(session_dir, exist_ok=True)

        # Step 1: Build composition
        yield f"data: {json.dumps({'status':'building','progress':5,'message':'Building composition HTML...'})}\n\n"

        durations = [request.sceneDuration] * len(SAMPLE_DATA)
        try:
            build_composition(
                output_dir=session_dir,
                theme_id=request.theme,
                scenes=SAMPLE_DATA,
                durations=durations,
            )
        except Exception as e:
            yield f"data: {json.dumps({'status':'error','progress':0,'message':f'Build failed: {str(e)}'})}\n\n"
            return

        yield f"data: {json.dumps({'status':'building','progress':10,'message':'Composition ready, starting render...'})}\n\n"

        # Step 2: Render via HyperFrames
        renderer = HyperFramesRenderer(fps=request.fps)
        output_path = os.path.join(session_dir, f"preview_{session_id}.mp4")

        async for event in renderer.render_stream(session_dir, output_path):
            if event["status"] == "done":
                # Replace videoPath with download URL
                event["downloadUrl"] = f"/api/video-gen/download-preview/{session_id}"
                event["sessionId"] = session_id
            yield f"data: {json.dumps(event)}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@router.get("/video-gen/download-preview/{session_id}")
async def download_preview(session_id: str):
    """
    Download a rendered preview video.
    """
    video_path = os.path.join(WORKSPACE_DIR, "preview", session_id, f"preview_{session_id}.mp4")

    if not os.path.exists(video_path):
        raise HTTPException(404, f"Preview video not found for session {session_id}")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"knreup_preview_{session_id}.mp4"
    )

@router.get("/video-gen/preview-themes")
async def list_preview_themes():
    """
    List available theme palettes for preview export.
    """
    return {"themes": list(THEMES.keys()), "scenes": len(SAMPLE_DATA)}
