import { useState, useEffect } from 'react';
import type { DownloadItem } from '../../hooks/useDownloader';

interface DownloadHistoryProps {
  history: DownloadItem[];
  onFetch: (limit?: number, offset?: number, platform?: string) => void;
  onDelete: (id: number) => void;
  connected?: boolean;
}

const PLATFORMS = ['all', 'youtube', 'tiktok', 'douyin', 'facebook', 'instagram'];

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getPlatformIcon(p: string): string {
  const icons: Record<string, string> = {
    youtube: '🔴', tiktok: '🎵', douyin: '🎶',
    facebook: '🔵', instagram: '📸', twitter: '🐦',
  };
  return icons[p] || '🌐';
}

function getStatusClass(status: string): string {
  if (status === 'completed') return 'st-done';
  if (status === 'error') return 'st-err';
  if (status === 'cancelled') return 'st-cancel';
  if (status === 'downloading') return 'st-dl';
  return 'st-pending';
}

export function DownloadHistory({ history, onFetch, onDelete, connected = true }: DownloadHistoryProps) {
  const [activePlatform, setActivePlatform] = useState('all');

  useEffect(() => {
    if (connected) {
      onFetch(50, 0, activePlatform);
    }
  }, [activePlatform, connected]);

  return (
    <div className="dl-history">
      <div className="dl-hist-header">
        <span className="dl-hist-title">Recent Extractions</span>
        <div className="dl-hist-filters">
          {PLATFORMS.map(p => (
            <button
              key={p}
              className={`dl-hf ${activePlatform === p ? 'active' : ''}`}
              onClick={() => setActivePlatform(p)}
            >
              {p === 'all' ? 'All' : getPlatformIcon(p)}
            </button>
          ))}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="dl-hist-empty">
          <span>No downloads yet</span>
        </div>
      ) : (
        <div className="dl-hist-table">
          <div className="dl-ht-head">
            <span className="dl-htc media">MEDIA</span>
            <span className="dl-htc platform">PLATFORM</span>
            <span className="dl-htc quality">QUALITY</span>
            <span className="dl-htc size">SIZE</span>
            <span className="dl-htc status">STATUS</span>
            <span className="dl-htc actions">ACTIONS</span>
          </div>
          <div className="dl-ht-body">
            {history.map(item => (
              <div className="dl-ht-row" key={item.id}>
                <div className="dl-htc media">
                  <div className="dl-ht-thumb">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" />
                    ) : (
                      <span>{getPlatformIcon(item.platform)}</span>
                    )}
                  </div>
                  <span className="dl-ht-title">{item.title || 'Untitled'}</span>
                </div>
                <div className="dl-htc platform">
                  <span>{getPlatformIcon(item.platform)} {item.platform}</span>
                </div>
                <div className="dl-htc quality">
                  <span>{item.resolution || '—'}</span>
                </div>
                <div className="dl-htc size">
                  <span>{formatBytes(item.file_size)}</span>
                </div>
                <div className="dl-htc status">
                  <span className={`dl-st-badge ${getStatusClass(item.status)}`}>
                    {item.status === 'completed' ? '● Done' : item.status}
                  </span>
                </div>
                <div className="dl-htc actions">
                  <button
                    className="dl-ht-del"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
