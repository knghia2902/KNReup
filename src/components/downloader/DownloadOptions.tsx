import { useState, useMemo } from 'react';
import type { VideoInfo, VideoFormat } from '../../hooks/useDownloader';

interface DownloadOptionsProps {
  videoInfo: VideoInfo;
  onDownload: (url: string, format_id: string) => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getResolutionBadge(resolution: string): { label: string; class: string } {
  if (resolution.includes('2160') || resolution.includes('4K')) return { label: '4K', class: 'badge-4k' };
  if (resolution.includes('1440')) return { label: '2K', class: 'badge-2k' };
  if (resolution.includes('1080')) return { label: 'FHD', class: 'badge-fhd' };
  if (resolution.includes('720')) return { label: 'HD', class: 'badge-hd' };
  if (resolution.includes('480')) return { label: 'SD', class: 'badge-sd' };
  return { label: resolution, class: '' };
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    youtube: '🔴',
    tiktok: '🎵',
    douyin: '🎶',
    facebook: '🔵',
    instagram: '📸',
    twitter: '🐦',
    bilibili: '📺',
  };
  return icons[platform] || '🌐';
}

export function DownloadOptions({ videoInfo, onDownload }: DownloadOptionsProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const { videoFormats, audioFormats } = useMemo(() => {
    const vf: VideoFormat[] = [];
    const af: VideoFormat[] = [];
    
    for (const f of videoInfo.formats) {
      if (f.vcodec !== 'none' && f.resolution !== 'audio only') {
        vf.push(f);
      } else if (f.acodec !== 'none') {
        af.push(f);
      }
    }

    // Sort by resolution quality (descending)
    vf.sort((a, b) => {
      const getHeight = (r: string) => parseInt(r.replace(/[^0-9]/g, '')) || 0;
      return getHeight(b.resolution) - getHeight(a.resolution);
    });

    return { videoFormats: vf, audioFormats: af };
  }, [videoInfo.formats]);

  const formats = activeTab === 'video' ? videoFormats : audioFormats;

  return (
    <div className="dl-options">
      {/* Video Info Header */}
      <div className="dl-info-header">
        <div className="dl-thumbnail">
          {videoInfo.thumbnail ? (
            <img src={videoInfo.thumbnail} alt={videoInfo.title} />
          ) : (
            <div className="dl-thumb-placeholder">
              <span>{getPlatformIcon(videoInfo.platform)}</span>
            </div>
          )}
        </div>
        <div className="dl-info-meta">
          <h3 className="dl-info-title">{videoInfo.title}</h3>
          <div className="dl-info-details">
            <span className="dl-platform-badge">
              {getPlatformIcon(videoInfo.platform)} {videoInfo.platform}
            </span>
            <span className="dl-uploader">{videoInfo.uploader}</span>
            {videoInfo.duration > 0 && (
              <span className="dl-duration">{formatDuration(videoInfo.duration)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Format Tabs */}
      <div className="dl-format-tabs">
        <button
          className={`dl-ftab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          Video ({videoFormats.length})
        </button>
        <button
          className={`dl-ftab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio ({audioFormats.length})
        </button>
      </div>

      {/* Format List */}
      <div className="dl-format-list">
        {formats.length === 0 ? (
          <div className="dl-no-formats">No {activeTab} formats available</div>
        ) : (
          formats.map((f, i) => {
            const badge = getResolutionBadge(f.resolution);
            return (
              <div className="dl-format-card" key={f.format_id}>
                <div className="dl-fc-left">
                  <span className="dl-fc-ext">{f.ext.toUpperCase()}</span>
                  {badge.label && (
                    <span className={`dl-fc-res ${badge.class}`}>{badge.label}</span>
                  )}
                  {i === 0 && <span className="dl-fc-rec">★ Best</span>}
                </div>
                <div className="dl-fc-center">
                  <span className="dl-fc-codec">{f.vcodec !== 'none' ? f.vcodec : f.acodec}</span>
                  {f.format_note && <span className="dl-fc-note">{f.format_note}</span>}
                </div>
                <div className="dl-fc-right">
                  <span className="dl-fc-size">{formatBytes(f.filesize)}</span>
                  <button
                    className="dl-fc-dl-btn"
                    onClick={() => onDownload(videoInfo.video_id || '', f.format_id)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
