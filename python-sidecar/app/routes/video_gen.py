import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from app.engines.video_generator.schema import VideoGenRequest, AVAILABLE_TEMPLATES
from app.engines.video_generator.pipeline import VideoGenerationPipeline

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

