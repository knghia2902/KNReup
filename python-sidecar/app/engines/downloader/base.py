"""
Abstract base class for download engines.
All downloaders (yt-dlp, f2) implement this interface.
"""
from abc import ABC, abstractmethod
from typing import Callable, Optional


class DownloadError(Exception):
    """Base download error."""
    pass


class BaseDownloader(ABC):
    """Abstract base for download engines.

    Subclasses must implement:
    - analyze(url) → metadata dict with formats
    - download(url, format_id, output_dir, progress_callback) → file path
    """

    engine_name: str = "unknown"

    @abstractmethod
    async def analyze(self, url: str) -> dict:
        """Analyze URL and return video metadata + available formats.
        
        Returns:
            {
                "title": str,
                "uploader": str,
                "duration": int (seconds),
                "thumbnail": str (URL),
                "platform": str,
                "formats": [
                    {
                        "format_id": str,
                        "ext": str,
                        "resolution": str,
                        "filesize": int | None,
                        "vcodec": str,
                        "acodec": str,
                        "format_note": str,
                    }
                ]
            }
        """
        ...

    @abstractmethod
    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
    ) -> str:
        """Download video and return file path.
        
        Args:
            url: Video URL
            format_id: Selected format ID
            output_dir: Output directory
            progress_callback: async callback(progress_dict) where progress_dict contains:
                - status: 'downloading' | 'completed' | 'error'
                - downloaded_bytes: int
                - total_bytes: int
                - speed: str
                - filename: str
                - progress: float (0-100)
        
        Returns:
            Path to downloaded file
        """
        ...

    async def health_check(self) -> bool:
        """Check if engine is available."""
        return True
