"""Project data persistence — save/load segments, config, and TTS audio per project."""
import json
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["projects"])

# Base directory for project data storage
DATA_DIR = Path(__file__).parent.parent.parent / "data" / "projects"


class ProjectSaveRequest(BaseModel):
    segments: list[dict]
    config: dict = {}
    video_path: str = ""


def _get_project_dir(project_id: str) -> Path:
    """Get the project data directory, creating it if needed."""
    project_dir = DATA_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


@router.post("/{project_id}/save")
async def save_project(project_id: str, req: ProjectSaveRequest):
    """Lưu segments + config vào disk theo project_id."""
    project_dir = _get_project_dir(project_id)
    project_file = project_dir / "project.json"

    data = {
        "segments": req.segments,
        "config": req.config,
        "video_path": req.video_path,
    }

    project_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"status": "saved", "project_id": project_id, "path": str(project_file)}


@router.get("/{project_id}/load")
async def load_project(project_id: str):
    """Load project data + scan TTS files."""
    project_dir = DATA_DIR / project_id
    project_file = project_dir / "project.json"

    if not project_file.exists():
        return {
            "segments": [],
            "config": {},
            "tts_paths": {},
            "has_dubbed": False,
            "video_path": "",
        }

    data = json.loads(project_file.read_text(encoding="utf-8"))

    # Scan tts/ folder for existing audio files
    tts_dir = project_dir / "tts"
    tts_paths = {}
    has_dubbed = False

    if tts_dir.exists():
        for f in tts_dir.iterdir():
            if f.name == "dubbed_audio.wav":
                has_dubbed = True
            elif f.suffix in (".mp3", ".wav") and f.name.startswith("seg_"):
                # Extract segment ID from filename: seg_0001.mp3 → "1"
                try:
                    seg_id = str(int(f.stem.replace("seg_", "")))
                    tts_paths[seg_id] = f.name
                except ValueError:
                    pass

    return {
        "segments": data.get("segments", []),
        "config": data.get("config", {}),
        "tts_paths": tts_paths,
        "has_dubbed": has_dubbed,
        "video_path": data.get("video_path", ""),
    }


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Xóa toàn bộ project data (TTS files + project.json)."""
    project_dir = DATA_DIR / project_id
    if project_dir.exists():
        shutil.rmtree(project_dir, ignore_errors=True)
        return {"status": "deleted", "project_id": project_id}
    return {"status": "not_found", "project_id": project_id}


# ── Audio File Server ──

@router.get("/{project_id}/audio/{filename}")
async def serve_audio(project_id: str, filename: str):
    """Phục vụ file audio TTS theo project_id."""
    file_path = DATA_DIR / project_id / "tts" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")

    media_type = "audio/mpeg" if file_path.suffix == ".mp3" else "audio/wav"
    return FileResponse(str(file_path), media_type=media_type)
