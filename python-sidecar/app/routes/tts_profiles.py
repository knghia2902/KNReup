import os
import re
import math
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine

engine = OmniVoiceTTSEngine()
router = APIRouter(prefix="/tts/profiles", tags=["Voice Clone"])

class CloneRequest(BaseModel):
    profile_name: str

@router.post("/clone")
async def clone_voice(profile_name: str = Form(...), file: UploadFile = File(...)):
    """Upload ref audio, preprocess, create voice profile."""
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".wav", ".mp3", ".ogg", ".flac", ".m4a"}:
        raise HTTPException(400, "Unsupported file type")
    
    temp_input = tempfile.mktemp(suffix=suffix)
    with open(temp_input, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    duration = engine.get_audio_duration(temp_input)
    if duration > 30:
        os.unlink(temp_input)
        raise HTTPException(422, f"Audio exceeds 30s limit ({duration}s)")
    
    temp_output = tempfile.mktemp(suffix=".wav")
    engine.preprocess_reference_audio(temp_input, temp_output)
    
    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', profile_name)
    profile_path = engine.create_voice_profile(temp_output, safe_name, "cloned")
    
    return {"success": True, "profile_name": safe_name, "duration": duration}

class DesignRequest(BaseModel):
    description: str
    text: str
    profile_name: str
    region: str = "Bắc"
    speed: float = 1.0

@router.post("/design")
async def design_voice(req: DesignRequest):
    """Create voice with custom Vietnamese parameters."""
    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', req.profile_name)
    temp_output = tempfile.mktemp(suffix=".wav")
    
    engine.voice_design(req.description, req.text, temp_output, region=req.region, speed=req.speed)
    profile_path = engine.create_voice_profile(temp_output, safe_name, "designed")
    
    return {"success": True, "profile_name": safe_name}

class PreviewRequest(BaseModel):
    profile_name: str
    text: str

@router.post("/preview")
async def preview_voice(req: PreviewRequest):
    """Preview a cloned voice with custom text and save to history."""
    temp_output = tempfile.mktemp(suffix=".wav")
    result = await engine.preview_voice(req.profile_name, req.text, temp_output)
    record = engine.save_to_history(req.text, req.profile_name, result)
    return {"audio_path": result, "history_record": record}

@router.get("/history")
async def list_history():
    return {"history": engine.get_history()}

@router.get("/history/{filename}")
async def get_history_audio(filename: str):
    """Serve a generated TTS audio file from history."""
    from fastapi.responses import FileResponse
    history_dir = engine.profiles_dir.parent / "history"
    audio_path = history_dir / filename
    if not audio_path.exists():
        raise HTTPException(404, "Audio file not found")
    return FileResponse(str(audio_path), media_type="audio/wav")

@router.get("/health")
async def health():
    available = await engine.health_check()
    return {"available": available, "engine": "omnivoice"}

@router.get("/{name}")
async def get_profile(name: str):
    details = engine.get_profile_details(name)
    if not details:
        raise HTTPException(404, "Profile not found")
    return details

@router.delete("/{name}")
async def delete_profile(name: str):
    engine.delete_profile(name)
    return {"success": True, "deleted": name}

@router.get("/")
async def list_profiles():
    voices = await engine.list_voices()
    # Return ALL profile types (cloned + designed), not just cloned
    profiles = [v for v in voices if v.get("type") in ("cloned", "designed")]
    detailed = []
    for v in profiles:
        details = engine.get_profile_details(v["id"])
        if details:
            detailed.append(details)
        else:
            detailed.append(v)
    return {"profiles": detailed}


@router.get("/{name}/audio")
async def get_profile_audio(name: str):
    """Serve the profile's reference audio file for preview playback."""
    from fastapi.responses import FileResponse
    audio_path = engine.profiles_dir / f"{name}.wav"
    if not audio_path.exists():
        raise HTTPException(404, "Audio file not found")
    return FileResponse(str(audio_path), media_type="audio/wav")

