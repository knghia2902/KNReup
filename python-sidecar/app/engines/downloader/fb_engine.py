"""
Facebook video download engine — scrapes Facebook video pages
for direct mp4 stream URLs (hd_src / sd_src).
"""
import asyncio
import os
import re
import logging
from typing import Callable, Optional

from .base import BaseDownloader, DownloadError

logger = logging.getLogger(__name__)

FB_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


class FacebookEngine(BaseDownloader):
    """Facebook video downloader via page scraping."""

    engine_name = "facebook-native"

    # ── URL helpers ──────────────────────────────────────────────

    async def _expand_short_url(self, url: str) -> str:
        """Expand Facebook short/share links to canonical video URL.
        
        Handles: fb.watch, share/v/, share/r/ and other redirect patterns.
        Uses GET (not HEAD) since Facebook requires a full request for some redirects.
        """
        import httpx
        needs_expand = any(p in url.lower() for p in (
            "fb.watch", "/share/v/", "/share/r/", "l.facebook.com",
        ))
        if needs_expand:
            try:
                async with httpx.AsyncClient(
                    follow_redirects=True, timeout=15, headers=FB_HEADERS
                ) as client:
                    resp = await client.get(url)
                    final_url = str(resp.url)
                    logger.info(f"Facebook: Expanded {url} -> {final_url}")
                    return final_url
            except Exception as e:
                logger.warning(f"Facebook short URL expansion failed: {e}")
        return url

    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract Facebook video ID from URL patterns."""
        patterns = [
            r"/videos/(\d+)",
            r"/video/(\d+)",
            r"/watch/?\?v=(\d+)",
            r"story_fbid=(\d+)",
            r"/reel/(\d+)",
            r"v=(\d+)",
        ]
        for pat in patterns:
            m = re.search(pat, url)
            if m:
                return m.group(1)
        return None

    # ── Scraper ──────────────────────────────────────────────────

    async def _scrape_video_urls(self, url: str) -> dict:
        """Scrape Facebook page for video stream URLs.
        
        Looks for hd_src, sd_src, and various JSON patterns in page source.
        """
        import httpx

        async with httpx.AsyncClient(
            timeout=30, follow_redirects=True, headers=FB_HEADERS
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise DownloadError(f"Facebook returned HTTP {resp.status_code}")

            html = resp.text

        # Try multiple extraction patterns
        video_urls = {}

        # Pattern 1: hd_src and sd_src in page source
        hd_match = re.search(r'"hd_src"\s*:\s*"([^"]+)"', html)
        sd_match = re.search(r'"sd_src"\s*:\s*"([^"]+)"', html)
        
        if hd_match:
            video_urls["hd"] = hd_match.group(1).replace("\\", "")
        if sd_match:
            video_urls["sd"] = sd_match.group(1).replace("\\", "")

        # Pattern 2: hd_src_no_ratelimit / sd_src_no_ratelimit
        hd_nr = re.search(r'"hd_src_no_ratelimit"\s*:\s*"([^"]+)"', html)
        sd_nr = re.search(r'"sd_src_no_ratelimit"\s*:\s*"([^"]+)"', html)
        if hd_nr:
            video_urls["hd"] = hd_nr.group(1).replace("\\", "")
        if sd_nr:
            video_urls["sd"] = sd_nr.group(1).replace("\\", "")

        # Pattern 3: playable_url / playable_url_quality_hd (GraphQL)
        playable_hd = re.search(r'"playable_url_quality_hd"\s*:\s*"([^"]+)"', html)
        playable_sd = re.search(r'"playable_url"\s*:\s*"([^"]+)"', html)
        if playable_hd:
            video_urls["hd"] = playable_hd.group(1).replace("\\/", "/").replace("\\u0025", "%")
        if playable_sd and "sd" not in video_urls:
            video_urls["sd"] = playable_sd.group(1).replace("\\/", "/").replace("\\u0025", "%")

        # Pattern 4: browser_native_hd_url / browser_native_sd_url
        native_hd = re.search(r'"browser_native_hd_url"\s*:\s*"([^"]+)"', html)
        native_sd = re.search(r'"browser_native_sd_url"\s*:\s*"([^"]+)"', html)
        if native_hd:
            video_urls["hd"] = native_hd.group(1).replace("\\/", "/").replace("\\u0025", "%")
        if native_sd and "sd" not in video_urls:
            video_urls["sd"] = native_sd.group(1).replace("\\/", "/").replace("\\u0025", "%")

        # Extract title
        title = "Facebook Video"
        title_match = re.search(r'<title[^>]*>(.+?)</title>', html, re.DOTALL)
        if title_match:
            raw = title_match.group(1).strip()
            # Remove common suffixes
            for suffix in (" | Facebook", " - Facebook", " | Watch"):
                if raw.endswith(suffix):
                    raw = raw[: -len(suffix)]
            title = raw or title

        # Extract thumbnail
        og_image = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        thumbnail = og_image.group(1) if og_image else ""

        return {
            "video_urls": video_urls,
            "title": title,
            "thumbnail": thumbnail,
        }

    # ── BaseDownloader interface ─────────────────────────────────

    async def analyze(self, url: str) -> dict:
        """Analyze Facebook URL — extract video metadata and stream URLs."""
        try:
            url = await self._expand_short_url(url)
            video_id = self._extract_video_id(url) or "unknown"

            logger.info(f"Facebook: Analyzing video (ID: {video_id})")

            scraped = await self._scrape_video_urls(url)
            video_urls = scraped["video_urls"]

            if not video_urls:
                raise DownloadError(
                    "Không tìm thấy link video Facebook. "
                    "Video có thể bị private hoặc yêu cầu đăng nhập."
                )

            formats = []
            if "hd" in video_urls:
                formats.append({
                    "format_id": "hd",
                    "ext": "mp4",
                    "resolution": "HD (720p+)",
                    "filesize": None,
                    "vcodec": "h264",
                    "acodec": "aac",
                    "format_note": "HD quality",
                    "_url": video_urls["hd"],
                })
            if "sd" in video_urls:
                formats.append({
                    "format_id": "sd",
                    "ext": "mp4",
                    "resolution": "SD (360p)",
                    "filesize": None,
                    "vcodec": "h264",
                    "acodec": "aac",
                    "format_note": "SD quality",
                    "_url": video_urls["sd"],
                })

            return {
                "title": scraped["title"],
                "uploader": "Facebook User",
                "duration": 0,
                "thumbnail": scraped["thumbnail"],
                "platform": "facebook",
                "video_id": video_id,
                "webpage_url": url,
                "_video_urls": video_urls,
                "formats": formats,
            }

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Facebook analyze failed: {e}")
            raise DownloadError(f"Facebook analysis failed: {str(e)}")

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
        overwrites: bool = False,
    ) -> str:
        """Download Facebook video."""
        import httpx

        os.makedirs(output_dir, exist_ok=True)

        try:
            info = await self.analyze(url)
            video_urls = info.get("_video_urls", {})
            title = info.get("title", "facebook_video")
            video_id = info.get("video_id", "unknown")

            # Pick the best available quality
            download_url = video_urls.get("hd") or video_urls.get("sd")
            if not download_url:
                raise DownloadError("No downloadable stream found for Facebook video.")

            safe_title = "".join(
                c for c in title if c.isalnum() or c in (" ", "-", "_")
            ).strip()
            if not safe_title:
                safe_title = f"facebook_{video_id}"
            if len(safe_title) > 100:
                safe_title = safe_title[:100]

            output_path = os.path.join(output_dir, f"{safe_title} [{video_id}].mp4")

            if not overwrites and os.path.exists(output_path):
                logger.info(f"Facebook: File exists, skipping: {output_path}")
                if progress_callback:
                    await progress_callback(
                        {"status": "completed", "progress": 100, "filename": output_path}
                    )
                return output_path

            if progress_callback:
                await progress_callback(
                    {"status": "downloading", "progress": 5, "speed": "Connecting..."}
                )

            # Stream download
            async with httpx.AsyncClient(
                timeout=120, follow_redirects=True, headers=FB_HEADERS
            ) as client:
                async with client.stream("GET", download_url) as resp:
                    if resp.status_code != 200:
                        raise DownloadError(
                            f"Facebook CDN returned HTTP {resp.status_code}"
                        )

                    total = int(resp.headers.get("content-length", 0))
                    downloaded = 0

                    with open(output_path, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=65536):
                            f.write(chunk)
                            downloaded += len(chunk)

                            if progress_callback and total > 0:
                                pct = min(round(downloaded / total * 95, 1), 95)
                                await progress_callback(
                                    {
                                        "status": "downloading",
                                        "progress": pct,
                                        "downloaded_bytes": downloaded,
                                        "total_bytes": total,
                                    }
                                )

            if progress_callback:
                await progress_callback(
                    {"status": "completed", "progress": 100, "filename": output_path}
                )

            logger.info(f"Facebook download complete: {output_path}")
            return output_path

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Facebook download failed: {e}")
            raise DownloadError(f"Facebook download failed: {str(e)}")

    async def health_check(self) -> bool:
        """Facebook engine only needs httpx."""
        try:
            import httpx
            return True
        except ImportError:
            return False
