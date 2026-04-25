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
from .tiktok_engine import TikTokEngine
from .bilibili_engine import BilibiliEngine
from .fb_engine import FacebookEngine
import platform
import re
import subprocess
import ctypes
from .database import (
    add_download, update_download, get_download,
    list_downloads, delete_download, find_existing_download,
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
        self.tiktok = TikTokEngine()
        self.bilibili = BilibiliEngine()
        self.facebook = FacebookEngine()
        self._tasks: dict[int, asyncio.Task] = {}
        self._progress_callbacks: dict[int, list[Callable]] = {}

    def _detect_platform(self, url: str) -> str:
        """Detect platform from URL."""
        url_lower = url.lower()
        if 'douyin.com' in url_lower or 'iesdouyin.com' in url_lower:
            return 'douyin'
        if 'tiktok.com' in url_lower:
            return 'tiktok'
        if 'bilibili.com' in url_lower or 'b23.tv' in url_lower:
            return 'bilibili'
        if 'facebook.com' in url_lower or 'fb.watch' in url_lower or 'fb.com' in url_lower:
            return 'facebook'
        return self.ytdlp._detect_platform(url)

    def _get_engine(self, platform: str):
        """Get the native engine for a platform (or yt-dlp fallback)."""
        engines = {
            'douyin': self.douyin,
            'tiktok': self.tiktok,
            'bilibili': self.bilibili,
            'facebook': self.facebook,
        }
        return engines.get(platform, self.ytdlp)

    async def analyze(self, url: str) -> dict:
        """Analyze URL — detect platform and extract metadata + formats.
        
        Uses native engine first; falls back to yt-dlp if native fails.
        """
        platform = self._detect_platform(url)
        engine = self._get_engine(platform)
        
        try:
            result = await engine.analyze(url)
            result['platform'] = platform
            return result
        except Exception as native_err:
            # Hybrid fallback: if native engine fails, try yt-dlp
            if engine is not self.ytdlp:
                logger.warning(
                    f"Native {engine.engine_name} analyze failed for {url}: {native_err}. "
                    f"Falling back to yt-dlp."
                )
                try:
                    result = await self.ytdlp.analyze(url)
                    result['platform'] = platform
                    result['_fallback'] = True
                    return result
                except Exception as fallback_err:
                    logger.error(f"yt-dlp fallback also failed: {fallback_err}")
                    raise DownloadError(
                        f"Cả engine gốc ({engine.engine_name}) và yt-dlp đều thất bại. "
                        f"Lỗi gốc: {native_err} | Lỗi yt-dlp: {fallback_err}"
                    )
            logger.error(f"Analyze failed for {url}: {native_err}")
            raise DownloadError(f"Failed to analyze URL: {str(native_err)}")

    async def start_download(
        self,
        url: str,
        format_id: str = "",
        output_dir: str = "",
        overwrites: bool = False,
        project_id: Optional[str] = None,
        project_name: Optional[str] = None,
        media_type: str = "video",
    ) -> int:
        """Start a download — returns download_id."""
        logger.info(f"START_DOWNLOAD: url={url}, format_id={format_id}, media_type={media_type}, project_id={project_id}")
        
        # Analyze first if not already analyzed
        platform = self._detect_platform(url)
        logger.debug(f"Detected platform: {platform}")
        
        try:
            info = await self.analyze(url)
            logger.debug(f"Analysis successful: {info.get('title')}")
        except Exception as e:
            logger.warning(f"Analysis failed for {url}, using default info: {e}")
            info = {'title': '', 'uploader': '', 'duration': 0, 'thumbnail': '', 'video_id': ''}
        
        # Create or Update DB record to avoid duplicates
        try:
            video_id = info.get('video_id', '')
            existing = await find_existing_download(url=url, video_id=video_id, media_type=media_type)
            
            if existing:
                download_id = existing['id']
                logger.info(f"Found existing {media_type} download record: id={download_id}, moving to top.")
                # Update and bring to top by refreshing created_at
                update_fields = dict(
                    status='pending',
                    progress=0,
                    speed='',
                    file_size=0,
                    format_id=format_id,
                    resolution=format_id,
                    metadata=None,
                    created_at=datetime.utcnow().isoformat().replace('T', ' '), 
                    title=info.get('title', existing.get('title', 'Unknown')),
                    thumbnail_url=info.get('thumbnail', existing.get('thumbnail_url', '')),
                )
                if project_id:
                    update_fields['project_id'] = project_id
                await update_download(download_id, **update_fields)
            else:
                download_id = await add_download(
                    url=url,
                    platform=platform,
                    title=info.get('title', 'Unknown'),
                    uploader=info.get('uploader', ''),
                    duration=info.get('duration', 0),
                    thumbnail_url=info.get('thumbnail', ''),
                    video_id=video_id,
                    format_id=format_id,
                    resolution=format_id,
                    project_id=project_id,
                    media_type=media_type,
                )
                logger.info(f"Created new download record: id={download_id}")
        except Exception as e:
            logger.error(f"Failed to manage download record in DB: {e}")
            raise DownloadError(f"Database error: {str(e)}")
        
        # Cancel existing task for this ID if it's already running (e.g., re-download)
        if download_id in self._tasks:
            task = self._tasks[download_id]
            if not task.done():
                logger.info(f"Cancelling existing task for download {download_id}")
                task.cancel()
                try:
                    await asyncio.wait_for(task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass
        
        # Spawn worker
        task = asyncio.create_task(
            self._download_worker(download_id, url, platform, format_id, output_dir, overwrites, project_name, media_type)
        )
        self._tasks[download_id] = task
        
        return download_id

    @staticmethod
    def _slugify(name: str) -> str:
        """Sanitize project name into a safe folder name."""
        slug = re.sub(r'[^\w\s-]', '', name).strip()
        slug = re.sub(r'[\s_-]+', '_', slug)
        return slug[:80] or 'unnamed'

    async def _download_worker(
        self,
        download_id: int,
        url: str,
        platform: str,
        format_id: str,
        output_dir: str,
        overwrites: bool,
        project_name: Optional[str] = None,
        media_type: str = "video",
    ):

        """Background download worker with semaphore concurrency control."""
        async with self.semaphore:
            try:
                await update_download(download_id, status='downloading', progress=0)
                
                engine = self._get_engine(platform)
                
                if not output_dir:
                    media_sub = 'audio' if media_type == 'audio' else 'video'
                    if project_name:
                        output_dir = os.path.join(DEFAULT_OUTPUT_DIR, self._slugify(project_name), media_sub, platform)
                    else:
                        output_dir = os.path.join(DEFAULT_OUTPUT_DIR, 'global', media_sub, platform)
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

                try:
                    file_path = await engine.download(url, format_id, output_dir, progress_cb, overwrites=overwrites)
                except Exception as native_dl_err:
                    # Hybrid fallback: if native engine download fails, try yt-dlp
                    if engine is not self.ytdlp:
                        logger.warning(
                            f"Native {engine.engine_name} download failed: {native_dl_err}. "
                            f"Falling back to yt-dlp for download."
                        )
                        file_path = await self.ytdlp.download(url, format_id, output_dir, progress_cb, overwrites=overwrites)
                    else:
                        raise

                
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                logger.info(f"Download {download_id} worker finished. File: {file_path}, Size: {file_size}")
                
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
                                'file_size': file_size,
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
                    metadata={'error': error_msg},
                )
                # Notify error
                if download_id in self._progress_callbacks:
                    for cb in self._progress_callbacks[download_id]:
                        try:
                            await cb({
                                'download_id': download_id,
                                'status': 'error',
                                'error': error_msg,
                                'metadata': {'error': error_msg}
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
        project_id: Optional[str] = None,
    ) -> list[dict]:
        """Get download history with optional platform and project filter."""
        return await list_downloads(limit=limit, offset=offset, platform=platform, project_id=project_id)

    async def delete_download_record(self, download_id: int, delete_file: bool = False) -> bool:
        """Delete download record and optionally the file. Cancels any running task first."""
        # Ensure any task is stopped
        await self.cancel_download(download_id)
        
        if delete_file:
            record = await get_download(download_id)
            if record and record.get('file_path'):
                try:
                    os.remove(record['file_path'])
                except OSError:
                    pass
        
        return await delete_download(download_id)

    async def move_download(self, download_id: int, project_id: str, project_name: str = "") -> bool:
        """Update the project_id of a download and physically move the file."""
        record = await get_download(download_id)
        file_path = record.get('file_path') if record else None
        
        if file_path and os.path.exists(file_path):
            media_type = record.get('media_type', 'video')
            media_sub = 'audio' if media_type == 'audio' else 'video'
            platform = record.get('platform', 'unknown')
            
            if project_id and project_name:
                new_dir = os.path.join(DEFAULT_OUTPUT_DIR, self._slugify(project_name), media_sub, platform)
            else:
                new_dir = os.path.join(DEFAULT_OUTPUT_DIR, 'global', media_sub, platform)
                
            os.makedirs(new_dir, exist_ok=True)
            new_file_path = os.path.join(new_dir, os.path.basename(file_path))
            
            if new_file_path != file_path:
                try:
                    import shutil
                    shutil.move(file_path, new_file_path)
                    file_path = new_file_path
                    logger.info(f"Moved download {download_id} file to {new_file_path}")
                except Exception as e:
                    logger.error(f"Failed to move file to {new_file_path}: {e}")
                    
        await update_download(download_id, project_id=project_id, file_path=file_path)
        return True

    async def cancel_download(self, download_id: int) -> bool:
        """Cancel a running download and notify listeners — always updates DB to unstick UI."""
        task = self._tasks.get(download_id)
        if task and not task.done():
            logger.info(f"Cancelling active task for download {download_id}")
            task.cancel()
        
        # Always update DB to "cancelled" to allow user to unstick items
        await update_download(download_id, status='cancelled')
        
        # Notify SSE listeners immediately
        if download_id in self._progress_callbacks:
            for cb in self._progress_callbacks[download_id]:
                try:
                    await cb({
                        'download_id': download_id,
                        'status': 'cancelled',
                        'progress': 0,
                    })
                except Exception:
                    pass
        
        self._tasks.pop(download_id, None)
        return True


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

    async def set_douyin_cookie(self, cookie_string: str) -> dict:
        """Set Douyin cookie manually."""
        return await self.douyin.set_cookie(cookie_string)

    async def check_douyin_cookie(self) -> dict:
        """Check Douyin cookie validity."""
        return await self.douyin.check_cookie()

    async def check_file_existence(self, title: str, platform: str, video_id: str = "", download_id: int = 0) -> bool:
        """Check if a file exists on disk for a given video."""
        # 1. Fast Path: Check against DB file_path
        if download_id:
            record = await get_download(download_id)
            if record and record.get('file_path'):
                if os.path.exists(record['file_path']):
                    return True

        if not os.path.exists(DEFAULT_OUTPUT_DIR):
            return False

        # Normalize search terms
        def normalize(s: str) -> str:
            if not s: return ""
            # Remove common symbols and use lower case for fuzzy matching
            import re
            return re.sub(r'[^\w]', '', s).lower()

        norm_title = normalize(title)
        
        try:
            import glob
            # Recursive check for video files across all download folders (including projects)
            pattern = os.path.join(DEFAULT_OUTPUT_DIR, "**", "*.*")
            for f_path in glob.glob(pattern, recursive=True):
                if not f_path.lower().endswith(('.mp4', '.webm', '.mkv', '.m4v')):
                    continue
                    
                f = os.path.basename(f_path)
                
                # 1. Match by video_id (highest priority)
                if video_id and video_id in f:
                    return True
                
                # 2. Match by exact title substring
                if title and title in f:
                    return True
                
                # 3. Match by normalized title (handles | vs ｜, space vs _, etc)
                if norm_title:
                    norm_f = normalize(f)
                    if norm_title in norm_f:
                        return True
                        
        except Exception as e:
            logger.error(f"Error checking file existence: {e}")
                
        return False


    async def open_file(self, download_id: int) -> bool:
        """Open the downloaded file with system default player."""
        record = await get_download(download_id)
        if not record or not record.get('file_path'):
            logger.warning(f"Cannot open file: Record {download_id} has no file_path")
            return False
        
        path = record['file_path']
        if not os.path.exists(path):
            logger.warning(f"Cannot open file: Path does not exist: {path}")
            return False
            
        try:
            if platform.system() == 'Windows':
                os.startfile(path)
            elif platform.system() == 'Darwin':
                import subprocess
                subprocess.run(['open', path], check=True)
            else:
                import subprocess
                subprocess.run(['xdg-open', path], check=True)
            return True
        except Exception as e:
            logger.error(f"Failed to open file {path}: {e}")
            return False

    async def show_in_folder(self, download_id: int) -> bool:
        """Show the downloaded file in system file explorer."""
        record = await get_download(download_id)
        if not record or not record.get('file_path'):
            return False
            
        path = record['file_path']
        if not os.path.exists(path):
            return False
            
        try:
            if platform.system() == 'Windows':
                # os.path.normpath handles backslashes
                target = os.path.normpath(path)
                # explorer /select, "path"
                # SW_SHOWNORMAL = 1
                ctypes.windll.shell32.ShellExecuteW(None, "open", "explorer.exe", f'/select,"{target}"', None, 1)
            elif platform.system() == 'Darwin':
                subprocess.run(['open', '-R', path], check=True)
            else:
                subprocess.run(['xdg-open', os.path.dirname(path)], check=True)
            return True
        except Exception as e:
            logger.error(f"Failed to show folder for {path}: {e}")
            return False

# Singleton instance
_manager_instance: Optional[DownloadManager] = None


def get_download_manager() -> DownloadManager:
    """Get or create singleton DownloadManager."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = DownloadManager(max_concurrent=2)
    return _manager_instance
