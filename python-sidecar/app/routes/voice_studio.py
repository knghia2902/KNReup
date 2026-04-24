"""API routes for Voice Studio (TTS Generation and History)."""
import logging
import os
import tempfile
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.utils.history_manager import HistoryManager
from app.routes.pipeline import get_tts_engine

logger = logging.getLogger(__name__)

router = APIRouter()
history_manager = HistoryManager()

class TTSGenerateRequest(BaseModel):
    text: str
    engine: str = "omnivoice"
    voice: str = "vi-VN-HoaiMyNeural"
    rate: float = 1.0
    volume: float = 1.0
    pitch: float = 0.5
    speed: float = 1.0
    profile_name: Optional[str] = None
    api_key: str = ""
    type: str = "tts"

@router.get("/history")
async def get_history():
    """Get all voice studio history items."""
    try:
        items = history_manager.get_all()
        return {"items": items}
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{item_id}/audio")
async def get_history_audio(item_id: str):
    """Serve the audio file for a history item."""
    try:
        items = history_manager.get_all()
        item = next((i for i in items if i.get("id") == item_id), None)
        if not item or "file_path" not in item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        audio_path = item["file_path"]
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="Audio file missing on disk")
            
        return FileResponse(
            audio_path,
            media_type="audio/mpeg" if audio_path.endswith(".mp3") else "audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=\"{item.get('filename', 'audio.wav')}\"",
                "Accept-Ranges": "bytes"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving history audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{item_id}")
async def delete_history_item(item_id: str):
    """Delete a history item and its audio file."""
    try:
        success = history_manager.delete_history(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting history item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-tts")
async def generate_tts(req: TTSGenerateRequest):
    """Generate TTS audio, save it, and return metadata."""
    try:
        tts = get_tts_engine(req.engine, req.api_key)
        
        # Omnivoice often outputs wav, edge_tts often uses mp3
        ext = ".wav" if req.engine == "omnivoice" else ".mp3"
        output_path = tempfile.mktemp(suffix=ext)
        
        voice = req.profile_name if req.profile_name else req.voice
        
        # synthesize audio
        await tts.synthesize(
            text=req.text,
            voice=voice,
            output_path=output_path,
            rate=req.speed, # using speed as in pipeline
            volume=req.volume,
            pitch=req.pitch,
        )
        
        # read the output file to Bytes
        with open(output_path, "rb") as f:
            audio_content = f.read()
            
        # clean up temp file
        os.unlink(output_path)
            
        safe_engine = req.engine.replace('_', '-')
        
        metadata = {
            "text": req.text,
            "engine": req.engine,
            "config": {
                "voice": voice,
                "rate": req.rate,
                "volume": req.volume,
                "pitch": req.pitch,
                "speed": req.speed
            },
            "type": req.type,
            "filename": f"{safe_engine}_{req.text[:20].replace(' ', '_')}{ext}"
        }
        
        record = history_manager.save_history(audio_content, metadata)
        return {"success": True, "record": record}
    except Exception as e:
        logger.error(f"Error generating TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))
