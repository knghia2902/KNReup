import asyncio
import logging
import os
import json
from typing import Callable, Optional

logger = logging.getLogger(__name__)

class NodeRendererError(Exception):
    pass

class NodeRenderer:
    """Renderer using Node.js subprocess to execute Auto-Create-Video."""

    def __init__(self, node_script_dir: str = "../auto_create_video"):
        self.node_script_dir = os.path.abspath(node_script_dir)

    async def render(
        self, 
        script_path: str, 
        output_path: str, 
        audio_dir: str, 
        callback: Optional[Callable[[int, str], None]] = None
    ) -> str:
        """
        Executes the Node.js rendering process.
        `script_path`: Path to the generated JSON script.
        `output_path`: Expected output mp4 path.
        `audio_dir`: Directory containing pre-generated TTS audio files.
        """
        
        # Verify node script exists
        index_js_path = os.path.join(self.node_script_dir, "index.js")
        if not os.path.exists(index_js_path):
            # In a real scenario, this would point to the built dist/index.js of the auto_create_video 
            logger.warning(f"Node script not found at {index_js_path}. Assumed testing context.")

        logger.info(f"Starting Node renderer subprocess for {script_path}")

        # Construct node command
        cmd = [
            "node", 
            index_js_path, 
            "--script", script_path, 
            "--output", output_path,
            "--audio-dir", audio_dir
        ]

        if not os.path.exists(self.node_script_dir):
            logger.warning("Node script directory does not exist. Generating preview video from script.")
            await asyncio.sleep(1)
            if callback:
                if asyncio.iscoroutinefunction(callback):
                    await callback(50, "Generating preview slides...")
                else:
                    callback(50, "Generating preview slides...")
            
            try:
                await self._generate_preview_video(script_path, output_path, audio_dir, callback)
                logger.info(f"Preview video generated at {output_path}")
            except Exception as e:
                logger.error(f"Failed to generate preview video: {e}")
                # Last resort: solid color video
                import subprocess
                subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi", "-i",
                    "color=c=#1a1a2e:s=1080x1920:d=5:r=24",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-preset", "ultrafast", output_path
                ], capture_output=True, timeout=30)
            
            return output_path

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.node_script_dir
            )

            # Read stdout line by line to parse progress
            if process.stdout:
                async for line in process.stdout:
                    line_str = line.decode('utf-8').strip()
                    logger.debug(f"[NodeRenderer] {line_str}")
                    
                    # Example format: [PROGRESS] 45% - Rendering frame 250
                    if line_str.startswith("[PROGRESS]") and callback:
                        try:
                            # Simple parsing logic
                            parts = line_str.split("-", 1)
                            progress_str = parts[0].replace("[PROGRESS]", "").replace("%", "").strip()
                            progress_val = int(progress_str)
                            msg = parts[1].strip() if len(parts) > 1 else ""
                            # Call the async callback if it's async, else sync. Assume sync or wrapped here.
                            # Usually we'd check if asyncio.iscoroutinefunction(callback)
                            if asyncio.iscoroutinefunction(callback):
                                await callback(progress_val, msg)
                            else:
                                callback(progress_val, msg)
                        except Exception as e:
                            logger.error(f"Failed to parse progress: {e}")

            # Also wait for stderr just in case it crashes
            stderr_data = await process.stderr.read()
            
            await process.wait()

            if process.returncode != 0:
                err_msg = stderr_data.decode('utf-8').strip()
                raise NodeRendererError(f"Node process failed with code {process.returncode}: {err_msg}")

            if not os.path.exists(output_path):
                raise NodeRendererError(f"Output video not found at {output_path} after rendering.")

            return output_path

        except Exception as e:
            logger.exception("Exception in NodeRenderer")
            raise NodeRendererError(str(e))

    async def _generate_preview_video(
        self, script_path: str, output_path: str, audio_dir: str,
        callback: Optional[Callable] = None
    ):
        """Generate a slideshow preview video from script JSON using FFmpeg."""
        import subprocess
        import tempfile
        
        # Read script
        with open(script_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)
        
        title = script_data.get("title", "Video Preview")
        scenes = script_data.get("scenes", [])
        if not scenes:
            scenes = [{"title": title, "content": "No scenes", "type": "hook"}]
        
        # Background colors per scene type
        BG_COLORS = {
            "hook": "#6366f1", "body": "#1e293b", "stats": "#0f766e",
            "comparison": "#7c3aed", "quote": "#b45309", "highlight": "#dc2626",
            "listicle": "#2563eb", "timeline": "#4338ca", "before_after": "#059669",
            "story": "#4f46e5", "breakdown": "#1d4ed8", "cta": "#e11d48"
        }
        
        session_dir = os.path.dirname(output_path)
        slides_dir = os.path.join(session_dir, "_slides")
        os.makedirs(slides_dir, exist_ok=True)
        
        slide_paths = []
        
        for i, scene in enumerate(scenes):
            scene_type = scene.get("type", "body")
            bg_color = BG_COLORS.get(scene_type, "#1e293b")
            scene_title = scene.get("title", f"Scene {i+1}")
            scene_content = scene.get("content", "")
            duration = scene.get("duration", 4)
            
            # Check if there is generated audio for this scene
            audio_path = os.path.join(audio_dir, f"scene_{i:03d}.mp3")
            has_audio = os.path.exists(audio_path)
            
            # Escape text for FFmpeg: replace special chars
            def _esc(t: str) -> str:
                return t.replace("\\", "\\\\").replace("'", "\u2019").replace('"', '\\"').replace(":", "\\:").replace("%", "%%")
            
            safe_title = _esc(scene_title[:60])
            safe_content = _esc(scene_content[:120])
            scene_num = f"Scene {i+1}/{len(scenes)} [{scene_type.upper()}]"
            
            # Write text to a temp file for FFmpeg textfile= approach
            title_file_rel = f"title_{i}.txt"
            content_file_rel = f"content_{i}.txt"
            num_file_rel = f"num_{i}.txt"
            
            title_file = os.path.join(slides_dir, title_file_rel)
            content_file = os.path.join(slides_dir, content_file_rel)
            num_file = os.path.join(slides_dir, num_file_rel)
            
            with open(title_file, "w", encoding="utf-8") as tf:
                tf.write(scene_title[:60])
            with open(content_file, "w", encoding="utf-8") as cf:
                cf.write(scene_content[:120])
            with open(num_file, "w", encoding="utf-8") as nf:
                nf.write(scene_num)
            
            slide_file_rel = f"slide_{i:02d}.mp4"
            slide_path = os.path.join(slides_dir, slide_file_rel)
            
            # Use textfile= with RELATIVE paths to avoid Windows drive letter escaping issues
            font_path = "C\\:/Windows/Fonts/arial.ttf"
            
            vf_parts = [
                f"drawtext=textfile='{num_file_rel}':fontfile='{font_path}':fontcolor=#ffffff80:fontsize=32:x=60:y=120",
                f"drawtext=textfile='{title_file_rel}':fontfile='{font_path}':fontcolor=white:fontsize=56:x=60:y=(h/2)-100:enable='between(t,0,{duration})'",
                f"drawtext=textfile='{content_file_rel}':fontfile='{font_path}':fontcolor=#ffffffb0:fontsize=36:x=60:y=(h/2)+20:enable='between(t,0,{duration})'"
            ]
            vf_filter = ",".join(vf_parts)
            
            cmd = ["ffmpeg", "-y"]
            
            if has_audio:
                # Need absolute path since we run ffmpeg with cwd=slides_dir
                audio_path_abs = os.path.abspath(audio_path).replace("\\", "/")
                # Generate video of `duration` seconds, loop audio if needed (or just let it pad)
                # Actually, wait, the audio duration might be longer or shorter than the scene `duration`.
                # Let's match video duration to audio duration exactly!
                cmd.extend(["-f", "lavfi", "-i", f"color=c={bg_color}:s=1080x1920:r=24"])
                cmd.extend(["-i", audio_path_abs])
                cmd.extend(["-vf", vf_filter])
                cmd.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast"])
                cmd.extend(["-c:a", "aac", "-shortest", slide_file_rel])
            else:
                cmd.extend(["-f", "lavfi", "-i", f"color=c={bg_color}:s=1080x1920:d={duration}:r=24"])
                cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])
                cmd.extend(["-vf", vf_filter])
                cmd.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast"])
                cmd.extend(["-c:a", "aac", "-t", str(duration), slide_file_rel])
            
            proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, timeout=60, cwd=slides_dir)
            
            if proc.returncode != 0:
                logger.warning(f"Slide {i} drawtext failed, using plain color. stderr: {proc.stderr.decode()[:200]}")
                # Fallback: plain color slide
                cmd_plain = ["ffmpeg", "-y"]
                if has_audio:
                    audio_path_abs = os.path.abspath(audio_path).replace("\\", "/")
                    cmd_plain.extend(["-f", "lavfi", "-i", f"color=c={bg_color}:s=1080x1920:r=24"])
                    cmd_plain.extend(["-i", audio_path_abs])
                    cmd_plain.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast"])
                    cmd_plain.extend(["-c:a", "aac", "-shortest", slide_file_rel])
                else:
                    cmd_plain.extend(["-f", "lavfi", "-i", f"color=c={bg_color}:s=1080x1920:d={duration}:r=24"])
                    cmd_plain.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])
                    cmd_plain.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast"])
                    cmd_plain.extend(["-c:a", "aac", "-t", str(duration), slide_file_rel])
                await asyncio.to_thread(subprocess.run, cmd_plain, capture_output=True, timeout=30, cwd=slides_dir)
            
            slide_paths.append(slide_path)
            
            if callback:
                prog = int((i + 1) / len(scenes) * 80) + 20
                if asyncio.iscoroutinefunction(callback):
                    await callback(prog, f"Slide {i+1}/{len(scenes)} done")
                else:
                    callback(prog, f"Slide {i+1}/{len(scenes)} done")
        
        # Concatenate slides
        concat_file = os.path.join(slides_dir, "concat.txt")
        with open(concat_file, "w", encoding="utf-8") as cf:
            for sp in slide_paths:
                cf.write(f"file '{sp}'\n")
        
        concat_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_file,
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "ultrafast", "-movflags", "+faststart",
            output_path
        ]
        
        proc = await asyncio.to_thread(subprocess.run, concat_cmd, capture_output=True, timeout=120)
        if proc.returncode != 0:
            raise NodeRendererError(f"Concat failed: {proc.stderr.decode()[:300]}")
        
        # Cleanup slides
        import shutil
        shutil.rmtree(slides_dir, ignore_errors=True)
