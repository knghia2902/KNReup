"""
Bilibili download engine — extracts video/audio streams from Bilibili's public API.
Handles DASH (separate video + audio) and FLV streams.
"""
import asyncio
import os
import re
import logging
from typing import Callable, Optional

from .base import BaseDownloader, DownloadError

logger = logging.getLogger(__name__)

BILIBILI_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.bilibili.com/",
    "Accept": "application/json, text/plain, */*",
}

# Quality IDs → labels
QUALITY_MAP = {
    127: "8K",
    126: "Dolby Vision",
    125: "HDR",
    120: "4K",
    116: "1080P 60fps",
    112: "1080P+",
    80: "1080P",
    74: "720P 60fps",
    64: "720P",
    32: "480P",
    16: "360P",
}


class BilibiliEngine(BaseDownloader):
    """Bilibili video downloader using public Web API."""

    engine_name = "bilibili-native"

    # ── URL helpers ──────────────────────────────────────────────

    async def _expand_short_url(self, url: str) -> str:
        """Expand b23.tv short links."""
        import httpx
        if "b23.tv" in url.lower():
            try:
                async with httpx.AsyncClient(
                    follow_redirects=True, timeout=15, headers=BILIBILI_HEADERS
                ) as client:
                    resp = await client.head(url)
                    return str(resp.url)
            except Exception as e:
                logger.warning(f"Bilibili short URL expansion failed: {e}")
        return url

    def _extract_bvid(self, url: str) -> Optional[str]:
        """Extract BVid from Bilibili URL."""
        m = re.search(r"(BV[0-9A-Za-z]{10})", url)
        return m.group(1) if m else None

    def _extract_aid(self, url: str) -> Optional[str]:
        """Extract aid from av-style URLs."""
        m = re.search(r"av(\d+)", url, re.IGNORECASE)
        return m.group(1) if m else None

    def _extract_bangumi_ids(self, url: str) -> dict:
        """Extract season/episode IDs from bangumi URLs.
        
        Patterns: /bangumi/play/ss{id}, /bangumi/play/ep{id}
        """
        result = {}
        ss_match = re.search(r"/bangumi/play/ss(\d+)", url)
        ep_match = re.search(r"/bangumi/play/ep(\d+)", url)
        if ss_match:
            result["season_id"] = int(ss_match.group(1))
        if ep_match:
            result["ep_id"] = int(ep_match.group(1))
        return result

    # ── API calls ────────────────────────────────────────────────

    async def _fetch_video_info(self, bvid: str) -> dict:
        """Fetch video metadata from Bilibili Web API."""
        import httpx
        url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
        async with httpx.AsyncClient(timeout=20, headers=BILIBILI_HEADERS) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("code") != 0:
                raise DownloadError(
                    f"Bilibili API error: {data.get('message', 'Unknown error')}"
                )
            return data["data"]

    async def _fetch_play_url(self, bvid: str, cid: int) -> dict:
        """Fetch play URLs (DASH streams) from Bilibili."""
        import httpx
        url = (
            f"https://api.bilibili.com/x/player/playurl"
            f"?bvid={bvid}&cid={cid}&fnval=4048&fourk=1"
        )
        async with httpx.AsyncClient(timeout=20, headers=BILIBILI_HEADERS) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("code") != 0:
                raise DownloadError(
                    f"Bilibili playurl API error: {data.get('message', 'Unknown')}"
                )
            return data["data"]

    async def _fetch_bangumi_info(self, bangumi_ids: dict) -> dict:
        """Fetch bangumi season/episode info from pgc API."""
        import httpx

        if "ep_id" in bangumi_ids:
            api_url = f"https://api.bilibili.com/pgc/view/web/season?ep_id={bangumi_ids['ep_id']}"
        elif "season_id" in bangumi_ids:
            api_url = f"https://api.bilibili.com/pgc/view/web/season?season_id={bangumi_ids['season_id']}"
        else:
            raise DownloadError("Không có season_id hoặc ep_id trong URL bangumi.")

        async with httpx.AsyncClient(timeout=20, headers=BILIBILI_HEADERS) as client:
            resp = await client.get(api_url)
            data = resp.json()
            code = data.get("code", -1)
            if code != 0:
                raise DownloadError(
                    f"Bilibili bangumi API error (code {code}): "
                    f"{data.get('message', 'Unknown error')}"
                )
            return data.get("result", {})

    async def _analyze_bangumi(self, url: str, bangumi_ids: dict) -> dict:
        """Analyze a Bilibili bangumi (anime/drama) URL."""
        import httpx

        logger.info(f"Bilibili: Detected bangumi URL, ids={bangumi_ids}")

        season = await self._fetch_bangumi_info(bangumi_ids)
        episodes = season.get("episodes", [])

        if not episodes:
            raise DownloadError(
                "Không tìm thấy tập phim nào trong bangumi này. "
                "Nội dung có thể bị giới hạn vùng hoặc yêu cầu VIP."
            )

        # Pick target episode: if ep_id specified, find it; otherwise use first
        target_ep = episodes[0]
        if "ep_id" in bangumi_ids:
            for ep in episodes:
                if ep.get("id") == bangumi_ids["ep_id"]:
                    target_ep = ep
                    break

        ep_id = target_ep.get("id", 0)
        cid = target_ep.get("cid", 0)
        aid = target_ep.get("aid", 0)

        if not cid:
            raise DownloadError(f"Không tìm thấy cid cho tập phim ep_id={ep_id}")

        # Get play URLs using bangumi playurl API
        play_url_api = (
            f"https://api.bilibili.com/pgc/player/web/playurl"
            f"?ep_id={ep_id}&cid={cid}&fnval=4048&fourk=1"
        )

        async with httpx.AsyncClient(timeout=20, headers=BILIBILI_HEADERS) as client:
            resp = await client.get(play_url_api)
            data = resp.json()

        play_result = data.get("result", data.get("data", {}))

        # Build formats from DASH
        formats = []
        dash = play_result.get("dash", {})
        if dash:
            for v in dash.get("video", []):
                qn = v.get("id", 0)
                label = QUALITY_MAP.get(qn, f"{qn}")
                formats.append({
                    "format_id": f"dash-video-{qn}",
                    "ext": "mp4",
                    "resolution": label,
                    "filesize": None,
                    "vcodec": v.get("codecs", "unknown"),
                    "acodec": "none",
                    "format_note": f"DASH video {label}",
                    "_base_url": v.get("base_url") or v.get("baseUrl"),
                    "_backup_urls": v.get("backup_url", []) or v.get("backupUrl", []),
                })
            audio_streams = dash.get("audio", [])
            if audio_streams:
                best_audio = max(audio_streams, key=lambda a: a.get("bandwidth", 0))
                formats.append({
                    "format_id": "dash-audio-best",
                    "ext": "m4a",
                    "resolution": "audio",
                    "filesize": None,
                    "vcodec": "none",
                    "acodec": best_audio.get("codecs", "aac"),
                    "format_note": "DASH audio (best)",
                    "_base_url": best_audio.get("base_url") or best_audio.get("baseUrl"),
                    "_backup_urls": best_audio.get("backup_url", []) or best_audio.get("backupUrl", []),
                })

        ep_title = target_ep.get("share_copy") or target_ep.get("long_title") or target_ep.get("title", "")
        season_title = season.get("title", "Bilibili Bangumi")
        full_title = f"{season_title} - {ep_title}" if ep_title else season_title

        return {
            "title": full_title,
            "uploader": season.get("up_info", {}).get("uname", "Bilibili"),
            "duration": target_ep.get("duration", 0) // 1000 if target_ep.get("duration", 0) > 1000 else target_ep.get("duration", 0),
            "thumbnail": target_ep.get("cover", season.get("cover", "")),
            "platform": "bilibili",
            "video_id": f"ep{ep_id}",
            "webpage_url": url,
            "_cid": cid,
            "_dash": dash,
            "_play_data": play_result,
            "_is_bangumi": True,
            "_total_episodes": len(episodes),
            "formats": formats,
        }

    # ── BaseDownloader interface ─────────────────────────────────

    async def analyze(self, url: str) -> dict:
        """Analyze Bilibili URL — extract video metadata and DASH format list.
        
        Supports standard video URLs (BV/av) and bangumi URLs (ss/ep).
        """
        try:
            url = await self._expand_short_url(url)

            # Check if this is a bangumi URL
            bangumi = self._extract_bangumi_ids(url)
            if bangumi:
                return await self._analyze_bangumi(url, bangumi)

            bvid = self._extract_bvid(url)
            if not bvid:
                aid = self._extract_aid(url)
                if aid:
                    # Convert aid to bvid via API
                    import httpx
                    async with httpx.AsyncClient(
                        timeout=15, headers=BILIBILI_HEADERS
                    ) as client:
                        resp = await client.get(
                            f"https://api.bilibili.com/x/web-interface/view?aid={aid}"
                        )
                        data = resp.json()
                        if data.get("code") == 0:
                            bvid = data["data"].get("bvid")

            if not bvid:
                raise DownloadError(
                    "Không thể trích xuất BVid từ link Bilibili. "
                    "Hãy dán link video hợp lệ (e.g. bilibili.com/video/BVxxxxxx)."
                )

            logger.info(f"Bilibili: Extracted BVid: {bvid}")

            info = await self._fetch_video_info(bvid)
            cid = info.get("cid", 0)
            if not cid:
                pages = info.get("pages", [])
                if pages:
                    cid = pages[0].get("cid", 0)

            if not cid:
                raise DownloadError("Cannot determine cid for Bilibili video.")

            play_data = await self._fetch_play_url(bvid, cid)

            # Build format list from DASH streams
            formats = []
            dash = play_data.get("dash", {})
            if dash:
                for v in dash.get("video", []):
                    qn = v.get("id", 0)
                    label = QUALITY_MAP.get(qn, f"{qn}")
                    formats.append({
                        "format_id": f"dash-video-{qn}",
                        "ext": "mp4",
                        "resolution": label,
                        "filesize": None,
                        "vcodec": v.get("codecs", "unknown"),
                        "acodec": "none",
                        "format_note": f"DASH video {label}",
                        "_base_url": v.get("base_url") or (v.get("baseUrl")),
                        "_backup_urls": v.get("backup_url", []) or v.get("backupUrl", []),
                    })
                # Pick best audio
                audio_streams = dash.get("audio", [])
                if audio_streams:
                    best_audio = max(audio_streams, key=lambda a: a.get("bandwidth", 0))
                    formats.append({
                        "format_id": "dash-audio-best",
                        "ext": "m4a",
                        "resolution": "audio",
                        "filesize": None,
                        "vcodec": "none",
                        "acodec": best_audio.get("codecs", "aac"),
                        "format_note": "DASH audio (best)",
                        "_base_url": best_audio.get("base_url") or best_audio.get("baseUrl"),
                        "_backup_urls": best_audio.get("backup_url", []) or best_audio.get("backupUrl", []),
                    })

            # If no DASH, fallback to durl (FLV/MP4 combined)
            if not formats:
                for d in play_data.get("durl", []):
                    formats.append({
                        "format_id": "flv-combined",
                        "ext": "flv",
                        "resolution": QUALITY_MAP.get(play_data.get("quality", 0), "unknown"),
                        "filesize": d.get("size"),
                        "vcodec": "unknown",
                        "acodec": "unknown",
                        "format_note": "Combined stream",
                        "_base_url": d.get("url"),
                        "_backup_urls": d.get("backup_url", []),
                    })

            return {
                "title": info.get("title", "Bilibili Video"),
                "uploader": info.get("owner", {}).get("name", "Unknown"),
                "duration": info.get("duration", 0),
                "thumbnail": info.get("pic", ""),
                "platform": "bilibili",
                "video_id": bvid,
                "webpage_url": url,
                "_cid": cid,
                "_dash": dash,
                "_play_data": play_data,
                "formats": formats,
            }

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Bilibili analyze failed: {e}")
            raise DownloadError(f"Bilibili analysis failed: {str(e)}")

    async def download(
        self,
        url: str,
        format_id: str,
        output_dir: str,
        progress_callback: Optional[Callable] = None,
        overwrites: bool = False,
    ) -> str:
        """Download Bilibili video (DASH: video + audio → merge via ffmpeg)."""
        import httpx
        import shutil

        os.makedirs(output_dir, exist_ok=True)

        try:
            info = await self.analyze(url)
            title = info.get("title", "bilibili_video")
            bvid = info.get("video_id", "unknown")

            safe_title = "".join(
                c for c in title if c.isalnum() or c in (" ", "-", "_")
            ).strip()
            if not safe_title:
                safe_title = f"bilibili_{bvid}"
            if len(safe_title) > 100:
                safe_title = safe_title[:100]

            output_path = os.path.join(output_dir, f"{safe_title} [{bvid}].mp4")

            if not overwrites and os.path.exists(output_path):
                logger.info(f"Bilibili: File exists, skipping: {output_path}")
                if progress_callback:
                    await progress_callback(
                        {"status": "completed", "progress": 100, "filename": output_path}
                    )
                return output_path

            if progress_callback:
                await progress_callback(
                    {"status": "downloading", "progress": 5, "speed": "Fetching streams..."}
                )

            dash = info.get("_dash", {})

            if dash:
                # DASH mode: download video + audio separately, merge with ffmpeg
                video_streams = dash.get("video", [])
                audio_streams = dash.get("audio", [])

                if not video_streams:
                    raise DownloadError("No DASH video streams available.")

                # Pick highest bandwidth video (or match format_id)
                best_video = max(video_streams, key=lambda v: v.get("bandwidth", 0))
                video_url = best_video.get("base_url") or best_video.get("baseUrl")

                best_audio = None
                audio_url = None
                if audio_streams:
                    best_audio = max(audio_streams, key=lambda a: a.get("bandwidth", 0))
                    audio_url = best_audio.get("base_url") or best_audio.get("baseUrl")

                # Download video stream
                video_tmp = os.path.join(output_dir, f"_tmp_video_{bvid}.m4s")
                await self._stream_download(video_url, video_tmp, progress_callback, 10, 50)

                if audio_url:
                    # Download audio stream
                    audio_tmp = os.path.join(output_dir, f"_tmp_audio_{bvid}.m4s")
                    await self._stream_download(audio_url, audio_tmp, progress_callback, 50, 80)

                    # Merge with ffmpeg
                    if progress_callback:
                        await progress_callback(
                            {"status": "downloading", "progress": 85, "speed": "Merging..."}
                        )

                    ffmpeg_path = shutil.which("ffmpeg")
                    if not ffmpeg_path:
                        raise DownloadError("ffmpeg not found — required for Bilibili DASH merge.")

                    merge_cmd = [
                        ffmpeg_path, "-y",
                        "-i", video_tmp,
                        "-i", audio_tmp,
                        "-c", "copy",
                        "-movflags", "+faststart",
                        output_path,
                    ]

                    proc = await asyncio.create_subprocess_exec(
                        *merge_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    _, stderr = await proc.communicate()
                    if proc.returncode != 0:
                        logger.error(f"ffmpeg merge failed: {stderr.decode()}")
                        raise DownloadError("ffmpeg merge failed for Bilibili DASH streams.")

                    # Cleanup temp files
                    for tmp in (video_tmp, audio_tmp):
                        if os.path.exists(tmp):
                            os.remove(tmp)
                else:
                    # No audio — just rename video
                    os.rename(video_tmp, output_path)

            else:
                # FLV/combined mode — direct download
                play_data = info.get("_play_data", {})
                durls = play_data.get("durl", [])
                if not durls:
                    raise DownloadError("No download URLs found for Bilibili video.")
                stream_url = durls[0].get("url")
                await self._stream_download(stream_url, output_path, progress_callback, 10, 95)

            if progress_callback:
                await progress_callback(
                    {"status": "completed", "progress": 100, "filename": output_path}
                )

            logger.info(f"Bilibili download complete: {output_path}")
            return output_path

        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Bilibili download failed: {e}")
            raise DownloadError(f"Bilibili download failed: {str(e)}")

    async def _stream_download(
        self,
        url: str,
        dest: str,
        progress_callback: Optional[Callable],
        pct_start: int,
        pct_end: int,
    ):
        """Download a single stream with progress tracking."""
        import httpx

        async with httpx.AsyncClient(
            timeout=120, follow_redirects=True, headers=BILIBILI_HEADERS
        ) as client:
            async with client.stream("GET", url) as resp:
                if resp.status_code != 200:
                    raise DownloadError(f"Bilibili CDN returned HTTP {resp.status_code}")

                total = int(resp.headers.get("content-length", 0))
                downloaded = 0

                with open(dest, "wb") as f:
                    async for chunk in resp.aiter_bytes(chunk_size=65536):
                        f.write(chunk)
                        downloaded += len(chunk)

                        if progress_callback and total > 0:
                            frac = downloaded / total
                            pct = pct_start + frac * (pct_end - pct_start)
                            await progress_callback(
                                {
                                    "status": "downloading",
                                    "progress": round(pct, 1),
                                    "downloaded_bytes": downloaded,
                                    "total_bytes": total,
                                }
                            )

    async def health_check(self) -> bool:
        """Bilibili engine needs httpx (always available)."""
        try:
            import httpx
            return True
        except ImportError:
            return False
