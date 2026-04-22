/**
 * DownloaderWindow — Standalone Downloader entry point
 * Phase 09: Wraps existing Downloader module for popup window usage.
 */
import { useState, useCallback } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { DownloadSimple, Link, ArrowClockwise, Folder } from '@phosphor-icons/react';
import '../../styles/design-system.css';

interface DownloadItem {
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  title?: string;
  progress?: number;
  error?: string;
}

export function DownloaderWindow() {
  const { connected } = useSidecar();
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const handleDownload = useCallback(async () => {
    if (!url.trim()) return;
    const item: DownloadItem = { url: url.trim(), status: 'pending' };
    setDownloads((prev) => [item, ...prev]);
    setUrl('');

    // TODO: integrate with actual download sidecar API
    setDownloads((prev) =>
      prev.map((d) => (d.url === item.url ? { ...d, status: 'downloading', progress: 0 } : d))
    );
  }, [url]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary, #111)',
      color: 'var(--text-primary, #eee)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }} data-tauri-drag-region>
        <DownloadSimple size={20} weight="duotone" style={{ color: 'var(--accent, #7c6aef)' }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>KNReup Downloader</span>
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted, #888)',
          marginLeft: 8,
          padding: '2px 6px',
          background: 'var(--surface-hover, rgba(255,255,255,0.04))',
          borderRadius: 4,
        }}>
          {connected ? '● Connected' : '○ Offline'}
        </span>
      </div>

      {/* URL Input */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface, rgba(255,255,255,0.03))',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
          borderRadius: 8,
          padding: '8px 12px',
        }}>
          <Link size={14} weight="bold" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            placeholder="Dán link Douyin, TikTok, YouTube..."
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={!url.trim()}
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            background: url.trim() ? 'var(--accent, #7c6aef)' : 'var(--surface, #333)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: url.trim() ? 'pointer' : 'default',
            opacity: url.trim() ? 1 : 0.5,
          }}
        >
          Download
        </button>
      </div>

      {/* Downloads List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {downloads.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            color: 'var(--text-muted, #888)',
          }}>
            <DownloadSimple size={40} weight="duotone" />
            <p style={{ fontSize: 13, margin: 0 }}>Chưa có video nào. Dán link để bắt đầu tải.</p>
          </div>
        ) : (
          downloads.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title || item.url}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {item.status === 'pending' && '⏳ Đang chờ...'}
                  {item.status === 'downloading' && `⬇ Đang tải ${item.progress || 0}%`}
                  {item.status === 'completed' && '✅ Hoàn tất'}
                  {item.status === 'error' && `❌ ${item.error || 'Lỗi'}`}
                </span>
              </div>
              {item.status === 'error' && (
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <ArrowClockwise size={14} weight="bold" />
                </button>
              )}
              {item.status === 'completed' && (
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Folder size={14} weight="bold" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
