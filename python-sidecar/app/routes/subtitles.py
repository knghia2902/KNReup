"""Subtitle management routes — import, export, re-TTS per segment."""
import tempfile
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/subtitles")


# ─── Models ───────────────────────────────────────────────
class SubtitleSegment(BaseModel):
    id: int
    start: float
    end: float
    source_text: str = ""
    translated_text: str = ""
    confidence: float = 1.0
    tts_status: str = "pending"
    tts_audio_path: Optional[str] = None


class ImportResponse(BaseModel):
    segments: list[SubtitleSegment]
    count: int


class ExportRequest(BaseModel):
    segments: list[SubtitleSegment]
    format: str = "srt"  # srt, vtt, ass


class ReTTSRequest(BaseModel):
    segment: SubtitleSegment
    engine: str = "edge_tts"
    voice: str = "vi-VN-HoaiMyNeural"
    rate: float = 1.0
    volume: float = 1.0
    pitch: float = 0.5


# ─── Import SRT ───────────────────────────────────────────
@router.post("/import", response_model=ImportResponse)
async def import_subtitles(file: UploadFile = File(...)):
    """Upload SRT/VTT file → parse → return segments."""
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")  # Handle BOM

        segments = parse_srt(text)
        return ImportResponse(segments=segments, count=len(segments))

    except Exception as e:
        logger.error(f"Import failed: {e}")
        raise HTTPException(500, f"Import failed: {str(e)}")


# ─── Export SRT ───────────────────────────────────────────
@router.post("/export")
async def export_subtitles(req: ExportRequest):
    """Generate SRT string from segments."""
    try:
        srt_text = build_srt(req.segments)
        return PlainTextResponse(
            content=srt_text,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=subtitles.srt"},
        )
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(500, f"Export failed: {str(e)}")


# ─── Re-TTS Single Segment ───────────────────────────────
@router.post("/tts-segment")
async def tts_segment(req: ReTTSRequest):
    """Re-generate TTS audio for a single subtitle segment."""
    try:
        # Reuse engine factory from pipeline routes
        from app.routes.pipeline import get_tts_engine

        tts = get_tts_engine(req.engine)
        output_path = tempfile.mktemp(suffix=".mp3")

        await tts.synthesize(
            text=req.segment.translated_text,
            voice=req.voice,
            output_path=output_path,
            rate=req.rate,
            volume=req.volume,
            pitch=req.pitch,
        )

        return {
            "segment_id": req.segment.id,
            "audio_path": output_path,
            "tts_status": "generated",
        }

    except Exception as e:
        logger.error(f"Re-TTS failed for segment {req.segment.id}: {e}")
        raise HTTPException(500, f"Re-TTS failed: {str(e)}")


# ─── SRT Parser ──────────────────────────────────────────
def parse_srt(text: str) -> list[SubtitleSegment]:
    """Parse SRT format into SubtitleSegment list."""
    import re

    segments = []
    blocks = re.split(r"\n\s*\n", text.strip())

    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) < 3:
            continue

        # Line 1: index
        try:
            idx = int(lines[0].strip())
        except ValueError:
            continue

        # Line 2: timecodes
        time_match = re.match(
            r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})",
            lines[1].strip(),
        )
        if not time_match:
            continue

        g = time_match.groups()
        start = int(g[0]) * 3600 + int(g[1]) * 60 + int(g[2]) + int(g[3]) / 1000
        end = int(g[4]) * 3600 + int(g[5]) * 60 + int(g[6]) + int(g[7]) / 1000

        # Line 3+: text
        text_content = "\n".join(lines[2:]).strip()

        segments.append(
            SubtitleSegment(
                id=idx,
                start=start,
                end=end,
                source_text="",
                translated_text=text_content,
                confidence=1.0,
                tts_status="pending",
            )
        )

    return segments


def build_srt(segments: list[SubtitleSegment]) -> str:
    """Build SRT string from segments."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start_h = int(seg.start // 3600)
        start_m = int((seg.start % 3600) // 60)
        start_s = int(seg.start % 60)
        start_ms = int((seg.start % 1) * 1000)

        end_h = int(seg.end // 3600)
        end_m = int((seg.end % 3600) // 60)
        end_s = int(seg.end % 60)
        end_ms = int((seg.end % 1) * 1000)

        lines.append(str(i))
        lines.append(
            f"{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d} --> "
            f"{end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}"
        )
        lines.append(seg.translated_text or seg.source_text)
        lines.append("")

    return "\n".join(lines)
