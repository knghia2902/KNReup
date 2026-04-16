"""
f2 Douyin download engine — no-watermark Douyin video download.
Uses f2 library for Douyin API interaction and cookie management.
"""
import asyncio
import os
import logging
from typing import Callable, Optional

from .base import BaseDownloader, DownloadError

logger = logging.getLogger(__name__)

# f2 may not be installed
_f2_available = False
try:
    import f2
    _f2_available = True
except ImportError:
    logger.warning("f2 library not installed — Douyin download unavailable")


class DouyinDownloader(BaseDownloader):
    """Download engine using f2 for Douyin no-watermark downloads."""

    engine_name = "f2-douyin"

    def __init__(self):
        self._cookie: Optional[str] = None

    async def analyze(self, url: str) -> dict:
        """Analyze Douyin URL — extract video metadata."""
        if not _f2_available:
            raise DownloadError(
                "f2 library not installed. Run: pip install f2\n"
                "Then sync cookie with: POST /api/download/cookie/sync"
            )

        try:
            from f2.apps.douyin.handler import DouyinHandler
            from f2.apps.douyin.utils import AwemeIdFetcher

            # Extract aweme_id from URL
            aweme_id = await asyncio.to_thread(
                lambda: asyncio.run(AwemeIdFetcher.get_aweme_id(url))
            )
            
            if not aweme_id:
                raise DownloadError(f"Cannot extract Douyin video ID from: {url}")

            # Get video details via handler
            handler = DouyinHandler(cookie=self._cookie or "")
            detail = await asyncio.to_thread(
                lambda: asyncio.run(handler.fetch_one_video(aweme_id))
            )
            
            if not detail:
                raise DownloadError(f"Cannot fetch Douyin video details for ID: {aweme_id}")

            return {
                'title': getattr(detail, 'desc', 'Douyin Video'),
                'uploader': getattr(detail, 'nickname', 'Unknown'),
                'duration': getattr(detail, 'duration', 0),
                'thumbnail': getattr(detail, 'cover', ''),
                'platform': 'douyin',
                'video_id': aweme_id,
                'formats': [
                    {
                        'format_id': 'no-watermark',
                        'ext': 'mp4',
                        'resolution': '1080p',
                        'filesize': None,
                        'vcodec': 'h264',
                        'acodec': 'aac',
                        'format_note': 'No watermark (original quality)',
                    }
                ],
            }
        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Douyin analyze failed: {e}")
            raise DownloadError(f"Douyin analysis failed: {str(e)}")

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
    ) -> str:
        """Download Douyin video without watermark using f2."""
        if not _f2_available:
            raise DownloadError("f2 library not installed. Run: pip install f2")

        os.makedirs(output_dir, exist_ok=True)

        try:
            import httpx
            
            # First analyze to get download URL
            info = await self.analyze(url)
            title = info.get('title', 'douyin_video')
            
            # Sanitize filename
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
            if not safe_title:
                safe_title = f"douyin_{info.get('video_id', 'unknown')}"
            
            output_path = os.path.join(output_dir, f"{safe_title}.mp4")
            
            # Use f2 to download
            from f2.apps.douyin.handler import DouyinHandler
            handler = DouyinHandler(cookie=self._cookie or "")
            
            # Download via handler
            await asyncio.to_thread(
                lambda: asyncio.run(
                    handler.download_one_video(url, output_dir)
                )
            )
            
            # Find the downloaded file
            if os.path.exists(output_path):
                if progress_callback:
                    await progress_callback({
                        'status': 'completed',
                        'progress': 100,
                        'filename': output_path,
                    })
                return output_path
            
            # Fallback: look for any new mp4 in output_dir
            for f in sorted(os.listdir(output_dir), key=lambda x: os.path.getmtime(os.path.join(output_dir, x)), reverse=True):
                if f.endswith('.mp4'):
                    final_path = os.path.join(output_dir, f)
                    if progress_callback:
                        await progress_callback({
                            'status': 'completed',
                            'progress': 100,
                            'filename': final_path,
                        })
                    return final_path
            
            raise DownloadError("Download completed but file not found")
            
        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Douyin download failed: {e}")
            raise DownloadError(f"Douyin download failed: {str(e)}")

    async def sync_cookie(self, browser_name: str = "edge") -> dict:
        """Sync Douyin cookie from browser.
        
        Args:
            browser_name: 'edge', 'chrome', or 'firefox'
        
        Returns:
            {"success": bool, "message": str}
        """
        if not _f2_available:
            return {"success": False, "message": "f2 library not installed"}

        try:
            from f2.utils.utils import extract_cookie_from_browser

            cookie = await asyncio.to_thread(
                lambda: asyncio.run(
                    extract_cookie_from_browser(browser_name, "douyin.com")
                )
            )
            
            if cookie:
                self._cookie = cookie
                return {"success": True, "message": f"Cookie synced from {browser_name}"}
            else:
                return {"success": False, "message": f"No Douyin cookie found in {browser_name}"}
                
        except Exception as e:
            logger.error(f"Cookie sync failed: {e}")
            return {"success": False, "message": f"Cookie sync failed: {str(e)}"}

    async def check_cookie(self) -> dict:
        """Check if current cookie is valid.
        
        Returns:
            {"valid": bool, "message": str}
        """
        if not self._cookie:
            return {"valid": False, "message": "No cookie set — sync required"}

        try:
            # Try a simple API call to check cookie validity
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://www.douyin.com/",
                    headers={"Cookie": self._cookie},
                    follow_redirects=True,
                    timeout=10,
                )
                if resp.status_code == 200:
                    return {"valid": True, "message": "Cookie is valid"}
                else:
                    return {"valid": False, "message": f"Cookie expired (HTTP {resp.status_code})"}
        except Exception as e:
            return {"valid": False, "message": f"Cookie check failed: {str(e)}"}

    async def health_check(self) -> bool:
        """Check if f2 is available."""
        return _f2_available
