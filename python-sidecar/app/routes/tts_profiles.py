"""Routes for TTS voice profile management."""
import logging
import os
import shutil
import tempfile
from pathlib import Path

import re
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts/profiles")

# Create a single instance of the engine to share config/model context if needed
engine = OmniVoiceTTSEngine()

class SaveProfileRequest(BaseModel):
    audio_path: str
    profile_name: str

@router.post("/upload-reference")
async def upload_reference(file: UploadFile = File(...)):
    """Upload and preprocess reference audio for voice cloning."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    # Validate extension to prevent arbitrary file upload execution
    allowed_extensions = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {allowed_extensions}")
        
    try:
        # Save uploaded file
        temp_input = tempfile.mktemp(suffix=suffix)
        with open(temp_input, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        # Preprocess
        temp_output = tempfile.mktemp(suffix=".wav")
        processed_path = engine.preprocess_reference_audio(temp_input, temp_output)
        
        return {"processed_audio_path": processed_path}
    except Exception as e:
        logger.error(f"Error uploading reference audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_profile(req: SaveProfileRequest):
    """Save the preprocessed audio as a custom voice profile."""
    if not os.path.exists(req.audio_path):
        raise HTTPException(status_code=400, detail="Processed audio not found")
        
    # Sanitize profile name
    import re
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', req.profile_name)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid profile name")
        
    try:
        profile_path = engine.create_voice_profile(req.audio_path, safe_name)
        return {"success": True, "profile_path": profile_path, "name": safe_name}
    except Exception as e:
        logger.error(f"Error saving profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_profiles():
    """List all saved custom voice profiles."""
    try:
        voices = await engine.list_voices()
        # Filter to only return cloned ones
        cloned_voices = [v for v in voices if v.get("type") in ["cloned", "designed"]]
        detailed = []
        for v in cloned_voices:
            details = engine.get_profile_details(v["id"])
            if details:
                detailed.append(details)
            else:
                detailed.append(v)
        return {"profiles": detailed}
    except Exception as e:
        logger.error(f"Error listing profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class CloneRequest(BaseModel):
    profile_name: str

@router.post("/clone")
async def clone_voice(profile_name: str = Form(...), file: UploadFile = File(...)):
    """Upload ref audio, preprocess, create voice profile."""
    # Validate extension
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".wav", ".mp3", ".ogg", ".flac", ".m4a"}:
        raise HTTPException(400, "Unsupported file type")
    
    # Validate duration (max 30s)
    temp_input = tempfile.mktemp(suffix=suffix)
    with open(temp_input, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    duration = engine.get_audio_duration(temp_input)
    if duration > 30:
        os.unlink(temp_input)
        raise HTTPException(422, f"Audio exceeds 30s limit ({duration}s)")
    
    # Preprocess
    temp_output = tempfile.mktemp(suffix=".wav")
    engine.preprocess_reference_audio(temp_input, temp_output)
    
    # Sanitize and save profile
    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', profile_name)
    profile_path = engine.create_voice_profile(temp_output, safe_name, "cloned")
    
    return {"success": True, "profile_name": safe_name, "duration": duration}

class DesignRequest(BaseModel):
    description: str
    text: str
    profile_name: str

@router.post("/design")
async def design_voice(req: DesignRequest):
    """Create voice from text description."""
    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', req.profile_name)
    temp_output = tempfile.mktemp(suffix=".wav")
    
    engine.voice_design(req.description, req.text, temp_output)
    profile_path = engine.create_voice_profile(temp_output, safe_name, "designed")
    
    return {"success": True, "profile_name": safe_name}

class PreviewRequest(BaseModel):
    profile_name: str
    text: str

@router.post("/preview")
async def preview_voice(req: PreviewRequest):
    """Preview a cloned voice with custom text. Returns audio file path."""
    temp_output = tempfile.mktemp(suffix=".wav")
    result = await engine.preview_voice(req.profile_name, req.text, temp_output)
    return {"audio_path": result}

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
