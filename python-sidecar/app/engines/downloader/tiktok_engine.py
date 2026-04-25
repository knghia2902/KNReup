"""
TikTok no-watermark download engine.
Uses reverse-engineered TikTok Web API for direct CDN access,
bypassing yt-dlp watermark issues.
"""
import asyncio
import os
import re
import logging
from typing import Callable, Optional

from .base import BaseDownloader, DownloadError

logger = logging.getLogger(__name__)

# Mobile API endpoint for TikTok video details
TIKTOK_API_URL = "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/"

# Common headers mimicking TikTok mobile app
TIKTOK_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.tiktok.com/",
}

# URL patterns that indicate a TikTok link
TIKTOK_SHORT_DOMAINS = ("vt.tiktok.com", "vm.tiktok.com")


class TikTokEngine(BaseDownloader):
    """No-watermark TikTok downloader using Web/Mobile API."""

    engine_name = "tiktok-native"

    # ── URL helpers ──────────────────────────────────────────────

    async def _expand_short_url(self, url: str) -> str:
        """Follow redirects on short TikTok URLs to get the canonical URL."""
        import httpx
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=15, headers=TIKTOK_HEADERS
            ) as client:
                resp = await client.head(url)
                return str(resp.url)
        except Exception as e:
            logger.warning(f"TikTok short URL expansion failed: {e}")
            return url

    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract TikTok video ID from a canonical URL."""
        # Pattern: /video/1234567890 or /photo/1234567890
        m = re.search(r"/(?:video|photo)/(\d+)", url)
        if m:
            return m.group(1)
        # Fallback: aweme_id query param
        m = re.search(r"[?&]aweme_id=(\d+)", url)
        if m:
            return m.group(1)
        return None

    # ── API fetcher ──────────────────────────────────────────────

    async def _fetch_video_detail(self, video_id: str) -> dict:
        """Fetch video metadata from TikTok API."""
        import httpx

        # Try multiple API endpoints in case one is blocked
        api_urls = [
            f"https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}",
            f"https://api22-normal-c-useast2a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}",
            f"https://api19-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}",
        ]

        last_error = None
        for api_url in api_urls:
            try:
                async with httpx.AsyncClient(
                    timeout=20, headers=TIKTOK_HEADERS
                ) as client:
                    resp = await client.get(api_url)
                    if resp.status_code != 200:
                        last_error = f"HTTP {resp.status_code}"
                        continue

                    data = resp.json()
                    aweme_list = data.get("aweme_list", [])
                    if not aweme_list:
                        last_error = "Empty aweme_list in API response"
                        continue

                    # Find the exact video by ID
                    for aweme in aweme_list:
                        if str(aweme.get("aweme_id")) == str(video_id):
                            return aweme

                    # Fallback: use first item (API sometimes returns the target first)
                    return aweme_list[0]

            except Exception as e:
                last_error = str(e)
                logger.debug(f"TikTok API {api_url} failed: {e}")
                continue

        raise DownloadError(
            f"Không thể lấy thông tin video TikTok (ID: {video_id}). "
            f"Lỗi cuối: {last_error}"
        )

    def _parse_video_urls(self, aweme: dict) -> dict:
        """Extract download URLs and metadata from aweme detail."""
        video = aweme.get("video", {})
        author = aweme.get("author", {})

        # No-watermark URL: play_addr > download_addr > play_addr_lowbr
        play_addr = video.get("play_addr", {})
        download_addr = video.get("download_addr", {})

        # play_addr usually contains no-watermark stream
        url_list = play_addr.get("url_list", [])
        if not url_list:
            url_list = download_addr.get("url_list", [])

        download_url = url_list[-1] if url_list else None

        # Cover image
        cover = video.get("cover", {})
        cover_url = ""
        if cover:
            cover_urls = cover.get("url_list", [])
            cover_url = cover_urls[0] if cover_urls else ""

        # Duration in seconds (API returns milliseconds)
        duration = video.get("duration", 0)
        if duration > 1000:
            duration = duration // 1000

        return {
            "download_url": download_url,
            "title": aweme.get("desc", "TikTok Video"),
            "author": author.get("nickname", "Unknown"),
            "author_id": author.get("unique_id", ""),
            "cover": cover_url,
            "duration": duration,
            "width": video.get("width", 0),
            "height": video.get("height", 0),
            "aweme_id": str(aweme.get("aweme_id", "")),
        }

    # ── BaseDownloader interface ─────────────────────────────────

    async def analyze(self, url: str) -> dict:
        """Analyze TikTok URL — extract video metadata."""
        try:
            # Expand short URLs
            for domain in TIKTOK_SHORT_DOMAINS:
                if domain in url.lower():
                    url = await self._expand_short_url(url)
                    break

            video_id = self._extract_video_id(url)
            if not video_id:
                raise DownloadError(
                    "Không thể trích xuất video ID từ link TikTok. "
                    "Vui lòng dán link video hợp lệ."
                )

            logger.info(f"TikTok: Extracted video ID: {video_id}")

            aweme = await self._fetch_video_detail(video_id)
            parsed = self._parse_video_urls(aweme)

            if not parsed["download_url"]:
                raise DownloadError(
                    f"Không tìm thấy link tải video TikTok (ID: {video_id}). "
                    "Video có thể bị private hoặc đã bị xóa."
                )

            resolution = "unknown"
            w, h = parsed.get("width", 0), parsed.get("height", 0)
            if h >= 1080:
                resolution = "1080p"
            elif h >= 720:
                resolution = "720p"
            elif h >= 480:
                resolution = "480p"
            elif h > 0:
                resolution = f"{h}p"

            return {
                "title": parsed["title"],
                "uploader": parsed["author"],
                "duration": parsed["duration"],
                "thumbnail": parsed["cover"],
                "platform": "tiktok",
                "video_id": parsed["aweme_id"],
                "webpage_url": url,
                "_download_url": parsed["download_url"],  # internal use for download()
                "formats": [
                    {
                        "format_id": "no-watermark",
                        "ext": "mp4",
                        "resolution": resolution,
                        "filesize": None,
                        "vcodec": "h264",
                        "acodec": "aac",
                        "format_note": "No watermark (API direct)",
                    }
                ],
            }

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"TikTok analyze failed: {e}")
            raise DownloadError(f"TikTok analysis failed: {str(e)}")

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
        overwrites: bool = False,
    ) -> str:
        """Download TikTok video without watermark."""
        import httpx

        os.makedirs(output_dir, exist_ok=True)

        try:
            # Analyze to get the direct download URL
            info = await self.analyze(url)
            download_url = info.get("_download_url")
            if not download_url:
                raise DownloadError("No download URL found after analysis.")

            title = info.get("title", "tiktok_video")
            video_id = info.get("video_id", "unknown")

            # Sanitize filename
            safe_title = "".join(
                c for c in title if c.isalnum() or c in (" ", "-", "_")
            ).strip()
            if not safe_title:
                safe_title = f"tiktok_{video_id}"
            # Truncate very long titles
            if len(safe_title) > 100:
                safe_title = safe_title[:100]

            output_path = os.path.join(output_dir, f"{safe_title} [{video_id}].mp4")

            # Skip if already exists
            if not overwrites and os.path.exists(output_path):
                logger.info(f"TikTok: File already exists, skipping: {output_path}")
                if progress_callback:
                    await progress_callback(
                        {"status": "completed", "progress": 100, "filename": output_path}
                    )
                return output_path

            # Progress: starting
            if progress_callback:
                await progress_callback(
                    {"status": "downloading", "progress": 5, "speed": "Connecting..."}
                )

            # Stream download
            async with httpx.AsyncClient(
                timeout=120, follow_redirects=True, headers=TIKTOK_HEADERS
            ) as client:
                async with client.stream("GET", download_url) as resp:
                    if resp.status_code != 200:
                        raise DownloadError(
                            f"TikTok CDN returned HTTP {resp.status_code}"
                        )

                    total = int(resp.headers.get("content-length", 0))
                    downloaded = 0

                    with open(output_path, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=65536):
                            f.write(chunk)
                            downloaded += len(chunk)

                            if progress_callback and total > 0:
                                pct = min(round(downloaded / total * 95, 1), 95)
                                speed = ""
                                await progress_callback(
                                    {
                                        "status": "downloading",
                                        "progress": pct,
                                        "speed": speed,
                                        "downloaded_bytes": downloaded,
                                        "total_bytes": total,
                                    }
                                )

            if progress_callback:
                await progress_callback(
                    {"status": "completed", "progress": 100, "filename": output_path}
                )

            logger.info(f"TikTok download complete: {output_path}")
            return output_path

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"TikTok download failed: {e}")
            raise DownloadError(f"TikTok download failed: {str(e)}")

    async def health_check(self) -> bool:
        """TikTok engine only needs httpx (always available via deps)."""
        try:
            import httpx
            return True
        except ImportError:
            return False
