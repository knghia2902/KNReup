import React, { useRef, useState } from 'react';
import { useVoiceStudioStore, HistoryItem } from '../../../stores/useVoiceStudioStore';
import { sidecar } from '../../../lib/sidecar';
import { Play, Pause, Trash, Sparkle, DownloadSimple } from '@phosphor-icons/react';

export function HistoryPanel() {
  const { history, deleteHistory } = useVoiceStudioStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // We use a single audio element approach to avoid rendering 100 audio elements.
  // Actually, refs mapped by id is fine if list is small, but a unified approach is cleaner.
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handleDelete = (id: string) => {
    deleteHistory(sidecar.getBaseUrl(), id);
  };

  const togglePlay = (id: string, audioUrl: string) => {
    const el = audioRefs.current[id];
    if (!el) return;

    if (playingId === id) {
      el.pause();
      setPlayingId(null);
    } else {
      // Pause current if any
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]?.pause();
      }
      
      el.src = audioUrl;
      el.load();
      el.play().then(() => {
        setPlayingId(id);
      }).catch(err => {
        console.error('Play error', err);
        setPlayingId(null);
      });
    }
  };

  const downloadAudio = async (item: HistoryItem) => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      
      const audioUrl = `${sidecar.getBaseUrl()}/api/voice-studio/history/${item.id}/audio`;
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error('Download failed from sidecar');
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const savePath = await save({
        title: "Lưu File Audio",
        defaultPath: item.filename,
        filters: [{ name: 'Audio', extensions: ['wav', 'mp3'] }]
      });
      
      if (savePath) {
        await writeFile(savePath, new Uint8Array(arrayBuffer));
      }
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  return (
    <div className="vc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 className="vc-card-title" style={{ marginBottom: '8px' }}>
        Lịch sử & Hồ sơ
        <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--vc-slate)', fontWeight: 500 }}>
          {history.length} mục
        </span>
      </h2>

      {history.length === 0 ? (
        <div className="vc-empty-placeholder" style={{ flex: 1, border: 'none', background: 'transparent' }}>
          <Sparkle size={40} weight="duotone" className="vc-ep-icon" />
          <p style={{ margin: 0 }}>Chưa có nội dung nào trong lịch sử.</p>
        </div>
      ) : (
        <div className="vc-profile-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
          {history.map(item => {
            const audioUrl = `${sidecar.getBaseUrl()}/api/voice-studio/history/${item.id}/audio`;
            
            return (
              <div key={item.id} className="vc-profile-item">
                <div className="vc-profile-info">
                  <div className="vc-profile-title" title={item.filename}>{item.filename}</div>
                  <div className="vc-profile-meta">
                    {new Date(item.created_at).toLocaleString()} · {item.engine}
                  </div>
                </div>
                <div className="vc-profile-actions">
                  <button 
                    className="vc-icon-btn"
                    onClick={() => togglePlay(item.id, audioUrl)}
                  >
                    {playingId === item.id ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
                  </button>
                  <button 
                    className="vc-icon-btn"
                    onClick={() => downloadAudio(item)}
                  >
                    <DownloadSimple size={16} weight="fill" />
                  </button>
                  <button 
                    className="vc-icon-btn danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash size={16} weight="fill" />
                  </button>
                  <audio 
                    ref={el => { audioRefs.current[item.id] = el; }}
                    onEnded={() => setPlayingId(null)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
