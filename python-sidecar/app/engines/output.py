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

        # Get original video dimensions for proportional coordinate mapping
        try:
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "v:0",
                 "-show_entries", "stream=width,height", "-of", "csv=p=0",
                 self.input_video],
                capture_output=True, text=True, timeout=10
            )
            parts = probe.stdout.strip().split(",")
            orig_w, orig_h = int(parts[0]), int(parts[1])
        except Exception:
            orig_w, orig_h = 1920, 1080  # fallback

        # Video stream input parsing
        v_current = f"{input_index}:v"

        # Compute effective dimensions (target standard frame)
        video_ratio = getattr(config, "video_ratio", "original") if config else "original"
        if video_ratio == "16:9":
            eff_w, eff_h = 1920, 1080
        elif video_ratio == "9:16":
            eff_w, eff_h = 1080, 1920
        else:
            eff_w = orig_w
            eff_h = orig_h

        # Check Advanced Effects
        if config:
            # 1. Scale to fit target bounding box, then Pad to final format
            if video_ratio in ("16:9", "9:16"):
                # Compute exact scale dimensions matching object-fit: contain (allowing upscaling)
                scale_ratio = min(eff_w / orig_w, eff_h / orig_h) if orig_w > 0 and orig_h > 0 else 1.0
                scale_w = int(orig_w * scale_ratio)
                scale_h = int(orig_h * scale_ratio)
                
                # Make sure scale dimensions are even
                scale_w = scale_w if scale_w % 2 == 0 else scale_w + 1
                scale_h = scale_h if scale_h % 2 == 0 else scale_h + 1

                filter_complex_parts.append(
                    f"[{v_current}]scale={scale_w}:{scale_h},"
                    f"pad={eff_w}:{eff_h}:(ow-iw)/2:(oh-ih)/2:black[vpad]"
                )
                v_current = "vpad"

            # 2. Blur (use proportional coordinates: ratio * current frame size)
            if getattr(config, "blur_enabled", False):
                regions = getattr(config, "blur_regions", [])
                for i, r in enumerate(regions):
                    try:
                        # Convert pixel coords to ratios and clamp strictly within [0, 1] bounds
                        rx = max(0.0, min(1.0, float(r.get("x", 0)) / eff_w))
                        ry = max(0.0, min(1.0, float(r.get("y", 0)) / eff_h))
                        rw = max(0.01, min(1.0 - rx, float(r.get("w", 0)) / eff_w))
                        rh = max(0.01, min(1.0 - ry, float(r.get("h", 0)) / eff_h))
                        if rw > 0.01 and rh > 0.01:
                            # Use expression-based coordinates relative to current frame
                            filter_complex_parts.append(
                                f"[{v_current}]split=2[bm{i}][bb{i}];"
                                f"[bb{i}]crop='iw*{rw}':'ih*{rh}':'iw*{rx}':'ih*{ry}',gblur=sigma=20[bp{i}];"
                                f"[bm{i}][bp{i}]overlay='W*{rx}':'H*{ry}'[vblur{i}]"
                            )
                            v_current = f"vblur{i}"
                    except (ValueError, TypeError):
                        pass

            # 3. Watermark Text (proportional coordinates)
            if getattr(config, "watermark_enabled", False) and getattr(config, "watermark_text", ""):
                text = getattr(config, "watermark_text", "").replace("'", "\\'")
                rx = float(getattr(config, "watermark_x", 10)) / eff_w
                ry = float(getattr(config, "watermark_y", 10)) / eff_h
                alpha = getattr(config, "watermark_opacity", 1.0)
                fontsize = int(getattr(config, "watermark_fontsize", 40))
                filter_complex_parts.append(
                    f"[{v_current}]drawtext=text='{text}':font='Arial':fontcolor=white@{alpha}:fontsize={fontsize}:x='w*{rx}':y='h*{ry}':shadowcolor=black@{alpha}:shadowx=2:shadowy=2[vwm]"
                )
                v_current = "vwm"

            # 4. Image Logo Overlay (proportional coordinates + scale)
            image_logo_file = getattr(config, "image_logo_file", "")
            if getattr(config, "image_logo_enabled", False) and image_logo_file and os.path.exists(image_logo_file):
                input_index += 1
                cmd.extend(["-i", image_logo_file])
                logo_input = f"{input_index}:v"
                rx = float(getattr(config, "image_logo_x", 10)) / eff_w
                ry = float(getattr(config, "image_logo_y", 10)) / eff_h
                lalpha = float(getattr(config, "image_logo_opacity", 0.8))
                lw = int(getattr(config, "image_logo_w", 150))
                lh = int(getattr(config, "image_logo_h", 150))
                # Scale logo proportional to explicit box matching object-fit: contain
                filter_complex_parts.append(
                    f"[{logo_input}]scale='{lw}':'{lh}':force_original_aspect_ratio=decrease,format=rgba,colorchannelmixer=aa={lalpha}[logo_ready]"
                )
                filter_complex_parts.append(
                    f"[{v_current}][logo_ready]overlay='W*{rx}':'H*{ry}'[vlogo]"
                )
                v_current = "vlogo"

        # 4. Add ASS subtitles
        if self._ass_file:
            ass_escaped = self._ass_file.replace("\\", "/").replace(":", "\\:")
            filter_complex_parts.append(f"[{v_current}]ass='{ass_escaped}'[vout]")
            v_current = "vout"

        # Audio stream inputs parsing (audio gốc LUÔN ở input 0 = video file)
        a_orig = "0:a"
        audio_streams_to_mix = []
        
        # Original Audio
        orig_vol = self._original_volume
        filter_complex_parts.append(f"[{a_orig}]aresample=48000,volume={orig_vol}[aorig]")
        audio_streams_to_mix.append("[aorig]")

        # Dubbed Audio
        bgm_file = getattr(config, "bgm_file", "") if config else ""
        has_bgm = getattr(config, "bgm_enabled", False) and bgm_file and os.path.exists(bgm_file)
        
        if self._dubbed_audio:
            input_index += 1
            cmd.extend(["-i", self._dubbed_audio])
            a_dub = f"{input_index}:a"
            if has_bgm:
                # Split dubbed audio: one for final mix, one for BGM sidechain ducking trigger
                filter_complex_parts.append(f"[{a_dub}]aresample=48000,volume=1.0,asplit=2[adub_mix][adub_sc]")
                audio_streams_to_mix.append("[adub_mix]")
            else:
                filter_complex_parts.append(f"[{a_dub}]aresample=48000,volume=1.0[adub]")
                audio_streams_to_mix.append("[adub]")

        # BGM Audio
        if has_bgm:
            input_index += 1
            cmd.extend(["-stream_loop", "-1", "-i", bgm_file])
            a_bgm = f"{input_index}:a"
            bgm_vol = getattr(config, "bgm_volume", 0.5)
            duck_str = float(getattr(config, "ducking_strength", 0.2))
            
            # Map duck_str (0.0-1.0) to ratio (1.0-20.0)
            ratio_val = max(1.0, min(20.0, duck_str * 20.0))
            
            # Apply sidechain ducking if dubbed audio exists
            if self._dubbed_audio:
                filter_complex_parts.append(f"[{a_bgm}]aresample=48000,volume={bgm_vol}[abgm_base]")
                filter_complex_parts.append(f"[abgm_base][adub_sc]sidechaincompress=threshold=0.1:ratio={ratio_val:.1f}:attack=5:release=50[abgm]")
                audio_streams_to_mix.append("[abgm]")
            else:
                filter_complex_parts.append(f"[{a_bgm}]aresample=48000,volume={bgm_vol}[abgm]")
                audio_streams_to_mix.append("[abgm]")

        mix_inputs = "".join(audio_streams_to_mix)
        filter_complex_parts.append(f"{mix_inputs}amix=inputs={len(audio_streams_to_mix)}:duration=first:normalize=0[aout]")

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
            stdout=subprocess.DEVNULL,
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
            error_log = "".join(stderr_lines[-10:])  # Lấy 10 dòng log lỗi cuối
            raise RuntimeError(f"FFmpeg failed with exit code {proc.returncode}. Log: {error_log}")

        # Cleanup temp ASS file
        if self._ass_file and os.path.exists(self._ass_file):
            import contextlib
            with contextlib.suppress(OSError):
                os.remove(self._ass_file)

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
