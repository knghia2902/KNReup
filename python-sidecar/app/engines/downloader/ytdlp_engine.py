"""
yt-dlp download engine — supports YouTube, TikTok, Facebook, Instagram, etc.
Wraps yt-dlp in async via asyncio.to_thread().
"""
import asyncio
import os
import logging
from typing import Callable, Optional
from urllib.parse import urlparse

from .base import BaseDownloader, DownloadError

logger = logging.getLogger(__name__)


class YtdlpDownloader(BaseDownloader):
    """Download engine using yt-dlp for multi-platform video download."""

    engine_name = "yt-dlp"

    def _detect_platform(self, url: str) -> str:
        """Detect platform from URL domain."""
        try:
            domain = urlparse(url).netloc.lower()
            if 'youtube.com' in domain or 'youtu.be' in domain:
                return 'youtube'
            elif 'tiktok.com' in domain:
                return 'tiktok'
            elif 'facebook.com' in domain or 'fb.watch' in domain:
                return 'facebook'
            elif 'instagram.com' in domain:
                return 'instagram'
            elif 'twitter.com' in domain or 'x.com' in domain:
                return 'twitter'
            elif 'bilibili.com' in domain:
                return 'bilibili'
            else:
                return 'unknown'
        except Exception:
            return 'unknown'

    async def analyze(self, url: str) -> dict:
        """Analyze URL with yt-dlp — extract metadata and available formats."""
        try:
            import yt_dlp
        except ImportError:
            raise DownloadError("yt-dlp is not installed. Run: pip install yt-dlp")

        def _extract():
            ydl_opts = {
                'skip_download': True,
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
                'extract_flat': 'in_playlist',
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info is None:
                    raise DownloadError(f"Cannot extract info from: {url}")
                
                formats = []
                for f in info.get('formats', []):
                    # Only include formats with video or audio codec
                    if f.get('vcodec') == 'none' and f.get('acodec') == 'none':
                        continue
                    formats.append({
                        'format_id': f.get('format_id', ''),
                        'ext': f.get('ext', 'mp4'),
                        'resolution': f.get('resolution', 'audio only'),
                        'filesize': f.get('filesize') or f.get('filesize_approx'),
                        'vcodec': f.get('vcodec', 'none'),
                        'acodec': f.get('acodec', 'none'),
                        'format_note': f.get('format_note', ''),
                        'fps': f.get('fps'),
                        'tbr': f.get('tbr'),
                    })
                
                return {
                    'title': info.get('title', 'Unknown'),
                    'uploader': info.get('uploader', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'thumbnail': info.get('thumbnail', ''),
                    'platform': self._detect_platform(url),
                    'video_id': info.get('id', ''),
                    'description': info.get('description', ''),
                    'upload_date': info.get('upload_date', ''),
                    'view_count': info.get('view_count', 0),
                    'formats': formats,
                    'webpage_url': info.get('webpage_url', url),
                }

        return await asyncio.to_thread(_extract)

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
        overwrites: bool = False,
    ) -> str:

        """Download video using yt-dlp with progress hooks."""
        try:
            import yt_dlp
        except ImportError:
            raise DownloadError("yt-dlp is not installed. Run: pip install yt-dlp")

        os.makedirs(output_dir, exist_ok=True)
        result_path = None
        loop = asyncio.get_event_loop()

        import time
        last_update_time = 0

        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

        def strip_ansi(s):
            return ansi_escape.sub('', s) if s else ''

        def _progress_hook(d):
            nonlocal result_path, last_update_time
            if d.get('status') == 'finished':
                result_path = d.get('filename', '')
            
            # Throttle updates to ~5Hz
            current_time = time.time()
            if d.get('status') != 'finished' and current_time - last_update_time < 0.2:
                return
            last_update_time = current_time

            if progress_callback:
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                progress = (downloaded / total * 100) if total > 0 else 0
                
                progress_data = {
                    'status': d.get('status', 'downloading'),
                    'downloaded_bytes': downloaded,
                    'total_bytes': total,
                    'speed': strip_ansi(d.get('_speed_str', '')),
                    'filename': d.get('filename', ''),
                    'progress': round(progress, 1),
                    'eta': strip_ansi(d.get('_eta_str', '')),
                }
                # Schedule callback on the event loop
                # Ensure we create the coroutine object ONLY if the loop is still running
                if not loop.is_closed():
                    try:
                        asyncio.run_coroutine_threadsafe(
                            progress_callback(progress_data), loop
                        )
                    except Exception as e:
                        logger.warning(f"Failed to post progress: {e}")

        def _download():
            # Find ffmpeg
            import shutil
            ffmpeg_path = shutil.which('ffmpeg')
            logger.info(f"YtdlpDownloader: ffmpeg found at: {ffmpeg_path}")

            # Robust format selection:
            # Default for auto-best
            final_format = 'bestvideo[ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            
            if format_id:
                # If format_id is provided, we check if it is already a combined format.
                # Use /best as fallback to ensure we get a working file even if merge fails.
                final_format = f"{format_id}+bestaudio[ext=m4a]/bestaudio/best"
                logger.info(f"YtdlpDownloader: Requested format_id={format_id}, final_format={final_format}")
                
            ydl_opts = {
                'format': final_format,
                'outtmpl': os.path.join(output_dir, '%(title)s [%(id)s].%(ext)s'),
                'progress_hooks': [_progress_hook],
                'quiet': False,
                'no_warnings': False,
                'merge_output_format': 'mp4',
                'logger': logger,
                'prefer_ffmpeg': True,
                'ffmpeg_location': ffmpeg_path,
                'socket_timeout': 30,
                'retries': 3,
                'nooverwrites': not overwrites,
            }




            
            logger.info(f"YtdlpDownloader: Starting download with opts: {ydl_opts}")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        try:
            await asyncio.to_thread(_download)
        except Exception as e:
            logger.error(f"YtdlpDownloader error: {str(e)}")
            raise DownloadError(f"yt-dlp download failed: {str(e)}")



        if result_path and os.path.exists(result_path):
            return result_path
        
        # Fallback: find the downloaded file specifically for this video_id
        try:
            import re
            # Extract 11-char YouTube ID or similar patterns
            id_match = re.search(r'(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|#|\?|$)', url)
            v_id = id_match.group(1) if id_match else None
            
            if not v_id:
                # Fallback to simple split if regex fails
                v_id = url.split('=')[-1].split('&')[0]
                
            video_id_to_match = f"[{v_id}]"
            logger.info(f"YtdlpDownloader: Fallback search for ID variant: {video_id_to_match}")

            if os.path.exists(output_dir):
                for f in os.listdir(output_dir):
                    if any(f.lower().endswith(ext) for ext in ('.mp4', '.webm', '.mkv', '.m4v', '.ts')):
                        if video_id_to_match in f:
                            target = os.path.join(output_dir, f)
                            logger.info(f"YtdlpDownloader: Found file via ID fallback: {target}")
                            return target
        except Exception as e:
            logger.error(f"YtdlpDownloader: Fallback search failed: {e}")
            pass
            
        raise DownloadError("Download failed or file not found after completion")

    async def health_check(self) -> bool:
        """Check if yt-dlp is available."""
        try:
            import yt_dlp
            return True
        except ImportError:
            return False
