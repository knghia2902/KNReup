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
from app.engines.video_generator.audio_mixer import AudioMixer

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

            # Step B: Frame Rendering
            yield _format_event("rendering", 40, "Đang khởi tạo engine render hình ảnh...")
            
            async def progress_callback(prog: int, msg: str):
                # mapped from 40 to 80
                mapped_prog = 40 + int((prog / 100) * 40)
                # Currently we can't yield from a simple callback easily unless we use a queue,
                # but we will just rely on the logging.

            start_frame_idx = 0
            for i, scene in enumerate(scenes):
                yield _format_event("rendering", 40 + int(i/max(len(scenes), 1)*40), f"Render hình ảnh scene {i+1}/{len(scenes)}...")
                await self.renderer.render_scene_frames(
                    scene=scene,
                    duration_sec=scene["duration"],
                    output_dir=frames_dir,
                    start_frame_index=start_frame_idx,
                    callback=progress_callback
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
