import { convertFileSrc } from '@tauri-apps/api/core';
import { sidecar } from '../lib/sidecar';

/**
 * Chuyển đổi đường dẫn file/URL sang URL có thể sử dụng được bởi video/audio tag.
 * Hỗ trợ:
 * - Local paths (qua sidecar proxy ĐỂ HỖ TRỢ WAVESURFER FETCH / CORS)
 * - Remote URLs (qua sidecar proxy để tránh CORS và mixed content)
 */
export function getMediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  const decodedUrl = cleanUrl.includes('%') ? decodeURIComponent(cleanUrl) : cleanUrl;
  // const isRemote = decodedUrl.startsWith('http') || decodedUrl.startsWith('https');

  // Luôn đi qua proxy của sidecar để đảm bảo ổn định cho WaveSurfer (Fetch) và CORS.
  // Nếu là remote URL hoặc local path đều dùng proxy.
  return `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(decodedUrl)}`;
}

/**
 * Chỉ dùng cho video tag thuần túy (không qua fetch).
 * Tauri asset protocol nhanh hơn nhưng không hỗ trợ fetch() từ cross-origin dễ dàng.
 */
export function getVideoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const decodedUrl = cleanUrl.includes('%') ? decodeURIComponent(cleanUrl) : cleanUrl;
  const isRemote = decodedUrl.startsWith('http') || decodedUrl.startsWith('https');

  if (isRemote) {
    return `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(decodedUrl)}`;
  }

  return convertFileSrc(cleanUrl);
}
