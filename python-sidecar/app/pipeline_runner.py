"""
Pipeline Runner — orchestrates transcribe → translate → TTS → merge.
Yields SSE progress events.
"""
import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Optional

from app.engines.asr import WhisperASR
from app.engines.output import FFmpegOutputBuilder

logger = logging.getLogger(__name__)

STAGES = ["upload", "transcribe", "translate", "tts", "merge", "done"]


class PipelineConfig:
    """Config cho full pipeline run."""

    def __init__(
        self,
        # Translation
        translation_engine: str = "argos",
        source_lang: str = "auto",
        target_lang: str = "vi",
        translation_style: str = "default",
        custom_prompt: str = "",
        api_key: str = "",
        fallback_engine: Optional[str] = None,
        fallback_api_key: str = "",
        # TTS
        tts_engine: str = "edge_tts",
        voice: str = "vi-VN-HoaiMyNeural",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
        dubbing_enabled: bool = True,
        # Audio mix
        original_volume: float = 0.1,
        speed: float = 1.0,
        # Subtitle
        subtitle_enabled: bool = True,
        subtitle_config: Optional[dict] = None,
        # Output
        codec: str = "libx264",
        crf: int = 23,
        preset: str = "fast",
        # Output Advanced
        watermark_enabled: bool = False,
        watermark_text: str = "",
        watermark_x: int = 10,
        watermark_y: int = 10,
        watermark_opacity: float = 1.0,
        blur_enabled: bool = False,
        blur_regions: Optional[list] = None,
        crop_enabled: bool = False,
        bgm_enabled: bool = False,
        bgm_file: str = "",
        bgm_volume: float = 0.5,
        ducking_strength: float = 0.2,
        **kwargs
    ):
        self.translation_engine = translation_engine
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.translation_style = translation_style
        self.custom_prompt = custom_prompt
        self.api_key = api_key
        self.fallback_engine = fallback_engine
        self.fallback_api_key = fallback_api_key
        self.tts_engine = tts_engine
        self.voice = voice
        self.rate = rate
        self.volume = volume
        self.pitch = pitch
        self.dubbing_enabled = dubbing_enabled
        self.original_volume = original_volume
        self.speed = speed
        self.subtitle_enabled = subtitle_enabled
        self.subtitle_config = subtitle_config or {
            "font": "Be Vietnam Pro",
            "font_size": 50,
            "position": 90,
            "color": "#FFFF00",
            "outline_color": "#000000",
        }
        self.codec = codec
        self.crf = crf
        self.preset = preset
        self.watermark_enabled = watermark_enabled
        self.watermark_text = watermark_text
        self.watermark_x = watermark_x
        self.watermark_y = watermark_y
        self.watermark_opacity = watermark_opacity
        self.blur_enabled = blur_enabled
        self.blur_regions = blur_regions or []
        # Map old blur properties from kwargs for backward compatibility
        if "blur_x" in kwargs and "blur_y" in kwargs and "blur_w" in kwargs and "blur_h" in kwargs:
            self.blur_regions.append({
                "x": kwargs["blur_x"],
                "y": kwargs["blur_y"],
                "w": kwargs["blur_w"],
                "h": kwargs["blur_h"],
            })
        self.crop_enabled = crop_enabled
        self.bgm_enabled = bgm_enabled
        self.bgm_file = bgm_file
        self.bgm_volume = bgm_volume
        self.ducking_strength = ducking_strength


