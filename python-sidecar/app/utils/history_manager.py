"""Utility for managing Voice Studio audio history."""
import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

HISTORY_DIR = "data/voice_studio_history"
HISTORY_FILE = os.path.join(HISTORY_DIR, "history.json")

class HistoryManager:
    def __init__(self):
        self._ensure_dir()
        
    def _ensure_dir(self):
        os.makedirs(HISTORY_DIR, exist_ok=True)
        if not os.path.exists(HISTORY_FILE):
            self._save_index([])
            
    def _load_index(self) -> List[Dict[str, Any]]:
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
            
    def _save_index(self, data: List[Dict[str, Any]]):
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    def get_all(self) -> List[Dict[str, Any]]:
        """Return all history items, sorted by newest first."""
        history = self._load_index()
        # Sort by created_at descending if possible
        history.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return history
        
    def save_history(self, file_content: bytes, metadata: dict) -> dict:
        self._ensure_dir()
        
        # Generate ID and safe filename
        item_id = str(uuid.uuid4())
        ext = ".wav"  # Default
        if "filename" in metadata and metadata["filename"]:
            # Basic sanitization
            safe_name = "".join(c for c in metadata["filename"] if c.isalnum() or c in " ._-")
            ext = os.path.splitext(safe_name)[1] or ext
        else:
            safe_name = f"audio_{item_id[:8]}{ext}"
            
        # Physical file path
        file_path = os.path.join(HISTORY_DIR, f"{item_id}{ext}")
        
        # Save audio file
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        # Prepare final metadata
        record = {
            "id": item_id,
            "filename": safe_name,
            "file_path": file_path,
            "text": metadata.get("text", ""),
            "engine": metadata.get("engine", "unknown"),
            "config": metadata.get("config", {}),
            "created_at": datetime.utcnow().isoformat() + "Z",
            "type": metadata.get("type", "tts")
        }
        
        # Update index
        history = self._load_index()
        history.append(record)
        self._save_index(history)
        
        return record
        
    def delete_history(self, item_id: str) -> bool:
        history = self._load_index()
        new_history = []
        deleted = False
        
        for item in history:
            if item.get("id") == item_id:
                # Try to delete physical file
                file_path = item.get("file_path")
                if file_path and os.path.exists(file_path):
                    try:
                        os.unlink(file_path)
                    except OSError:
                        pass
                deleted = True
            else:
                new_history.append(item)
                
        if deleted:
            self._save_index(new_history)
            
        return deleted
