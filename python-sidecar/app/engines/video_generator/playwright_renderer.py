import asyncio
import logging
import os
import json
from typing import Callable, Optional, List
from playwright.async_api import async_playwright
from app.engines.video_generator.schema import VideoScript

logger = logging.getLogger(__name__)

class PlaywrightRendererError(Exception):
    pass

class FrameRenderer:
    """Renderer using Playwright and GSAP to extract frames."""

    def __init__(self, fps: int = 30):
        self.fps = fps
        self.html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "templates", "index.html"))

    async def render_scene_frames(
        self,
        scene: dict,
        duration_sec: float,
        output_dir: str,
        start_frame_index: int = 0,
        callback: Optional[Callable[[int, str], None]] = None
    ) -> List[str]:
        """
        Renders a single scene into frames using Playwright.
        Returns a list of frame file paths.
        """
        if not os.path.exists(self.html_path):
            raise PlaywrightRendererError(f"Template HTML not found at {self.html_path}")

        frames_paths = []
        total_frames = int(duration_sec * self.fps)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1080, "height": 1920},
                device_scale_factor=1
            )
            page = await context.new_page()
            
            # Load local HTML file
            await page.goto(f"file://{self.html_path}")
            
            # Ensure GSAP and fonts are loaded
            await page.wait_for_load_state("networkidle")

            # Inject scene data
            scene_data_json = json.dumps(scene)
            await page.evaluate(f"window.renderScene({scene_data_json});")
            
            # Take screenshots frame by frame
            for i in range(total_frames):
                current_time = i / self.fps
                # Seek GSAP global timeline
                await page.evaluate(f"gsap.globalTimeline.seek({current_time});")
                
                frame_idx = start_frame_index + i
                frame_path = os.path.join(output_dir, f"frame_{frame_idx:05d}.jpg")
                
                await page.screenshot(path=frame_path, type="jpeg", quality=90)
                frames_paths.append(frame_path)
                
                if callback and i % 10 == 0:
                    prog = int((i / total_frames) * 100)
                    if asyncio.iscoroutinefunction(callback):
                        await callback(prog, f"Rendering frame {i}/{total_frames} for scene {scene['id']}")
                    else:
                        callback(prog, f"Rendering frame {i}/{total_frames} for scene {scene['id']}")
                        
            await browser.close()
            
        return frames_paths
