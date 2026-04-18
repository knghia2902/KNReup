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
        self._cookie_file = os.path.abspath(os.path.join(
            os.path.dirname(__file__), '..', '..', '..', 'data', 'douyin_cookie.txt'
        ))
        self._cookie: Optional[str] = self._load_cookie()

    def _load_cookie(self) -> Optional[str]:
        """Load cookie from file."""
        if os.path.exists(self._cookie_file):
            try:
                with open(self._cookie_file, 'r', encoding='utf-8') as f:
                    cookie = f.read().strip()
                    if cookie:
                        logger.info(f"Loaded Douyin cookie from {self._cookie_file}")
                        return cookie
            except Exception as e:
                logger.error(f"Failed to load cookie: {e}")
        return None

    def _save_cookie(self, cookie: str):
        """Save cookie to file."""
        try:
            os.makedirs(os.path.dirname(self._cookie_file), exist_ok=True)
            with open(self._cookie_file, 'w', encoding='utf-8') as f:
                f.write(cookie)
            logger.info(f"Saved Douyin cookie to {self._cookie_file}")
        except Exception as e:
            logger.error(f"Failed to save cookie: {e}")

    async def analyze(self, url: str) -> dict:
        """Analyze Douyin URL — extract video metadata."""
        if not _f2_available:
            raise DownloadError(
                "f2 library not installed. Run: pip install f2\n"
                "Then sync cookie with: POST /api/download/cookie/sync"
            )

        try:
            import re
            
            # Custom Extraction Logic for various Douyin URL patterns
            aweme_id = None
            # 1. modal_id=XXXX (Highest priority for jingxuan/discover links)
            modal_match = re.search(r'modal_id=(\d+)', url)
            if modal_match:
                aweme_id = modal_match.group(1)
            
            # 2. Standard video/note links (video/XXXX or note/XXXX)
            if not aweme_id:
                id_match = re.search(r'(?:video|note|jingxuan)/(\d+)', url)
                if id_match:
                    aweme_id = id_match.group(1)
            
            # 3. group/XXXX (discover links)
            if not aweme_id:
                group_match = re.search(r'group/(\d+)', url)
                if group_match:
                    aweme_id = group_match.group(1)
            
            # Fallback to f2's AwemeIdFetcher (handles redirects from v.douyin.com)
            if not aweme_id:
                from f2.apps.douyin.utils import AwemeIdFetcher
                try:
                    aweme_id = await AwemeIdFetcher.get_aweme_id(url)
                except Exception as e:
                    logger.debug(f"f2 AwemeIdFetcher failed: {e}")
            
            if aweme_id:
                logger.info(f"Extracted Aweme ID: {aweme_id}")
            else:
                raise DownloadError(f"Không thể trích xuất ID video từ link Douyin. Hãy đảm bảo bạn dán đúng link video hoặc link 'jingxuan'.")

            from f2.apps.douyin.handler import DouyinHandler
            
            # Get video details via handler - f2 expects a dict for kwargs
            # Provide default headers with User-Agent and proxies to avoid | operator errors with None
            # Standard browser User-Agent is REQUIRED for signature (a_bogus) generation
            # Using Edge UA to match f2's default fingerprint settings
            handler_kwargs = {
                "cookie": self._cookie or "",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
                    "Referer": "https://www.douyin.com/"
                },
                "proxies": {"http://": None, "https://": None}
            }
            handler = DouyinHandler(handler_kwargs)
            handler.enable_bark = False
            detail = await handler.fetch_one_video(aweme_id)
            
            if not detail:
                raise DownloadError(f"Không thể lấy thông tin video Douyin (ID: {aweme_id}). Có thể do Cookie hết hạn.")

            return {
                'title': getattr(detail, 'desc', 'Douyin Video'),
                'uploader': getattr(detail, 'nickname', 'Unknown'),
                'duration': getattr(detail, 'duration', 0),
                'thumbnail': getattr(detail, 'cover', ''),
                'platform': 'douyin',
                'video_id': aweme_id,
                'webpage_url': url,
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
        overwrites: bool = False,
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

            # Check if exists and skip if not overwriting
            if not overwrites and os.path.exists(output_path):
                logger.info(f"DouyinDownloader: File already exists, skipping: {output_path}")
                if progress_callback:
                    await progress_callback({
                        'status': 'completed',
                        'progress': 100,
                        'filename': output_path,
                    })
                return output_path
            
            # Start progress
            if progress_callback:
                await progress_callback({
                    'status': 'downloading',
                    'progress': 5,
                    'speed': 'Analysing...'
                })

            # Use f2 to download
            from f2.apps.douyin.handler import DouyinHandler
            handler_kwargs = {
                "url": url,
                "path": output_dir,
                "cookie": self._cookie or "",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
                    "Referer": "https://www.douyin.com/"
                },
                "mode": "one",
                "proxies": {"http://": None, "https://": None}
            }
            
            if progress_callback:
                await progress_callback({
                    'status': 'downloading',
                    'progress': 15,
                    'speed': 'Downloading...'
                })

            handler = DouyinHandler(handler_kwargs)
            handler.enable_bark = False
            
            # Download via handler
            logger.info(f"DouyinDownloader: Starting f2 download for {url}")
            await handler.handle_one_video()
            logger.info(f"DouyinDownloader: f2 handler.handle_one_video() returned")

            # Find the downloaded file
            target_path = output_path
            downloaded_file = None

            # 1. Check direct path
            if os.path.exists(output_path):
                downloaded_file = output_path
                logger.info(f"DouyinDownloader: Found file at direct path: {output_path}")
            else:
                # 2. Look for any new mp4 in output_dir recursively (handles f2's date prefixes and folders)
                import glob
                import time
                
                # We look for files modified in the last 60 seconds
                now = time.time()
                mp4_files = glob.glob(os.path.join(output_dir, "**", "*.mp4"), recursive=True)
                
                # Filter files that match aspects of the title OR were just created
                candidates = []
                for f in mp4_files:
                    mtime = os.path.getmtime(f)
                    if now - mtime < 120: # 2 minutes window
                        candidates.append(f)
                
                if candidates:
                    # Prefer the best match or newest
                    downloaded_file = max(candidates, key=os.path.getmtime)
                    logger.info(f"DouyinDownloader: Found candidate file via glob: {downloaded_file}")

            if downloaded_file:
                # If it's in a subfolder or has a different name, move/rename it to target_path to flatten
                if os.path.abspath(downloaded_file) != os.path.abspath(target_path):
                    import shutil
                    logger.info(f"Flattening Douyin structure: Moving {downloaded_file} -> {target_path}")
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    # If target exists and we are here, we should probably overwrite it with the fresh download
                    if os.path.exists(target_path):
                        os.remove(target_path)
                    shutil.move(downloaded_file, target_path)
                    
                    # Cleanup empty parent folders up to output_dir
                    parent = os.path.dirname(downloaded_file)
                    while parent and parent != output_dir and parent.startswith(output_dir):
                        try:
                            if not os.listdir(parent):
                                os.rmdir(parent)
                                parent = os.path.dirname(parent)
                            else:
                                break
                        except:
                            break

                if progress_callback:
                    await progress_callback({
                        'status': 'completed',
                        'progress': 100,
                        'filename': target_path,
                    })
                return target_path
            
            logger.error(f"DouyinDownloader: Download finished but couldn't find file in {output_dir}")
            raise DownloadError("Tải về hoàn tất nhưng không tìm thấy file. Vui lòng kiểm tra lại thư mục Downloads.")
            
        except DownloadError:
            raise
        except Exception as e:
            logger.error(f"Douyin download failed: {e}")
            raise DownloadError(f"Douyin download failed: {str(e)}")

    async def sync_cookie(self, browser_name: str = "auto") -> dict:
        """Sync Douyin cookie from browser."""
        if not _f2_available:
            return {"success": False, "message": "f2 library not installed"}

        try:
            from f2.utils.utils import get_cookie_from_browser, split_dict_cookie
            import os
            
            # If the frontend sends 'auto', we try major browsers AND the app's own WebView2 data
            browsers_to_try = ["chrome", "edge", "firefox"] if browser_name == "auto" else [browser_name]
            
            error_details = []
            for b in browsers_to_try:
                try:
                    def _get_cookies():
                        import pythoncom
                        pythoncom.CoInitialize()
                        try:
                            return get_cookie_from_browser(b, "douyin.com")
                        finally:
                            pythoncom.CoUninitialize()

                    cookie_dict = await asyncio.to_thread(_get_cookies)
                    if cookie_dict:
                        self._cookie = split_dict_cookie(cookie_dict)
                        # Immediately check if it works
                        cr = await self.check_cookie()
                        if cr.get("valid"):
                            return {"success": True, "message": f"Liên kết thành công từ {b.capitalize()}"}
                except Exception as e:
                    error_details.append(f"{b}: {str(e)}")
                    logger.debug(f"Failed to extract cookie from {b}: {e}")

            # Fallback: Try to find Tauri's own WebView2 data if on Windows
            if browser_name == "auto" and os.name == 'nt':
                try:
                    import base64
                    import json
                    try:
                        import win32crypt
                    except ImportError:
                        win32crypt = None
                    try:
                        from Cryptodome.Cipher import AES
                    except ImportError:
                        try:
                            from Crypto.Cipher import AES
                        except ImportError:
                            AES = None

                    local_app_data = os.environ.get('LOCALAPPDATA', '')
                    tauri_base = os.path.join(local_app_data, "com.knreup.app", "EBWebView")
                    local_state_path = os.path.join(tauri_base, "Local State")
                    tauri_cookie_path = os.path.join(tauri_base, "Default", "Network", "Cookies")
                    if not os.path.exists(tauri_cookie_path):
                        tauri_cookie_path = os.path.join(tauri_base, "Default", "Cookies")
                    
                    if os.path.exists(local_state_path) and os.path.exists(tauri_cookie_path) and win32crypt and AES:
                        logger.info("Attempting to decrypt Tauri WebView2 session...")
                        # 1. Get Master Key
                        with open(local_state_path, 'r', encoding='utf-8') as f:
                            local_state = json.load(f)
                        encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])
                        master_key = win32crypt.CryptUnprotectData(encrypted_key[5:], None, None, None, 0)[1]

                        # 2. Extract Cookies
                        import sqlite3, shutil, tempfile
                        with tempfile.NamedTemporaryFile(delete=False) as tmp_file: tmp_path = tmp_file.name
                        shutil.copyfile(tauri_cookie_path, tmp_path)
                        
                        try:
                            conn = sqlite3.connect(tmp_path)
                            cursor = conn.cursor()
                            cursor.execute("SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%douyin.com%'")
                            
                            cookies_dict = {}
                            for name, encrypted_value in cursor.fetchall():
                                try:
                                    if encrypted_value[:3] == b'v10':
                                        nonce = encrypted_value[3:15]
                                        payload = encrypted_value[15:]
                                        cipher = AES.new(master_key, AES.MODE_GCM, nonce)
                                        decrypted_value = cipher.decrypt(payload)[:-16].decode('utf-8')
                                        cookies_dict[name] = decrypted_value
                                except: continue
                            
                            if 'sessionid' in cookies_dict:
                                logger.info("Successfully decrypted sessionid from WebView2")
                                # Construct cookie string
                                cookie_str = "; ".join([f"{k}={v}" for k, v in cookies_dict.items()])
                                result = await self.set_cookie(cookie_str)
                                if result.get('success'):
                                    return {"success": True, "message": "Liên kết thành công từ WebView2", "valid": True}
                        finally:
                            conn.close()
                            if os.path.exists(tmp_path): os.remove(tmp_path)
                except Exception as ex:
                    logger.debug(f"Tauri session extraction failed: {ex}")

            msg = "Không thể đồng bộ tự động. Vui lòng đăng nhập lại trong cửa sổ Login Douyin và nhấn Sync Session."
            if error_details:
                msg += f" (Chi tiết: {'; '.join(error_details[:2])})"
            
            return {"success": False, "message": msg}
                
        except Exception as e:
            logger.error(f"Cookie sync failed: {e}")
            return {"success": False, "message": f"Lỗi hệ thống: {str(e)}"}

    async def set_cookie(self, cookie_string: str) -> dict:
        """Set Douyin cookie manually."""
        if not cookie_string:
            return {"success": False, "message": "Cookie string cannot be empty"}
        
        self._cookie = cookie_string.strip()
        result = await self.check_cookie()
        if result.get("valid"):
            self._save_cookie(self._cookie)
            return {"success": True, "message": "Cookie đã được cập nhật và lưu lại"}
        else:
            return {"success": False, "message": f"Cookie không hợp lệ: {result.get('message')}"}

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
