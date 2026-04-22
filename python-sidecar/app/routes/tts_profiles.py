"""Routes for TTS voice profile management."""
import logging
import os
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File
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
        cloned_voices = [v for v in voices if v.get("type") == "cloned"]
        return {"profiles": cloned_voices}
    except Exception as e:
        logger.error(f"Error listing profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))
