import os
import json
import logging
import uuid
import asyncio
from typing import Callable, AsyncGenerator

from app.engines.video_generator.schema import VideoGenRequest, VideoScript
from app.engines.video_generator.scraper import WebScraper
from app.engines.video_generator.script_engine import OllamaScriptGenerator
from app.engines.video_generator.playwright_renderer import FrameRenderer
from app.engines.video_generator.audio_mixer import AudioMixer, SfxOverlay
from app.engines.video_generator.sfx_selector import (
    index_sfx_library, pick_sfx_for_scene, get_default_playback, filter_sfx_overlays
)

# Try importing TTS Engine
try:
    from app.engines.tts.omnivoice_engine import OmniVoiceTTSEngine
except ImportError:
    OmniVoiceTTSEngine = None

logger = logging.getLogger(__name__)

class VideoGenerationPipeline:
    """End-to-End Pipeline for Web Scraper to Video generation."""

    def __init__(self, workspace_dir: str = "./workspace/video_gen"):
        self.workspace_dir = os.path.abspath(workspace_dir)
        os.makedirs(self.workspace_dir, exist_ok=True)
        
        self.scraper = WebScraper()
        self.llm = OllamaScriptGenerator()
        
        self.tts = OmniVoiceTTSEngine() if OmniVoiceTTSEngine else None
        self.audio_mixer = AudioMixer(self.tts)
        self.renderer = FrameRenderer(fps=30)

        # Index SFX library for smart audio overlay
        sfx_dir = os.path.join(os.path.dirname(__file__), "hyperframes", "assets", "sfx")
        self.sfx_index = index_sfx_library(sfx_dir)

    async def generate_script_only(self, request: VideoGenRequest) -> dict:
        """
        Step 1: Scrapes URL and generates script via LLM.
        """
        session_id = str(uuid.uuid4())[:8]
        session_dir = os.path.join(self.workspace_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Scrape
        logger.info(f"Scraping URL: {request.url}")
        scrape_data = await self.scraper.scrape(request.url)
        if not scrape_data["success"]:
            raise Exception(f"Không thể lấy nội dung: {scrape_data.get('error', '')}")
            
        if self.tts and hasattr(self.tts, "force_unload"):
            logger.info("Ensuring TTS is unloaded from GPU to free memory for Ollama...")
            self.tts.force_unload()

        # Script
        logger.info("Generating script via LLM...")
        script: VideoScript = await self.llm.generate(content=scrape_data["markdown"], source_url=request.url)
        
        # Save script locally
        script_path = os.path.join(session_dir, "script.json")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script.model_dump_json(indent=2))
            
        return {
            "session_id": session_id,
            "script": script.model_dump(),
            "word_count": scrape_data.get("word_count", 0)
        }

    async def render_only(self, request: dict) -> AsyncGenerator[str, None]:
        """
        Step 2: Take user-reviewed script and generate video.
        """
        session_id = request.get("session_id")
        if not session_id:
            yield json.dumps({"status": "error", "message": "Missing session_id"}) + "\n"
            return
            
        session_dir = os.path.join(self.workspace_dir, session_id)
        audio_dir = os.path.join(session_dir, "audio")
        frames_dir = os.path.join(session_dir, "frames")
        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(frames_dir, exist_ok=True)
        
        output_video_path = os.path.join(session_dir, f"output_{session_id}.mp4")

        def _format_event(status: str, progress: int, message: str) -> str:
            return json.dumps({"status": status, "progress": progress, "message": message}) + "\n"

        try:
            script_data = request.get("script", {})
            scenes = script_data.get("scenes", [])
            voice_paths = []
            
            # Step A: Audio Generation
            yield _format_event("tts", 10, "Đang tạo giọng đọc cho các phân cảnh...")
            for i, scene in enumerate(scenes):
                scene_content = scene.get("voiceText", "").strip()
                if scene_content:
                    audio_path = os.path.join(audio_dir, f"scene_{i:03d}.mp3")
                    duration = await self.audio_mixer.generate_scene_audio(
                        text=scene_content,
                        voice_id=request.get("voice_id", "vi-VN-HoaiMyNeural"),
                        output_path=audio_path
                    )
                    scene["duration"] = duration
                    voice_paths.append(audio_path)
                    prog = 10 + int((i + 1) / max(len(scenes), 1) * 20)
                    yield _format_event("tts", prog, f"Đã tạo audio {i+1}/{len(scenes)} ({duration:.1f}s)")
                else:
                    scene["duration"] = 2.0  # Fallback
            
            # Mix Audio
            mixed_audio_path = os.path.join(audio_dir, "mixed_audio.wav")
            yield _format_event("audio_mix", 35, "Đang mix âm thanh tổng...")
            # Todo: allow passing actual bgm_path
            await self.audio_mixer.mix_audio_tracks(voice_paths, None, mixed_audio_path)

            # SFX Selection + Overlay
            sfx_overlays = []
            current_ts = 0.0
            for i, scene in enumerate(scenes):
                scene_sfx = scene.get("sfx")
                template_name = scene.get("templateData", {}).get("template", "")
                voice_text = scene.get("voiceText", "")
                scene_id = scene.get("id", f"s{i}")

                if scene_sfx and scene_sfx.get("name") == "none":
                    pass  # Tier 1: explicit disable
                elif scene_sfx and scene_sfx.get("name"):
                    # Tier 1: explicit override
                    sfx_path = os.path.join(os.path.dirname(__file__), "hyperframes", "assets", "sfx", scene_sfx["name"])
                    if os.path.exists(sfx_path):
                        sfx_overlays.append(SfxOverlay(
                            path=sfx_path,
                            timestamp_sec=current_ts,
                            volume=scene_sfx.get("volume", 0.4),
                            offset_sec=scene_sfx.get("startOffsetSec", 0.0),
                        ))
                else:
                    # Tier 2-4: automatic selection
                    picked = pick_sfx_for_scene(voice_text, template_name, scene_id, self.sfx_index)
                    if picked:
                        sfx_path = os.path.join(os.path.dirname(__file__), "hyperframes", "assets", "sfx", picked.rel_path)
                        playback = get_default_playback(picked)
                        sfx_overlays.append(SfxOverlay(
                            path=sfx_path,
                            timestamp_sec=current_ts,
                            volume=playback["volume"],
                            offset_sec=playback["offset_sec"],
                        ))
                current_ts += scene.get("duration", 2.0)

            if sfx_overlays:
                filtered_overlays = filter_sfx_overlays(sfx_overlays, max_count=3)
                yield _format_event("sfx", 37, f"Overlaying {len(filtered_overlays)} SFX (lọc từ {len(sfx_overlays)})...")
                sfx_audio_path = os.path.join(audio_dir, "mixed_with_sfx.wav")
                await self.audio_mixer.overlay_sfx(mixed_audio_path, filtered_overlays, sfx_audio_path)
                mixed_audio_path = sfx_audio_path

            # Step B: Frame Rendering
            theme_name = request.get("theme", "default")
            yield _format_event("rendering", 40, "Đang khởi tạo engine render hình ảnh...")
            
            start_frame_idx = 0
            for i, scene in enumerate(scenes):
                yield _format_event("rendering", 40 + int(i/max(len(scenes), 1)*40), f"Render hình ảnh scene {i+1}/{len(scenes)}...")
                await self.renderer.render_scene_frames(
                    scene=scene,
                    duration_sec=scene["duration"],
                    output_dir=frames_dir,
                    start_frame_index=start_frame_idx,
                    theme_name=theme_name,
                    callback=lambda p, msg: None
                )
                start_frame_idx += int(scene["duration"] * self.renderer.fps)

            # Step C: FFmpeg Composition
            yield _format_event("compositing", 85, "Đang tổng hợp khung hình và âm thanh bằng FFmpeg...")
            import subprocess
            cmd = [
                "ffmpeg", "-y",
                "-framerate", str(self.renderer.fps),
                "-i", os.path.join(frames_dir, "frame_%05d.jpg"),
                "-i", mixed_audio_path,
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast",
                "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                output_video_path
            ]
            
            proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, timeout=300)
            if proc.returncode != 0:
                raise Exception(f"FFmpeg failed: {proc.stderr.decode()}")

            yield _format_event("complete", 100, "Render thành công!")
            yield json.dumps({"status": "done", "videoUrl": f"http://127.0.0.1:8008/api/video-gen/download/{session_id}"}) + "\n"

        except Exception as e:
            logger.exception("Pipeline failed")
            yield _format_event("error", 0, f"Lỗi hệ thống: {str(e)}")
