import { useState, useMemo, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useDownloader, type VideoInfo, VideoFormat, DownloadItem } from '../../hooks/useDownloader';
import { sidecar } from '../../lib/sidecar';

function getThumbnailSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (/^[A-Za-z]:[\\\/]/.test(t) || t.startsWith('/')) return convertFileSrc(t);
  if (t.startsWith('http')) return `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(t)}`;
  return t;
}

interface DownloadOptionsProps {
  videoInfo: VideoInfo;
  history: DownloadItem[];
  onDownload: (url: string, format_id: string, overwrites: boolean, mediaType: 'video' | 'audio') => void;
}

// ... helper functions (formatBytes, formatDuration, etc.) ...

export function DownloadOptions({ videoInfo, onDownload }: DownloadOptionsProps) {
  const { checkFileExistence } = useDownloader();
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [fileExistsOnDisk, setFileExistsOnDisk] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormatId, setPendingFormatId] = useState<string | null>(null);

  // Smart Filesystem Check
  useEffect(() => {
    const checkFile = async () => {
      const exists = await checkFileExistence(
        videoInfo.title,
        videoInfo.platform,
        videoInfo.video_id
      );
      setFileExistsOnDisk(exists);
    };
    checkFile();
  }, [videoInfo, checkFileExistence]);

  const { videoFormats, audioFormats } = useMemo(() => {
    const vf: VideoFormat[] = [];
    const af: VideoFormat[] = [];
    
    for (const f of videoInfo.formats) {
      // Normalize null/undefined resolution to empty string
      const res = f.resolution ?? '';
      if (res === 'audio only') {
        af.push(f);
      } else {
        vf.push(f);
      }
    }

    vf.sort((a, b) => {
      const getHeight = (r: string | null | undefined) => parseInt(String(r ?? '0').replace(/[^0-9]/g, '')) || 0;
      return getHeight(b.resolution) - getHeight(a.resolution);
    });

    return { videoFormats: vf, audioFormats: af };
  }, [videoInfo.formats]);

  const formats = activeTab === 'video' ? videoFormats : audioFormats;

  const handleDownloadClick = (e: React.MouseEvent, format_id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Chỉ kích hoạt Modal nếu thực sự có file trên đĩa (Tránh cảnh báo vô lý khi đã xóa file)
    if (fileExistsOnDisk) {
      setPendingFormatId(format_id);
      setShowConfirm(true);
    } else {
      // Nếu không có file (ngay cả khi có trong history), cứ cho tải về ngay
      onDownload(videoInfo.webpage_url || '', format_id, false, activeTab);
    }
  };


  const handleConfirm = () => {
    if (pendingFormatId) {
      onDownload(videoInfo.webpage_url || '', pendingFormatId, true, activeTab);
    }
    setShowConfirm(false);
    setPendingFormatId(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingFormatId(null);
  };

  return (
    <div className="dl-options-grid">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="dl-modal-overlay" onClick={handleCancel}>
          <div className="dl-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-icon">📂</div>
            <div className="dl-modal-text">
              <h2>Video Đã Tồn Tại</h2>
              <p>
                Video <strong>"{videoInfo.title}"</strong> đã có sẵn trong máy hoặc lịch sử. 
                Bạn có muốn tải lại và ghi đè không?
              </p>
            </div>
            <div className="dl-modal-actions">
              <button className="dl-modal-btn secondary" onClick={handleCancel}>Hủy</button>
              <button className="dl-modal-btn primary" onClick={handleConfirm}>Tải Lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Info Card */}
      <div className="dl-info-card">
        {/* ... thumbnail and info meta ... */}
        <div className="dl-thumbnail">
          {videoInfo.thumbnail ? (
            <img 
              src={getThumbnailSrc(videoInfo.thumbnail) || ''} 
              alt={videoInfo.title} 
              onError={(e) => { 
                (e.target as HTMLImageElement).style.display = 'none'; 
                e.currentTarget.parentElement!.querySelector('.dl-thumb-placeholder')?.removeAttribute('style');
              }} 
            />
          ) : null}
          <div className="dl-thumb-placeholder" style={videoInfo.thumbnail ? { display: 'none' } : undefined}>
            <span>{getPlatformIcon(videoInfo.platform)}</span>
          </div>
          {videoInfo.duration > 0 && (
            <span className="dl-duration-badge">{formatDuration(videoInfo.duration)}</span>
          )}
        </div>
        <div className="dl-info-meta">
          <h3 className="dl-info-title" title={videoInfo.title}>{videoInfo.title}</h3>
          <div className="dl-info-details">
            <span className="dl-uploader">
              {getPlatformIcon(videoInfo.platform)} {videoInfo.uploader || 'Unknown Uploader'}
            </span>
            <span className="dl-dot">•</span>
            <span className="dl-platform-badge">{videoInfo.platform}</span>
          </div>
        </div>
      </div>

      {/* Formats Card */}
      <div className="dl-formats-card">
        <div className="dl-format-header">
          <h3>Download Options</h3>
          <div className="dl-format-tabs">
            <button
              className={`dl-ftab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              Video
            </button>
            <button
              className={`dl-ftab ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
            >
              Audio
            </button>
          </div>
        </div>

        <div className="dl-format-list">
          {formats.length === 0 ? (
            <div className="dl-no-formats">No {activeTab} formats available</div>
          ) : (
            formats.map((f, i) => {
              const badge = getResolutionBadge(f.resolution);
              return (
                <div className="dl-format-row" key={`${f.format_id}-${i}`}>
                  <div className="dl-fr-icon">
                    {activeTab === 'video' ? '🎬' : '🎵'}
                  </div>
                  <div className="dl-fr-main">
                    <div className="dl-fr-top">
                      <span className="dl-fr-title">
                        {(f.ext || 'mp4').toUpperCase()} {f.resolution === 'audio only' ? '' : (f.resolution || '')}
                      </span>
                      {badge.label && (
                        <span className={`dl-fr-badge ${badge.class}`}>{badge.label}</span>
                      )}
                      {i === 0 && <span className="dl-fr-best">★</span>}
                    </div>
                    <div className="dl-fr-sub">
                      {f.vcodec !== 'none' ? f.vcodec : f.acodec} • {f.format_note && `${f.format_note} • `} 
                      {formatBytes(f.filesize)}
                    </div>
                  </div>
                  <div className="dl-fr-actions">
                    {(() => {
                      const isOverwrite = fileExistsOnDisk;
                      return (
                        <button
                          className={`dl-fr-download-btn ${isOverwrite ? 'exists' : ''}`}
                          onClick={(e) => handleDownloadClick(e, f.format_id)}
                          title={isOverwrite ? 'Video đã có sẵn trong folder. Nhấn để tải lại (Ghi đè).' : 'Tải video về máy'}
                        >
                          {isOverwrite ? 'Tải lại' : 'Tải về'}
                        </button>
                      );
                    })()}
                  </div>

                </div>

              );
            })
          )}
        </div>
      </div>
    </div>
  );
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

function getResolutionBadge(resolution: string | null | undefined): { label: string; class: string } {
  const r = resolution || '';
  if (r.includes('2160') || r.includes('4K')) return { label: '4K', class: 'badge-4k' };
  if (r.includes('1440')) return { label: '2K', class: 'badge-2k' };
  if (r.includes('1080')) return { label: 'FHD', class: 'badge-fhd' };
  if (r.includes('720')) return { label: 'HD', class: 'badge-hd' };
  if (r.includes('480')) return { label: 'SD', class: 'badge-sd' };
  return { label: r || 'Unknown', class: '' };
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

