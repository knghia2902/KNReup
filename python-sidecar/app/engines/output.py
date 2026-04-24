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
        self._proc: Optional[subprocess.Popen] = None  # Track FFmpeg process for cancel
        self._cancelled = False

    def cancel(self):
        """Kill running FFmpeg process immediately."""
        self._cancelled = True
        if self._proc and self._proc.poll() is None:
            logger.info("Cancelling FFmpeg process...")
            self._proc.kill()
            self._proc.wait(timeout=5)
            logger.info("FFmpeg process killed.")

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
        """Write .ass file using Pillow for pixel-perfect text measurement."""
        from PIL import ImageFont
        import json
        import subprocess

        # ── 1. Get ACTUAL video dimensions via ffprobe ──
        try:
            probe_cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0",
                         "-show_entries", "stream=width,height:stream_tags=rotate:stream_side_data=rotation",
                         "-of", "json", self.input_video]
            probe_out = subprocess.check_output(probe_cmd).decode("utf-8", errors="replace")
            probe_data = json.loads(probe_out)
            stream = probe_data["streams"][0]
            orig_w = int(stream["width"])
            orig_h = int(stream["height"])
            rotation = 0
            if "tags" in stream and "rotate" in stream["tags"]:
                rotation = int(float(stream["tags"]["rotate"]))
            elif "side_data_list" in stream:
                for sd in stream["side_data_list"]:
                    if "rotation" in sd:
                        rotation = int(float(sd["rotation"]))
            if abs(rotation) in (90, 270):
                orig_w, orig_h = orig_h, orig_w
        except Exception as e:
            logger.warning(f"ffprobe failed, fallback to 1920x1080. Error: {e}")
            orig_w, orig_h = 1920, 1080

        # ── 2. Determine effective output dimensions ──
        video_ratio = config.get("video_ratio", "original")
        if video_ratio == "16:9":
            width, height = 1920, 1080
        elif video_ratio == "9:16":
            width, height = 1080, 1920
        else:
            width, height = orig_w, orig_h

        # 👋 DIY TUNE HERE: Multiplier to match Frontend Preview vs LibASS output
        # (4/3) is the theoretical factor, but we're bumping to 2.5 for testing.
        ass_scale_factor = 1.6 

        # ── 3. Font & styling config ──
        font_name = config.get("subtitle_font", "Be Vietnam Pro")
        base_font_size = int(config.get("subtitle_font_size", 50))

        # Mirror EXACT Canvas scaling: scaledFontSize = fontSize * (canvasHeight / 1080.0)
        # This is the height in exactly geometric pixels (corresponding to Canvas pixel size)
        pixel_font_size = base_font_size * (height / 1080.0)
        
        # LibASS internally divides FontSize by roughly 1.333 (empirically verified).
        # We pre-multiply by our scale factor to compensate.
        ass_style_font_size = int(pixel_font_size * ass_scale_factor)
        
        outline_radius = max(1, int(pixel_font_size * ass_scale_factor * 0.08))

        # ── 4. Load the actual TTF font for Pillow measurement ──
        # output.py is at app/engines/output.py, fonts are at assets/fonts/ (sibling to app/)
        sidecar_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        fonts_dir = os.path.join(sidecar_root, "assets", "fonts")
        font_map = {
            "Be Vietnam Pro": "BeVietnamPro-Bold.ttf",
            "Montserrat": "Montserrat-Bold.ttf",
            "BeVietnamPro-Bold": "BeVietnamPro-Bold.ttf",
            "BeVietnamPro-Medium": "BeVietnamPro-Medium.ttf",
        }
        ttf_file = os.path.join(fonts_dir, font_map.get(font_name, "BeVietnamPro-Bold.ttf"))
        try:
            pil_font = ImageFont.truetype(ttf_file, size=int(pixel_font_size))
            logger.info(f"Pillow loaded font: {ttf_file} at size {int(pixel_font_size)}")
        except Exception as e:
            logger.warning(f"Cannot load TTF {ttf_file}: {e}. Using default.")
            pil_font = ImageFont.load_default()

        # ── 5. Subtitle bounding box (percentage → pixels) ──
        def _safe_float(key: str, default: float) -> float:
            val = config.get(key)
            if val is None: return default
            try: return float(val)
            except (ValueError, TypeError): return default

        sub_x_pct = _safe_float("subtitle_x", 5.0)
        sub_y_pct = _safe_float("subtitle_y", 80.0)
        sub_w_pct = _safe_float("subtitle_w", 90.0)
        sub_h_pct = _safe_float("subtitle_h", 15.0)

        # Legacy absolute pixel conversion (values > 100 = old pixel format)
        if sub_y_pct > 100:
            sub_x_pct = (sub_x_pct / 1920.0) * 100.0
            sub_y_pct = (sub_y_pct / 1080.0) * 100.0
        if sub_w_pct > 100 or sub_h_pct > 100:
            sub_w_pct = (sub_w_pct / 1920.0) * 100.0
            sub_h_pct = (sub_h_pct / 1080.0) * 100.0

        # Clamp
        if sub_x_pct + sub_w_pct > 100: sub_w_pct = max(5, 100 - sub_x_pct)
        if sub_y_pct + sub_h_pct > 100: sub_h_pct = max(5, 100 - sub_y_pct)

        box_x = (sub_x_pct / 100.0) * width
        box_y = (sub_y_pct / 100.0) * height
        box_w = (sub_w_pct / 100.0) * width
        box_h = (sub_h_pct / 100.0) * height
        box_center_x = box_x + box_w / 2
        box_center_y = box_y + box_h / 2
        text_max_width = box_w - pixel_font_size * 0.2

        # ── 6. Greedy word-wrap using Pillow text measurement ──
        def measure_text(txt: str) -> float:
            bbox = pil_font.getbbox(txt)
            return bbox[2] - bbox[0] if bbox else 0

        def greedy_wrap(text_str: str) -> list:
            words = text_str.split(' ')
            lines = []
            current = ''
            for word in words:
                test = f"{current} {word}" if current else word
                if measure_text(test) <= text_max_width:
                    current = test
                else:
                    if current: lines.append(current)
                    current = word
            if current: lines.append(current)
            return lines

        line_height = pixel_font_size * 1.15

        # ── 7. Color conversion ──
        def hex_to_ass(hex_col: str) -> str:
            hex_col = hex_col.lstrip("#")
            if len(hex_col) == 6:
                r, g, b = hex_col[0:2], hex_col[2:4], hex_col[4:6]
                return f"&H00{b}{g}{r}"
            return "&H00FFFFFF"

        primary_color = hex_to_ass(config.get("color", "#FFFF00"))
        outline_color_ass = hex_to_ass(config.get("outline_color", "#000000"))

        # ── 8. Build ASS header ──
        # Alignment 5 = Middle Center (matches Canvas textAlign='center' + textBaseline='middle')
        ass_lines = [
            "[Script Info]\n",
            "ScriptType: v4.00+\n",
            f"PlayResX: {width}\n",
            f"PlayResY: {height}\n",
            "WrapStyle: 0\n",
            "\n[V4+ Styles]\n",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
            "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding\n",
            f"Style: Default,{font_name},{ass_style_font_size},{primary_color},&H000000FF,{outline_color_ass},&H80000000,"
            f"-1,0,0,0,100,100,0,0,1,{outline_radius},0,5,0,0,0,1\n",
            "\n[Events]\n",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        ]

        # ── 9. Generate per-line positioned dialogues ──
        for seg in segments:
            start_sec = float(seg["start"])
            end_sec = float(seg["end"])
            s_time = self._seconds_to_ass_time(start_sec)
            e_time = self._seconds_to_ass_time(end_sec)

            layout = seg.get("exact_layout")

            if layout and layout.get("lines"):
                # ✅ USE FRONTEND PRE-CALCULATED LAYOUT (pixel-perfect)
                seg_font_size = layout.get("fontSize", pixel_font_size)
                ass_seg_font_size = int(seg_font_size * ass_scale_factor)  # Pre-multiplied size
                seg_outline = max(1, int(seg_font_size * 0.08))

                for line_data in layout["lines"]:
                    px = float(line_data["x"])
                    py = float(line_data["y"])
                    line_text = str(line_data["text"])
                    # Escape ASS special chars
                    line_text = line_text.replace("\\", "").replace("{", "\\{").replace("}", "\\}")
                    # Per-line font size override via \fs tag
                    ass_lines.append(
                        f"Dialogue: 0,{s_time},{e_time},Default,,0,0,0,,"
                        f"{{\\an5\\fs{ass_seg_font_size}\\bord{seg_outline}\\pos({px:.1f},{py:.1f})}}{line_text}\n"
                    )
                logger.debug(f"  Segment [{s_time}-{e_time}]: used exact_layout ({len(layout['lines'])} lines, fs={ass_seg_font_size})")
            else:
                # ⚠️ FALLBACK: compute layout with Pillow (legacy path)
                text = seg.get("translated_text", seg.get("translated", seg.get("source_text", seg.get("text", ""))))
                text = (text or "").replace("\n", " ").strip()
                if not text:
                    continue
                text = text[0].upper() + text[1:]
                text = text.replace("\\", "").replace("{", "\\{").replace("}", "\\}")

                all_lines = greedy_wrap(text)
                start_y = box_center_y - ((len(all_lines) - 1) / 2) * line_height

                for idx, line_text in enumerate(all_lines):
                    px = box_center_x
                    py = start_y + idx * line_height
                    ass_lines.append(
                        f"Dialogue: 0,{s_time},{e_time},Default,,0,0,0,,"
                        f"{{\\an5\\pos({px:.1f},{py:.1f})}}{line_text}\n"
                    )
                logger.debug(f"  Segment [{s_time}-{e_time}]: Pillow fallback ({len(all_lines)} lines)")

        # ── 10. Write ASS file ──
        ass_path = tempfile.mktemp(suffix=".ass")
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write("".join(ass_lines))

        # Debug: also save a copy for inspection
        debug_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_ass_final.ass")
        try:
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write("".join(ass_lines))
        except Exception:
            pass

        logger.info(f"ASS file generated: {ass_path} ({len(segments)} segments, {width}x{height})")
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
                            f"[{v_current}]split=2[bm{i}][bb{i}];\n"
                            f"[bb{i}]crop='iw*{rw}':'ih*{rh}':'iw*{rx}':'ih*{ry}',boxblur=luma_radius=15:luma_power=1[bp{i}];\n"
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

        # 5. Add ASS subtitles
        if self._ass_file and getattr(config, "subtitle_enabled", True):
            # Escaping the ass parameter path for FFmpeg
            ass_escaped = self._ass_file.replace("\\", "/").replace(":", "\\:")

            # Use absolute path for fontsdir and properly escape colons for FFmpeg filtergraph parser
            fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "fonts"))
            fonts_dir_escaped = fonts_dir.replace("\\", "/").replace(":", "\\:")
            
            filter_complex_parts.append(f"[{v_current}]ass='{ass_escaped}':fontsdir='{fonts_dir_escaped}'[vout]")
            v_current = "vout"

        # Audio stream inputs parsing (audio gốc LUÔN ở input 0 = video file)
        a_orig = "0:a"
        audio_streams_to_mix = []
        
        # Original Audio
        orig_vol = self._original_volume
        filter_complex_parts.append(f"[{a_orig}]aresample=48000,volume={orig_vol}[aorig]")
        audio_streams_to_mix.append("[aorig]")

        # Dubbed Audio
        audio_file = getattr(config, "audio_file", "") if config else ""
        has_audio = getattr(config, "audio_enabled", False) and audio_file and os.path.exists(audio_file)
        
        if self._dubbed_audio:
            input_index += 1
            cmd.extend(["-i", self._dubbed_audio])
            a_dub = f"{input_index}:a"
            tts_vol = getattr(config, "volume", 1.0) if config else 1.0
            if has_audio:
                # Split dubbed audio: one for final mix, one for audio sidechain ducking trigger
                # dynaudnorm is single-pass (fast) unlike loudnorm (2-pass, very slow)
                filter_complex_parts.append(f"[{a_dub}]aresample=48000,dynaudnorm=p=0.9:m=10:s=5,volume={tts_vol},asplit=2[adub_mix][adub_sc]")
                audio_streams_to_mix.append("[adub_mix]")
            else:
                filter_complex_parts.append(f"[{a_dub}]aresample=48000,dynaudnorm=p=0.9:m=10:s=5,volume={tts_vol}[adub]")
                audio_streams_to_mix.append("[adub]")

        # Background Audio (Music)
        if has_audio:
            input_index += 1
            cmd.extend(["-stream_loop", "-1", "-i", audio_file])
            a_music = f"{input_index}:a"
            audio_vol = getattr(config, "audio_volume", 0.5)
            duck_str = float(getattr(config, "ducking_strength", 0.2))
            
            # Map duck_str (0.0-1.0) to ratio (1.0-20.0)
            ratio_val = max(1.0, min(20.0, duck_str * 20.0))
            
            # Apply sidechain ducking if dubbed audio exists
            if self._dubbed_audio:
                filter_complex_parts.append(f"[{a_music}]aresample=48000,volume={audio_vol}[audio_base]")
                filter_complex_parts.append(f"[audio_base][adub_sc]sidechaincompress=threshold=0.1:ratio={ratio_val:.1f}:attack=5:release=50[audio_mix]")
                audio_streams_to_mix.append("[audio_mix]")
            else:
                filter_complex_parts.append(f"[{a_music}]aresample=48000,volume={audio_vol}[audio_mix]")
                audio_streams_to_mix.append("[audio_mix]")

        mix_inputs = "".join(audio_streams_to_mix)
        filter_complex_parts.append(f"{mix_inputs}amix=inputs={len(audio_streams_to_mix)}:duration=first:normalize=0[aout]")

        if filter_complex_parts:
            cmd.extend(["-filter_complex", ";".join(filter_complex_parts)])

        map_args = ["-map", f"[{v_current}]", "-map", "[aout]"]
        cmd.extend(map_args)

        # Tự động chọn bộ mã hóa phần cứng nếu có GPU
        actual_codec = codec
        from app.utils.gpu_detect import detect_gpu
        gpu_info = detect_gpu()
        
        if gpu_info.get("gpu_available"):
            if codec == "h264" or codec == "libx264":
                actual_codec = "h264_nvenc"
            elif codec == "h265" or codec == "libx265" or codec == "hevc":
                actual_codec = "hevc_nvenc"
            logger.info(f"GPU detected! Switching encoder to: {actual_codec}")

        if actual_codec == "libx264" or actual_codec == "libx265":
            cmd.extend(["-c:v", actual_codec, "-preset", preset, "-crf", str(crf)])
        elif actual_codec == "h264_nvenc" or actual_codec == "hevc_nvenc":
            # NVENC uses -cq for quality, -preset p1 to p7 (fast to slow), and requires -pix_fmt
            cmd.extend([
                "-c:v", actual_codec, 
                "-preset", "p4", # p4 is balanced
                "-cq", str(crf), 
                "-b:v", "0", 
                "-pix_fmt", "yuv420p" # Đảm bảo tương thích mọi trình phát
            ])
        else:
            cmd.extend(["-c:v", actual_codec, "-crf", str(crf)])
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
        self._proc = proc  # Store for external cancel

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
        
        # DEBUG: Ghi toàn bộ stderr ra file để debug font
        with open("ffmpeg_live.log", "w", encoding="utf-8") as dump_log:
            dump_log.write("".join(stderr_lines))
            
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
