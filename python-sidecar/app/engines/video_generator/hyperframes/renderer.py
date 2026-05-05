"""
HyperFrames renderer — subprocess wrapper for npx hyperframes render.
"""
import asyncio
import logging
import os
import json
import re
import sys
from typing import Optional, Callable, AsyncGenerator

logger = logging.getLogger(__name__)

# On Windows, npx is a .cmd/.ps1 script, not a binary executable.
# We must use shell=True (create_subprocess_shell) to invoke it.
IS_WINDOWS = sys.platform == "win32"


class HyperFramesRenderer:
    """Renders HyperFrames compositions to MP4 via CLI."""

    def __init__(self, fps: int = 30):
        self.fps = fps

    async def render(
        self,
        composition_dir: str,
        output_path: Optional[str] = None,
        callback: Optional[Callable] = None,
    ) -> str:
        """
        Render a HyperFrames composition directory to MP4.
        Returns the path to the output video file.
        """
        if output_path is None:
            output_path = os.path.join(composition_dir, "output.mp4")

        cmd = [
            "npx", "--yes", "hyperframes@0.4.43", "render",
            "--fps", str(self.fps),
            "-o", output_path,
        ]

        logger.info(f"Starting HyperFrames render: {' '.join(cmd)}")
        logger.info(f"Working directory: {composition_dir}")

        try:
            cmd_str = " ".join(cmd)
            process = await asyncio.create_subprocess_shell(
                cmd_str,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=composition_dir,
            )

            if process.stdout:
                async for line_bytes in process.stdout:
                    line = line_bytes.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue
                    logger.debug(f"[HyperFrames] {line}")

                    # Parse progress from output like "█████░░░░░  40%  Capturing frame 60/180"
                    pct_match = re.search(r"(\d+)%", line)
                    if pct_match and callback:
                        pct = int(pct_match.group(1))
                        # Clean message
                        msg = re.sub(r"[█░\s]+\d+%\s*", "", line).strip()
                        if asyncio.iscoroutinefunction(callback):
                            await callback(pct, msg or "Rendering...")
                        else:
                            callback(pct, msg or "Rendering...")

            await process.wait()

            if process.returncode != 0:
                raise RuntimeError(f"HyperFrames render failed with exit code {process.returncode}")

            if not os.path.exists(output_path):
                raise RuntimeError(f"Output video not found at {output_path}")

            file_size = os.path.getsize(output_path)
            logger.info(f"Render complete: {output_path} ({file_size / 1024:.1f} KB)")
            return output_path

        except FileNotFoundError:
            raise RuntimeError(
                "HyperFrames CLI not found. Ensure Node.js >= 22 is installed "
                "and `npx hyperframes` is available."
            )

    async def render_stream(
        self,
        composition_dir: str,
        output_path: Optional[str] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Render with SSE-compatible progress streaming.
        Yields dicts: {"status": str, "progress": int, "message": str}
        """
        if output_path is None:
            output_path = os.path.join(composition_dir, "output.mp4")

        yield {"status": "starting", "progress": 0, "message": "Khởi tạo HyperFrames engine..."}

        cmd = [
            "npx", "--yes", "hyperframes@0.4.43", "render",
            "--fps", str(self.fps),
            "-o", output_path,
        ]

        try:
            cmd_str = " ".join(cmd)
            process = await asyncio.create_subprocess_shell(
                cmd_str,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=composition_dir,
            )

            last_pct = 0
            if process.stdout:
                async for line_bytes in process.stdout:
                    line = line_bytes.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue

                    pct_match = re.search(r"(\d+)%", line)
                    if pct_match:
                        pct = int(pct_match.group(1))
                        if pct > last_pct:
                            last_pct = pct
                            msg = re.sub(r"[█░\s]+\d+%\s*", "", line).strip()
                            yield {
                                "status": "rendering",
                                "progress": pct,
                                "message": msg or "Đang render..."
                            }

            await process.wait()

            if process.returncode != 0:
                yield {"status": "error", "progress": 0, "message": "HyperFrames render thất bại"}
                return

            if os.path.exists(output_path):
                size_kb = os.path.getsize(output_path) / 1024
                yield {
                    "status": "done",
                    "progress": 100,
                    "message": f"Render hoàn tất ({size_kb:.0f} KB)",
                    "videoPath": output_path,
                }
            else:
                yield {"status": "error", "progress": 0, "message": "File output không tìm thấy"}

        except FileNotFoundError:
            yield {"status": "error", "progress": 0, "message": "HyperFrames CLI chưa cài đặt"}
        except Exception as e:
            yield {"status": "error", "progress": 0, "message": f"Lỗi: {str(e)}"}
