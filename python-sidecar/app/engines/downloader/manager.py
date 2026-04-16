"""
Download Queue Manager — orchestrates concurrent downloads.
Routes URLs to correct engine, manages queue via asyncio.Semaphore.
Singleton instance at module level.
"""
import asyncio
import os
import logging
from datetime import datetime
from typing import Optional, Callable

from .base import DownloadError
from .ytdlp_engine import YtdlpDownloader
from .douyin_engine import DouyinDownloader
from .database import (
    add_download, update_download, get_download,
    list_downloads, delete_download, check_url_exists,
)

logger = logging.getLogger(__name__)

# Default output directory
DEFAULT_OUTPUT_DIR = os.path.join(os.path.expanduser('~'), 'KNReup', 'Downloads')


class DownloadManager:
    """Manages download queue with concurrent execution."""

    def __init__(self, max_concurrent: int = 2):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.ytdlp = YtdlpDownloader()
        self.douyin = DouyinDownloader()
        self._tasks: dict[int, asyncio.Task] = {}
        self._progress_callbacks: dict[int, list[Callable]] = {}

    def _detect_platform(self, url: str) -> str:
        """Detect platform from URL."""
        url_lower = url.lower()
        if 'douyin.com' in url_lower or 'iesdouyin.com' in url_lower:
            return 'douyin'
        return self.ytdlp._detect_platform(url)

    def _get_engine(self, platform: str):
        """Get the appropriate engine for a platform."""
        if platform == 'douyin':
            return self.douyin
        return self.ytdlp

    async def analyze(self, url: str) -> dict:
        """Analyze URL — detect platform and extract metadata + formats."""
        platform = self._detect_platform(url)
        engine = self._get_engine(platform)
        
        try:
            result = await engine.analyze(url)
            result['platform'] = platform
            return result
        except Exception as e:
            logger.error(f"Analyze failed for {url}: {e}")
            raise DownloadError(f"Failed to analyze URL: {str(e)}")

    async def start_download(
        self,
        url: str,
        format_id: str = "",
        output_dir: str = "",
    ) -> int:
        """Start a download — returns download_id."""
        # Check dedup
        existing = await check_url_exists(url)
        if existing and existing.get('status') == 'completed':
            raise DownloadError(
                f"URL already downloaded: {existing.get('title', url)}"
            )
        
        # Analyze first if not already analyzed
        platform = self._detect_platform(url)
        
        try:
            info = await self.analyze(url)
        except Exception:
            info = {'title': '', 'uploader': '', 'duration': 0, 'thumbnail': '', 'video_id': ''}
        
        # Create DB record
        download_id = await add_download(
            url=url,
            platform=platform,
            title=info.get('title', 'Unknown'),
            uploader=info.get('uploader', ''),
            duration=info.get('duration', 0),
            thumbnail_url=info.get('thumbnail', ''),
            video_id=info.get('video_id', ''),
            format_id=format_id,
            resolution=format_id,
        )
        
        # Spawn worker
        task = asyncio.create_task(
            self._download_worker(download_id, url, platform, format_id, output_dir)
        )
        self._tasks[download_id] = task
        
        return download_id

    async def _download_worker(
        self,
        download_id: int,
        url: str,
        platform: str,
        format_id: str,
        output_dir: str,
    ):
        """Background download worker with semaphore concurrency control."""
        async with self.semaphore:
            try:
                await update_download(download_id, status='downloading', progress=0)
                
                engine = self._get_engine(platform)
                
                if not output_dir:
                    output_dir = os.path.join(DEFAULT_OUTPUT_DIR, platform)
                os.makedirs(output_dir, exist_ok=True)

                async def progress_cb(data):
                    """Update progress in DB and notify SSE listeners."""
                    progress = data.get('progress', 0)
                    speed = data.get('speed', '')
                    await update_download(
                        download_id,
                        progress=progress,
                        speed=speed,
                        status='downloading',
                    )
                    # Notify SSE listeners
                    if download_id in self._progress_callbacks:
                        for cb in self._progress_callbacks[download_id]:
                            try:
                                await cb({
                                    'download_id': download_id,
                                    'progress': progress,
                                    'speed': speed,
                                    'status': 'downloading',
                                })
                            except Exception:
                                pass

                file_path = await engine.download(url, format_id, output_dir, progress_cb)
                
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                
                await update_download(
                    download_id,
                    status='completed',
                    progress=100,
                    file_path=file_path,
                    file_size=file_size,
                    completed_at=datetime.now().isoformat(),
                )
                
                # Notify completion
                if download_id in self._progress_callbacks:
                    for cb in self._progress_callbacks[download_id]:
                        try:
                            await cb({
                                'download_id': download_id,
                                'progress': 100,
                                'status': 'completed',
                                'file_path': file_path,
                            })
                        except Exception:
                            pass

                logger.info(f"Download {download_id} completed: {file_path}")
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Download {download_id} failed: {error_msg}")
                await update_download(
                    download_id,
                    status='error',
                    error_message=error_msg,
                )
                # Notify error
                if download_id in self._progress_callbacks:
                    for cb in self._progress_callbacks[download_id]:
                        try:
                            await cb({
                                'download_id': download_id,
                                'status': 'error',
                                'error': error_msg,
                            })
                        except Exception:
                            pass
            finally:
                self._tasks.pop(download_id, None)
                self._progress_callbacks.pop(download_id, None)

    async def get_status(self, download_id: int) -> Optional[dict]:
        """Get download status from DB."""
        return await get_download(download_id)

    async def get_history(
        self,
        limit: int = 50,
        offset: int = 0,
        platform: Optional[str] = None,
    ) -> list[dict]:
        """Get download history with optional platform filter."""
        return await list_downloads(limit=limit, offset=offset, platform=platform)

    async def delete_download_record(self, download_id: int, delete_file: bool = False) -> bool:
        """Delete download record and optionally the file."""
        if delete_file:
            record = await get_download(download_id)
            if record and record.get('file_path'):
                try:
                    os.remove(record['file_path'])
                except OSError:
                    pass
        
        return await delete_download(download_id)

    async def cancel_download(self, download_id: int) -> bool:
        """Cancel a running download."""
        task = self._tasks.get(download_id)
        if task and not task.done():
            task.cancel()
            await update_download(download_id, status='cancelled')
            self._tasks.pop(download_id, None)
            return True
        return False

    def register_progress_callback(self, download_id: int, callback: Callable):
        """Register SSE progress callback for a download."""
        if download_id not in self._progress_callbacks:
            self._progress_callbacks[download_id] = []
        self._progress_callbacks[download_id].append(callback)

    def unregister_progress_callback(self, download_id: int, callback: Callable):
        """Unregister SSE progress callback."""
        if download_id in self._progress_callbacks:
            try:
                self._progress_callbacks[download_id].remove(callback)
            except ValueError:
                pass

    async def sync_douyin_cookie(self, browser: str = "edge") -> dict:
        """Sync Douyin cookie from browser."""
        return await self.douyin.sync_cookie(browser)

    async def check_douyin_cookie(self) -> dict:
        """Check Douyin cookie validity."""
        return await self.douyin.check_cookie()


# Singleton instance
_manager_instance: Optional[DownloadManager] = None


def get_download_manager() -> DownloadManager:
    """Get or create singleton DownloadManager."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = DownloadManager(max_concurrent=2)
    return _manager_instance
