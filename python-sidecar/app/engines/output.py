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

# 0..100 -> MarginV when alignment is 8 (top center)


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
        # Get video dimensions using ffprobe
        import json
        import subprocess
        try:
            probe_cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_tags=rotate:stream_side_data=rotation", "-of", "json", self.input_video]
            probe_out = subprocess.check_output(probe_cmd).decode("utf-8", errors="replace")
            probe_data = json.loads(probe_out)
            stream = probe_data["streams"][0]
            width = int(stream["width"])
            height = int(stream["height"])
            
            rotation = 0
            if "tags" in stream and "rotate" in stream["tags"]:
                rotation = int(float(stream["tags"]["rotate"]))
            elif "side_data_list" in stream:
                for sd in stream["side_data_list"]:
                    if "rotation" in sd:
                        rotation = int(float(sd["rotation"]))
            if abs(rotation) == 90 or abs(rotation) == 270:
                width, height = height, width
        except Exception as e:
            logger.warning(f"ffprobe failed, fallback to 1920x1080. Error: {e}")
            width, height = 1920, 1080

        font_name = config.get("font", config.get("font_name", "Arial"))
        font_size = config.get("font_size", 50)
        color = config.get("color", "#FFFF00")
        outline_color = config.get("outline_color", "#000000")
        position = config.get("position", 90)  # 0-100 percentage
        
        # Match Canvas scaling logic (Base: 1080p)
        ass_font_size = int(float(font_size) * (height / 1080.0))
        ass_outline = max(1, int(ass_font_size * 0.08))  # Match Canvas ctx.lineWidth = fontSize * 0.08
        alignment = 5 # Middle Center
        
        # Exact position mapping
        pos_x = int(width / 2)
        pos_y = int(height * (position / 100.0))

        margin_h = int(width * 0.05)
        # Average character width for a bold sans-serif font is roughly 55% of font size
        avg_char_width = max(1.0, ass_font_size * 0.55)
        max_chars = max(10, int((width - 2 * margin_h) / avg_char_width))

        import textwrap

        primary_colour = _color_to_ass(color)
        outline_colour = _color_to_ass(outline_color)

        ass_content = f"""[Script Info]
Title: KNReup Subtitles
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{ass_font_size},{primary_colour},&H000000FF,{outline_colour},&H80000000,0,0,0,0,100,100,0,0,1,{ass_outline},0,{alignment},{margin_h},{margin_h},0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        for seg in segments:
            text = seg.get("translated_text", seg.get("translated", seg.get("source_text", seg.get("text", ""))))
            text = text or ""
            # Escape ASS special chars
            text = text.replace("\\", "").replace("{", "\\{").replace("}", "\\}")
            
            raw_lines = []
            for para in text.split("\n"):
                if para.strip():
                    raw_lines.extend(textwrap.wrap(para.strip(), width=max_chars))
                else:
                    raw_lines.append("")
                    
            if not raw_lines:
                continue
                
            # Paginate over time (max 2 lines per screen)
            lines_per_page = 2
            total_pages = max(1, (len(raw_lines) + lines_per_page - 1) // lines_per_page)
            
            start_sec = float(seg["start"])
            end_sec = float(seg["end"])
            page_duration = (end_sec - start_sec) / total_pages
            
            for i in range(total_pages):
                page_lines = raw_lines[i * lines_per_page : (i + 1) * lines_per_page]
                page_text = "\\N".join(page_lines)
                
                p_start = start_sec + i * page_duration
                p_end = start_sec + (i + 1) * page_duration
                
                s_time = self._seconds_to_ass_time(p_start)
                e_time = self._seconds_to_ass_time(p_end)
                
                # Inject \\pos tag to perfectly match Canvas absolute positioning
                ass_content += f"Dialogue: 0,{s_time},{e_time},Default,,0,0,0,,{{\\pos({pos_x},{pos_y})}}{page_text}\n"

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
        preset: str = "fast",
        progress_callback=None,
    ) -> str:
        """Run FFmpeg command, return output path."""
        cmd = ["ffmpeg", "-y", "-i", self.input_video]

        config = getattr(self, "_config", None)

        filter_complex_parts = []
        map_args = []
        input_index = 0

        # Video stream input parsing
        v_current = f"{input_index}:v"

        # Check Advanced Effects
        if config:
            # 1. Crop 16:9 to 9:16
            if getattr(config, "crop_enabled", False):
                filter_complex_parts.append(f"[{v_current}]crop=ih*9/16:ih[vcrop]")
                v_current = "vcrop"

            # 2. Blur
            if getattr(config, "blur_enabled", False):
                bx, by = getattr(config, "blur_x", 0), getattr(config, "blur_y", 0)
                bw, bh = getattr(config, "blur_w", 0), getattr(config, "blur_h", 0)
                if bw > 0 and bh > 0:
                    filter_complex_parts.append(f"[{v_current}]delogo=x={bx}:y={by}:w={bw}:h={bh}[vblur]")
                    v_current = "vblur"

            # 3. Watermark Text
            if getattr(config, "watermark_enabled", False) and getattr(config, "watermark_text", ""):
                text = getattr(config, "watermark_text", "").replace("'", "\\'")
                wx, wy = getattr(config, "watermark_x", 10), getattr(config, "watermark_y", 10)
                alpha = getattr(config, "watermark_opacity", 1.0)
                filter_complex_parts.append(
                    f"[{v_current}]drawtext=text='{text}':fontcolor=white@{alpha}:fontsize=40:x={wx}:y={wy}:shadowcolor=black@{alpha}:shadowx=2:shadowy=2[vwm]"
                )
                v_current = "vwm"

        # 4. Add ASS subtitles
        if self._ass_file:
            ass_escaped = self._ass_file.replace("\\", "/").replace(":", "\\:")
            filter_complex_parts.append(f"[{v_current}]ass='{ass_escaped}'[vout]")
            v_current = "vout"

        # Audio stream inputs parsing
        a_orig = f"{input_index}:a"
        audio_streams_to_mix = []
        
        # Original Audio
        orig_vol = self._original_volume
        filter_complex_parts.append(f"[{a_orig}]aresample=48000,volume={orig_vol}[aorig]")
        audio_streams_to_mix.append("[aorig]")

        # Dubbed Audio
        if self._dubbed_audio:
            input_index += 1
            cmd.extend(["-i", self._dubbed_audio])
            a_dub = f"{input_index}:a"
            filter_complex_parts.append(f"[{a_dub}]aresample=48000,volume=1.0[adub]")
            audio_streams_to_mix.append("[adub]")

        # BGM Audio
        bgm_file = getattr(config, "bgm_file", "") if config else ""
        if getattr(config, "bgm_enabled", False) and bgm_file and os.path.exists(bgm_file):
            input_index += 1
            cmd.extend(["-stream_loop", "-1", "-i", bgm_file])
            a_bgm = f"{input_index}:a"
            bgm_vol = getattr(config, "bgm_volume", 0.5)
            duck_str = getattr(config, "ducking_strength", 0.2)
            # Apply sidechain ducking if dubbed audio exists
            if self._dubbed_audio:
                filter_complex_parts.append(f"[{a_bgm}]aresample=48000,volume={bgm_vol}[abgm_base]")
                filter_complex_parts.append(f"[abgm_base][adub]sidechaincompress=threshold=0.1:ratio={duck_str}:attack=5:release=50:pre_min_amp=0[abgm]")
                audio_streams_to_mix.append("[abgm]")
            else:
                filter_complex_parts.append(f"[{a_bgm}]aresample=48000,volume={bgm_vol}[abgm]")
                audio_streams_to_mix.append("[abgm]")

        mix_inputs = "".join(audio_streams_to_mix)
        filter_complex_parts.append(f"{mix_inputs}amix=inputs={len(audio_streams_to_mix)}:duration=first[aout]")

        if filter_complex_parts:
            cmd.extend(["-filter_complex", ";".join(filter_complex_parts)])

        map_args = ["-map", f"[{v_current}]", "-map", "[aout]"]
        cmd.extend(map_args)

        if codec == "libx264" or codec == "libx265":
            cmd.extend(["-c:v", codec, "-preset", preset, "-crf", str(crf)])
        elif codec == "h264_nvenc" or codec == "hevc_nvenc":
            cmd.extend(["-c:v", codec, "-preset", preset, "-cq", str(crf), "-b:v", "0"]) # NVENC uses -cq
        else:
            cmd.extend(["-c:v", codec, "-crf", str(crf)])
        cmd.extend(["-c:a", "aac", "-b:a", "192k"])
        cmd.append(self.output_path)

        logger.info(f"FFmpeg command: {' '.join(cmd)}")

        proc = subprocess.Popen(
            cmd,
            stderr=subprocess.PIPE,
            stdout=subprocess.PIPE,
            universal_newlines=True,
            encoding="utf-8",
            errors="replace"
        )

        stderr_lines = []
        for line in proc.stderr:
            stderr_lines.append(line)
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
            full_error = "".join(stderr_lines)
            raise RuntimeError(f"FFmpeg failed with code {proc.returncode}:\n{full_error}")

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
