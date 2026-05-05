import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { DownloadSimple, FolderOpen } from '@phosphor-icons/react';
import { open } from '@tauri-apps/plugin-shell';

export function LabVideoPreview() {
  const store = useVideoGenLabStore();
  const { videoUrl, videoMetadata } = store;

  if (!videoUrl) return null;

  const handleDownload = () => window.open(videoUrl, '_blank');

  const handleOpenFolder = async () => {
    try {
      const entry = store.history.find(h => h.session_id === store.sessionId);
      if (entry && entry.video_path) {
        await open(entry.video_path);
      } else {
        alert("Không tìm thấy đường dẫn file nội bộ.");
      }
    } catch (e) {
      console.error(e);
      alert("Không thể mở thư mục.");
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Video takes all available space */}
      <video
        src={videoUrl}
        controls
        autoPlay
        playsInline
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
      />
    </div>
  );
}

/** Separate export: action buttons to render OUTSIDE the phone frame */
export function LabVideoActions() {
  const store = useVideoGenLabStore();
  const { videoUrl, videoMetadata } = store;

  if (!videoUrl) return null;

  const handleDownload = () => window.open(videoUrl, '_blank');

  const handleOpenFolder = async () => {
    try {
      const entry = store.history.find(h => h.session_id === store.sessionId);
      if (entry && entry.video_path) {
        await open(entry.video_path);
      } else {
        alert("Không tìm thấy đường dẫn file nội bộ.");
      }
    } catch (e) {
      console.error(e);
      alert("Không thể mở thư mục.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', width: '100%', maxWidth: '380px' }}>
      {videoMetadata && (
        <div style={{ fontSize: '12px', color: 'var(--vgl-muted)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <span>{videoMetadata.resolution}</span>
          <span>|</span>
          <span>{(videoMetadata.size_bytes / 1024 / 1024).toFixed(1)}MB</span>
          <span>|</span>
          <span>{videoMetadata.duration}s</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDownload}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px',
            backgroundColor: 'var(--vgl-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
        >
          <DownloadSimple size={18} weight="bold" />
          Lưu
        </button>
        <button
          onClick={handleOpenFolder}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'var(--vgl-text)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        >
          <FolderOpen size={18} weight="duotone" />
          Thư mục
        </button>
      </div>
    </div>
  );
}
