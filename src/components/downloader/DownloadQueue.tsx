import type { DownloadItem } from '../../hooks/useDownloader';

interface DownloadQueueProps {
  queue: DownloadItem[];
  onCancel: (id: number) => void;
}

export function DownloadQueue({ queue, onCancel }: DownloadQueueProps) {
  if (queue.length === 0) return null;

  return (
    <div className="dl-queue">
      <div className="dl-queue-header">
        <span className="dl-queue-title">Active Downloads</span>
        <span className="dl-queue-count">{queue.length}</span>
      </div>
      <div className="dl-queue-list">
        {queue.map(item => (
          <div className="dl-queue-item" key={item.id}>
            <div className="dl-qi-platform">
              {getPlatformIcon(item.platform)}
            </div>
            <div className="dl-qi-info">
              <div className="dl-qi-title">{item.title || item.url}</div>
              <div className="dl-qi-progress-row">
                <div className="dl-qi-progress-bar">
                  <div 
                    className="dl-qi-progress-fill"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="dl-qi-pct">{Math.round(item.progress)}%</span>
                {item.speed && <span className="dl-qi-speed">{item.speed}</span>}
              </div>
            </div>
            <div className="dl-qi-actions">
              {item.status === 'downloading' && (
                <button className="dl-qi-cancel" onClick={() => onCancel(item.id)} title="Cancel">
                  ✕
                </button>
              )}
              {item.status === 'error' && (
                <span className="dl-qi-error-badge">Error</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    youtube: '🔴', tiktok: '🎵', douyin: '🎶',
    facebook: '🔵', instagram: '📸', twitter: '🐦',
  };
  return icons[platform] || '🌐';
}
