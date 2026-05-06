import os
import asyncio
import subprocess
import logging
from dataclasses import dataclass
from typing import List, Optional

logger = logging.getLogger(__name__)

class AudioMixerError(Exception):
    pass

class AudioMixer:
    """Handles TTS generation, duration probing, and audio mixing."""
    
    def __init__(self, tts_engine=None):
        self.tts = tts_engine

    async def generate_scene_audio(self, text: str, voice_id: str, output_path: str) -> float:
        """
        Generates TTS audio and returns its duration in seconds using ffprobe.
        """
        if not self.tts:
            raise AudioMixerError("TTS engine is not initialized")
            
        try:
            await self.tts.synthesize(text=text, voice=voice_id, output_path=output_path)
            
            # Use ffprobe to get exact duration
            cmd = [
                "ffprobe", "-v", "error", "-show_entries",
                "format=duration", "-of",
                "default=noprint_wrappers=1:nokey=1", output_path
            ]
            
            proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=10)
            if proc.returncode != 0:
                raise AudioMixerError(f"ffprobe failed: {proc.stderr}")
                
            duration = float(proc.stdout.strip())
            # Ensure a minimum duration to avoid 0-frame bugs
            return max(duration, 0.5)
            
        except Exception as e:
            logger.error(f"Failed to generate audio or probe duration: {e}")
            raise AudioMixerError(str(e))

    async def mix_audio_tracks(self, voice_paths: List[str], bgm_path: Optional[str], output_path: str) -> str:
        """
        Concatenates voice clips and mixes them with background music.
        """
        if not voice_paths:
            raise AudioMixerError("No voice paths provided for mixing")
            
        concat_file = output_path.replace(".wav", "_concat.txt").replace(".mp3", "_concat.txt")
        
        # 1. Create concat txt file for ffmpeg
        with open(concat_file, "w", encoding="utf-8") as f:
            for vp in voice_paths:
                f.write(f"file '{os.path.abspath(vp).replace(os.sep, '/')}'\n")
                
        # 2. Concat all voice tracks
        voice_only_path = output_path.replace(".wav", "_voice.wav").replace(".mp3", "_voice.wav")
        cmd_concat = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_file, "-c", "copy", voice_only_path
        ]
        logger.info(f"Running ffmpeg concat: {' '.join(cmd_concat)}")
        try:
            proc = await asyncio.to_thread(subprocess.run, cmd_concat, capture_output=True, timeout=60)
            if proc.returncode != 0:
                raise AudioMixerError(f"Failed to concat voice tracks: {proc.stderr.decode()}")
        except Exception as e:
            logger.error(f"FFmpeg concat failed: {e}")
            raise AudioMixerError(str(e))
            
        # 3. If BGM provided, mix them
        if bgm_path and os.path.exists(bgm_path):
            cmd_mix = [
                "ffmpeg", "-y",
                "-i", voice_only_path,
                "-stream_loop", "-1", "-i", bgm_path,
                "-filter_complex", "[1:a]volume=-10dB[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2",
                "-c:a", "aac", "-b:a", "192k",
                output_path
            ]
            proc = await asyncio.to_thread(subprocess.run, cmd_mix, capture_output=True, timeout=60)
            if proc.returncode != 0:
                raise AudioMixerError(f"Failed to mix BGM: {proc.stderr.decode()}")
        else:
            # Just copy the voice_only to output
            import shutil
            shutil.copy(voice_only_path, output_path)
            
        return output_path

    async def overlay_sfx(self, base_audio_path: str, overlays: List['SfxOverlay'], output_path: str) -> str:
        """Overlay SFX files onto base audio at specific timestamps using ffmpeg."""
        if not overlays:
            import shutil
            shutil.copy(base_audio_path, output_path)
            return output_path

        # Build ffmpeg filter_complex for all SFX overlays
        inputs = ["-i", base_audio_path]
        filter_parts = []
        current_label = "[0:a]"
        valid_count = 0

        for i, sfx in enumerate(overlays):
            if not os.path.exists(sfx.path):
                logger.warning(f"SFX file not found: {sfx.path}, skipping")
                continue
            inputs.extend(["-i", sfx.path])
            valid_count += 1
            input_idx = valid_count
            delay_ms = int((sfx.timestamp_sec + sfx.offset_sec) * 1000)
            vol = sfx.volume
            sfx_label = f"[sfx{i}]"
            mix_label = f"[mix{i}]"
            filter_parts.append(f"[{input_idx}:a]volume={vol},adelay={delay_ms}|{delay_ms}{sfx_label}")
            filter_parts.append(f"{current_label}{sfx_label}amix=inputs=2:duration=first:dropout_transition=0.05{mix_label}")
            current_label = mix_label

        if not filter_parts:
            import shutil
            shutil.copy(base_audio_path, output_path)
            return output_path

        filter_complex = ";".join(filter_parts)
        cmd = [
            "ffmpeg", "-y",
            *inputs,
            "-filter_complex", filter_complex,
            "-map", current_label,
            "-c:a", "aac", "-b:a", "192k",
            output_path,
        ]

        logger.info(f"Overlaying {len(overlays)} SFX onto audio")
        proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, timeout=60)
        if proc.returncode != 0:
            raise AudioMixerError(f"SFX overlay failed: {proc.stderr.decode()}")

        return output_path


@dataclass
class SfxOverlay:
    """Single SFX overlay to mix into the audio track."""
    path: str            # absolute path to SFX mp3 file
    timestamp_sec: float  # position in the mixed audio
    volume: float = 0.35
    offset_sec: float = 0.0  # delay from scene start
