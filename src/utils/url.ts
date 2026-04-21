import { convertFileSrc } from '@tauri-apps/api/core';
import { sidecar } from '../lib/sidecar';

/**
 * Chuyển đổi đường dẫn file/URL sang URL có thể sử dụng được bởi video/audio tag.
 * Hỗ trợ:
 * - Local paths (qua tauri asset protocol)
 * - Remote URLs (qua sidecar proxy để tránh CORS và mixed content)
 */
export function getMediaSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  const decodedUrl = cleanUrl.includes('%') ? decodeURIComponent(cleanUrl) : cleanUrl;
  const isRemote = decodedUrl.startsWith('http') || decodedUrl.startsWith('https');

  if (isRemote) {
    // Luôn đi qua proxy của sidecar để đảm bảo ổn định
    return `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(decodedUrl)}`;
  }

  // Local file
  return convertFileSrc(cleanUrl);
}
