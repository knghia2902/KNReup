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
                }

        return await asyncio.to_thread(_extract)

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
    ) -> str:
        """Download video using yt-dlp with progress hooks."""
        try:
            import yt_dlp
        except ImportError:
            raise DownloadError("yt-dlp is not installed. Run: pip install yt-dlp")

        os.makedirs(output_dir, exist_ok=True)
        result_path = None
        loop = asyncio.get_event_loop()

        def _progress_hook(d):
            nonlocal result_path
            if d.get('status') == 'finished':
                result_path = d.get('filename', '')
            
            if progress_callback:
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                progress = (downloaded / total * 100) if total > 0 else 0
                
                progress_data = {
                    'status': d.get('status', 'downloading'),
                    'downloaded_bytes': downloaded,
                    'total_bytes': total,
                    'speed': d.get('_speed_str', ''),
                    'filename': d.get('filename', ''),
                    'progress': round(progress, 1),
                    'eta': d.get('_eta_str', ''),
                }
                # Schedule callback on the event loop
                asyncio.run_coroutine_threadsafe(
                    progress_callback(progress_data), loop
                )

        def _download():
            ydl_opts = {
                'format': format_id if format_id else 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
                'progress_hooks': [_progress_hook],
                'quiet': True,
                'no_warnings': True,
                'merge_output_format': 'mp4',
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        try:
            await asyncio.to_thread(_download)
        except Exception as e:
            raise DownloadError(f"yt-dlp download failed: {str(e)}")

        if result_path and os.path.exists(result_path):
            return result_path
        
        # Fallback: find the downloaded file
        for f in os.listdir(output_dir):
            full = os.path.join(output_dir, f)
            if os.path.isfile(full) and f.endswith(('.mp4', '.webm', '.mkv')):
                return full
        
        raise DownloadError("Download completed but file not found")

    async def health_check(self) -> bool:
        """Check if yt-dlp is available."""
        try:
            import yt_dlp
            return True
        except ImportError:
            return False