class PipelineRunner:
    """Run full pipeline: transcribe → translate → TTS → merge."""

    async def run_analyze(
        self,
        video_path: str,
        config: PipelineConfig,
    ) -> AsyncGenerator[dict, None]:
        """Chạy Analyze: Transcribe -> Translate -> return segments."""
        try:
            # ── Stage 1: Transcribe ──
            yield {"stage": "transcribe", "progress": 0, "message": "Loading Whisper model..."}
            await asyncio.sleep(0.1)  # Flush SSE event before blocking calls

            model_size, device, compute_type = WhisperASR.detect_best_model()
            asr = WhisperASR(model_size=model_size, device=device, compute_type=compute_type)

            yield {"stage": "transcribe", "progress": 10, "message": f"Transcribing with {model_size}..."}
            await asyncio.sleep(0.1)

            # Run synchronous transcribe in a separate thread so it doesn't block FastAPI event loop
            result = await asyncio.to_thread(asr.transcribe, video_path, language=config.source_lang)
            segments = result["segments"]
            detected_lang = result["language"]
            duration = result["duration"]

            yield {
                "stage": "transcribe", "progress": 25,
                "message": f"Transcribed {len(segments)} segments ({detected_lang})"
            }

            # ── Stage 2: Translate ──
            yield {"stage": "translate", "progress": 25, "message": f"Translating with {config.translation_engine}..."}

            from app.routes.pipeline import get_translation_engine
            engine = get_translation_engine(config.translation_engine, config.api_key)

            translated_segments = []
            current_engine = engine
            using_fallback = False
            
            for i, seg in enumerate(segments):
                try:
                    translated = await current_engine.translate(
                        seg["text"], detected_lang, config.target_lang,
                        style=config.translation_style, custom_prompt=config.custom_prompt
                    )
                    translated_segments.append({**seg, "translated": translated})
                except Exception as e:
                    # Bắt mọi lỗi từ Engine cũ để fallback
                    if not using_fallback:
                        fallback_eng = config.fallback_engine
                        if not fallback_eng:
                            # Tên engine gọi offline là "argos", không phải "offline"
                            fallback_eng = "gemini" if config.translation_engine != "gemini" else "argos"
                            
                        yield {
                            "stage": "translate",
                            "progress": 25 + int((i / len(segments)) * 25),
                            "message": f"Translation failed with {config.translation_engine}. Falling back to {fallback_eng}...",
                            "type": "warning"
                        }
                        try:
                            current_engine = get_translation_engine(fallback_eng, config.fallback_api_key)
                        except Exception as eng_err:
                            logger.error(f"Failed to init fallback engine {fallback_eng}: {eng_err}")
                            raise e # Ném lại lỗi cũ nếu fallback engine cũng không load được
                            
                        using_fallback = True
                        
                        # Retranslate the current segment
                        try:
                            translated = await current_engine.translate(
                                seg["text"], detected_lang, config.target_lang,
                                style=config.translation_style, custom_prompt=config.custom_prompt
                            )
                            translated_segments.append({**seg, "translated": translated})
                        except Exception as sub_e:
                            logger.error(f"Fallback translation failed: {sub_e}")
                            translated_segments.append({**seg, "translated": seg["text"]}) # Hard fallback: giữ nguyên text source
                    else:
                        raise e

            yield {
                "stage": "translate", "progress": 50,
                "message": f"Translated {len(translated_segments)} segments"
            }

            # ── Analyze Done ──
            yield {
                "stage": "done", "progress": 100,
                "message": "Analyze complete!",
                "segments": translated_segments,
                "duration": duration,
            }

        except Exception as e:
            logger.error(f"Analyze failed: {e}")
            yield {
                "stage": "error", "progress": -1,
                "message": str(e),
            }

    async def run_render(
        self,
        video_path: str,
        config: PipelineConfig,
        segments: list[dict],
        duration: float,
        target_path: Optional[str] = None,
    ) -> AsyncGenerator[dict, None]:
        """Chạy Render: TTS -> Merge -> return output_path."""
        if target_path:
            output_dir = os.path.dirname(target_path)
            output_path = target_path
        else:
            output_dir = tempfile.mkdtemp(prefix="knreup_")
            output_path = os.path.join(output_dir, f"output_{Path(video_path).stem}.mp4")

        try:
            # ── Stage 3: TTS ──
            dubbed_audio_path = None
            if config.dubbing_enabled:
                yield {"stage": "tts", "progress": 50, "message": f"Generating speech with {config.tts_engine}..."}

                from app.routes.pipeline import get_tts_engine
                tts = get_tts_engine(config.tts_engine)

                # Synthesize each segment
                audio_files = []
                for i, seg in enumerate(segments):
                    audio_path = os.path.join(output_dir, f"tts_{i:04d}.mp3")
                    text = seg.get("translated_text", seg.get("translated", seg.get("source_text", seg.get("text", ""))))
                    if text.strip():
                        await tts.synthesize(
                            text=text,
                            voice=config.voice,
                            output_path=audio_path,
                            rate=config.speed,
                            volume=config.volume,
                            pitch=config.pitch,
                        )
                        audio_files.append({
                            "path": audio_path,
                            "start": seg["start"],
                            "end": seg["end"],
                        })

                    progress = 50 + int((i + 1) / len(segments) * 25)
                    yield {"stage": "tts", "progress": progress, "message": f"TTS segment {i+1}/{len(segments)}"}

                # Merge all TTS audio into one file with correct timing
                if audio_files:
                    dubbed_audio_path = os.path.join(output_dir, "dubbed_audio.wav")
                    await self._merge_tts_audio(audio_files, dubbed_audio_path, duration, config.speed, config.pitch)
                else:
                    dubbed_audio_path = None

            yield {"stage": "tts", "progress": 75, "message": "Speech generation complete"}

            # ── Stage 4: Merge ──
            yield {"stage": "merge", "progress": 75, "message": "Building final video..."}

            builder = FFmpegOutputBuilder(video_path, output_path)

            if dubbed_audio_path:
                builder.add_dubbed_audio(dubbed_audio_path, config.original_volume)

            if config.subtitle_enabled:
                builder.add_subtitles_ass(segments, config.subtitle_config)

            # Pass advanced output config to builder
            builder._config = config

            # Run FFmpeg
            yield {"stage": "merge", "progress": 85, "message": "Running FFmpeg..."}
            await asyncio.sleep(0.1)
            
            await asyncio.to_thread(builder.build, codec=config.codec, crf=config.crf)

            yield {
                "stage": "done", "progress": 100,
                "message": "Pipeline complete!",
                "output_path": output_path,
            }

        except Exception as e:
            logger.error(f"Render failed: {e}")
            yield {
                "stage": "error", "progress": -1,
                "message": str(e),
            }

    async def _merge_tts_audio(
        self,
        audio_files: list[dict],
        output_path: str,
        total_duration: float,
        speed: float = 1.0,
        pitch: float = 1.0,
    ):
        """Merge TTS audio files into one with correct timing using FFmpeg."""
        if not audio_files:
            return

        import subprocess
        import tempfile
        import os

        work_dir = os.path.dirname(audio_files[0]["path"])

        # Build FFmpeg concat filter with delay
        inputs = []
        filter_parts = []

        for i, af in enumerate(audio_files):
            # Rút ngắn đường dẫn tuyệt đối bằng cwd
            inputs.extend(["-i", os.path.basename(af["path"])])
            delay_ms = int(af["start"] * 1000)
            # Ép cứng 48000Hz cho MỌI file TTS nhập vào lưới amix để chống lỗi tua nhanh (Sample Rate Drift)
            filter_parts.append(f"[{i}:a]aresample=48000,adelay={delay_ms}|{delay_ms}[a{i}]")

        # Mix all delayed streams
        mix_inputs = "".join(f"[a{i}]" for i in range(len(audio_files)))
        
        filter_parts.append(
            f"{mix_inputs}amix=inputs={len(audio_files)}:duration=longest[out]"
        )

        filter_script_path = os.path.join(work_dir, "ff_filter.txt")
        with open(filter_script_path, "w", encoding="utf-8") as f:
            f.write(";".join(filter_parts))

        cmd = ["ffmpeg", "-y"] + inputs
        cmd.extend(["-filter_complex_script", "ff_filter.txt"])
        
        if total_duration > 0:
            cmd.extend(["-map", "[out]", "-t", str(total_duration), output_path])
        else:
            cmd.extend(["-map", "[out]", output_path])

        def run_merge():
            return subprocess.run(cmd, cwd=work_dir, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
            
        proc = await asyncio.to_thread(run_merge)
        if proc.returncode != 0:
            logger.error(f"TTS audio merge failed: {proc.stderr}")
            raise RuntimeError(f"FFmpeg audio merge failed: {proc.stderr}")
