"""
FFmpeg Output Builder — merge audio + video + subtitles.
ASS subtitle generation + audio mixing.
"""
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ASS Position mapping (1-5)
# 1=top-left, 2=top-center, 3=top-right
# 4=center, 5=bottom-center (default)
POSITION_TO_ALIGNMENT = {
    1: 8,   # Top center
    2: 5,   # Middle center
    3: 2,   # Bottom center (default)
    4: 1,   # Bottom left
    5: 6,   # Middle left
}


def _color_to_ass(hex_color: str) -> str:
    """Convert #RRGGBB to ASS color format &HBBGGRR."""
    hex_color = hex_color.lstrip("#")
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"&H00{b}{g}{r}"


class FFmpegOutputBuilder:
    """Build FFmpeg command to merge video + audio + subtitles."""

    def __init__(self, input_video: str, output_path: str):
        self.input_video = input_video
        self.output_path = output_path
        self._dubbed_audio: Optional[str] = None
        self._original_volume: float = 0.1
        self._ass_file: Optional[str] = None
        self._subtitle_config: dict = {}

    def add_dubbed_audio(
        self,
        audio_path: str,
        original_volume: float = 0.1,
    ) -> "FFmpegOutputBuilder":
        """Set dubbed audio file + original volume."""
        self._dubbed_audio = audio_path
        self._original_volume = original_volume
        return self

    def add_subtitles_ass(
        self,
        segments: list[dict],
        config: Optional[dict] = None,
    ) -> "FFmpegOutputBuilder":
        """Generate ASS subtitle file from segments."""
        self._subtitle_config = config or {}
        self._ass_file = self.generate_ass_file(segments, self._subtitle_config)
        return self

    def generate_ass_file(
        self,
        segments: list[dict],
        config: dict,
    ) -> str:
        """Write .ass file, return path."""
        font_name = config.get("font_name", "Arial")
        font_size = config.get("font_size", 50)
        color = config.get("color", "#FFFF00")
        outline_color = config.get("outline_color", "#000000")
        position = config.get("position", 3)  # default: bottom center
        alignment = POSITION_TO_ALIGNMENT.get(position, 2)

        primary_colour = _color_to_ass(color)
        outline_colour = _color_to_ass(outline_color)

        ass_content = f"""[Script Info]
Title: KNReup Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_colour},&H000000FF,{outline_colour},&H80000000,-1,0,0,0,100,100,0,0,1,2,1,{alignment},20,20,35,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        for seg in segments:
            start = self._seconds_to_ass_time(seg["start"])
            end = self._seconds_to_ass_time(seg["end"])
            text = seg.get("translated", seg.get("text", ""))
            # Escape ASS special chars
            text = text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")
            ass_content += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"

        # Write to temp file
        ass_path = tempfile.mktemp(suffix=".ass")
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        logger.info(f"ASS file generated: {ass_path} ({len(segments)} segments)")
        return ass_path

    def build(
        self,
        codec: str = "libx264",
        crf: int = 23,
        progress_callback=None,
    ) -> str:
        """Run FFmpeg command, return output path."""
        cmd = ["ffmpeg", "-y", "-i", self.input_video]

        filter_complex_parts = []
        map_args = []

        # Add dubbed audio input
        if self._dubbed_audio:
            cmd.extend(["-i", self._dubbed_audio])
            filter_complex_parts.append(
                f"[1:a]volume=1.0[dub];"
                f"[0:a]volume={self._original_volume}[orig];"
                f"[dub][orig]amix=inputs=2:duration=first[aout]"
            )
            map_args.extend(["-map", "0:v", "-map", "[aout]"])
        else:
            map_args.extend(["-map", "0:v", "-map", "0:a"])

        # Add ASS subtitles
        if self._ass_file:
            ass_escaped = self._ass_file.replace("\\", "/").replace(":", "\\:")
            if filter_complex_parts:
                # Combine with existing filter
                existing = filter_complex_parts[0]
                filter_complex_parts[0] = (
                    f"{existing};"
                    f"[0:v]ass='{ass_escaped}'[vout]"
                )
                map_args = ["-map", "[vout]"] + map_args[2:]  # Replace 0:v with [vout]
            else:
                filter_complex_parts.append(f"[0:v]ass='{ass_escaped}'[vout]")
                map_args = ["-map", "[vout]", "-map", "0:a"]

        if filter_complex_parts:
            cmd.extend(["-filter_complex", ";".join(filter_complex_parts)])

        cmd.extend(map_args)
        cmd.extend(["-c:v", codec, "-crf", str(crf)])
        cmd.extend(["-c:a", "aac", "-b:a", "192k"])
        cmd.append(self.output_path)

        logger.info(f"FFmpeg command: {' '.join(cmd)}")

        proc = subprocess.Popen(
            cmd,
            stderr=subprocess.PIPE,
            stdout=subprocess.PIPE,
            universal_newlines=True,
        )

        # Parse progress from stderr
        for line in proc.stderr:
            if "time=" in line and progress_callback:
                try:
                    time_str = line.split("time=")[1].split(" ")[0]
                    h, m, s = time_str.split(":")
                    seconds = int(h) * 3600 + int(m) * 60 + float(s)
                    progress_callback(seconds)
                except (ValueError, IndexError):
                    pass

        proc.wait()

        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg failed with code {proc.returncode}")

        logger.info(f"FFmpeg output: {self.output_path}")
        return self.output_path

    @staticmethod
    def _seconds_to_ass_time(seconds: float) -> str:
        """Convert seconds to ASS time format: H:MM:SS.CC"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = seconds % 60
        cs = int((s - int(s)) * 100)
        return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"
