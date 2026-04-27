import { Waveform, UploadSimple, MusicNotes, X, Plus } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';
import { getMediaSrc } from '../../utils/url';
import { useRef, useEffect, useState } from 'react';

/**
 * Built-in royalty-free audio samples.
 */
const AUDIO_SAMPLES = [
  {
    id: 'lofi-chill',
    name: 'Lofi Chill',
    genre: 'Lo-fi',
    duration: '2:30',
    bpm: 85,
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'cinematic-epic',
    name: 'Cinematic Epic',
    genre: 'Cinematic',
    duration: '3:15',
    bpm: 120,
    url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3',
  },
  {
    id: 'upbeat-pop',
    name: 'Upbeat Pop',
    genre: 'Pop',
    duration: '2:45',
    bpm: 128,
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_33e1e3b8e0.mp3',
  },
  {
    id: 'ambient-dream',
    name: 'Ambient Dream',
    genre: 'Ambient',
    duration: '4:00',
    bpm: 70,
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115fb86c5a.mp3',
  },
];

export function AudioLibrary() {
  const config = useProjectStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [importedFiles, setImportedFiles] = useState<string[]>([]);

  // Load imported file from config on mount
  useEffect(() => {
    if (config.audio_file && !AUDIO_SAMPLES.some(s => s.url === config.audio_file) && !importedFiles.includes(config.audio_file)) {
      setImportedFiles(prev => [...prev, config.audio_file]);
    }
  }, []);

  // Clean up AudioMixer connection since VideoPreview handles BGM mixing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = config.audio_volume;
  }, [config.audio_volume]);
  
  // Pause preview when project starts playing
  useEffect(() => {
    const handleEditorPlay = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    window.addEventListener('editor-play', handleEditorPlay);
    return () => window.removeEventListener('editor-play', handleEditorPlay);
  }, []);

  const handleImportLocal = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'flac', 'm4a'] }]
      });
      if (selected && typeof selected === 'string') {
        // Chỉ thêm vào danh sách imported files, KHÔNG auto-enable BGM
        if (!importedFiles.includes(selected)) {
          setImportedFiles(prev => [...prev, selected]);
        }
        config.updateConfig({ audio_file: selected });
      }
    } catch (err) {
      console.error("Failed to import audio:", err);
    }
  };

  const handleAddToTimeline = (filePath: string) => {
    // Dispatch custom event để Timeline nhận và tạo clip
    window.dispatchEvent(new CustomEvent('add-audio-to-timeline', { 
      detail: { filePath, mediaType: 'audio' } 
    }));
    // Sync config cho backward compat (Properties panel)
    config.updateConfig({ audio_enabled: true, audio_file: filePath });
  };

  const handleRemoveImported = (filePath: string) => {
    setImportedFiles(prev => prev.filter(f => f !== filePath));
    if (config.audio_file === filePath) {
      config.updateConfig({ audio_file: '' });
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    config.updateConfig({ audio_file: url });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      <div className="phd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MusicNotes size={18} weight="bold" color="var(--accent)" />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>Audio & Music</span>
        </div>
        <button 
          onClick={handleImportLocal}
          className="btn"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '4px 10px', fontSize: '11px', background: 'var(--accent)', 
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}
        >
          <UploadSimple size={14} weight="bold" />
          Import
        </button>
      </div>

      <div className="mlist" style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {/* IMPORTED LOCAL FILES */}
        {importedFiles.map((filePath) => (
          <div 
            key={filePath}
            className="audio-lib-item active" 
            style={{ marginBottom: '6px', border: '1px solid var(--accent)', borderRadius: '6px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div className="audio-lib-icon"><Waveform size={18} weight="fill" color="var(--accent)" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePath.split(/[/\\]/).pop()}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Local File</div>
            </div>
            {/* Add to Timeline button */}
            <button 
              onClick={() => handleAddToTimeline(filePath)}
              title="Thêm vào Timeline"
              style={{ 
                background: 'var(--accent)', border: 'none', borderRadius: '3px', 
                cursor: 'pointer', display: 'flex', padding: '2px 4px',
                color: '#fff', fontSize: '9px', alignItems: 'center', gap: '2px',
              }}
            >
              <Plus size={10} weight="bold" /> BGM
            </button>
            <button 
              className="btn-icon" 
              onClick={(e) => { e.stopPropagation(); handleRemoveImported(filePath); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', marginTop: importedFiles.length > 0 ? '8px' : '0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Library Tracks</div>
        
        {AUDIO_SAMPLES.map((sample) => {
          const isActive = config.audio_file === sample.url;
          return (
            <div
              key={sample.id}
              className={`audio-lib-item ${isActive ? 'active' : ''}`}
              onClick={() => handlePreview(sample.url)}
              style={{ cursor: 'pointer', marginBottom: '4px', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', background: isActive ? 'var(--accent-subtle)' : 'transparent' }}
            >
              <div className="audio-lib-icon">
                <Waveform size={18} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--accent)" : "var(--text-muted)"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>{sample.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{sample.genre} • {sample.duration}</div>
              </div>
              {/* Add to Timeline button */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddToTimeline(sample.url); }}
                title="Thêm vào Timeline"
                style={{ 
                  background: 'rgba(var(--accent-rgb, 99,102,241), 0.15)', border: '1px solid rgba(var(--accent-rgb, 99,102,241), 0.3)', 
                  borderRadius: '3px', cursor: 'pointer', display: 'flex', padding: '2px 4px',
                  color: 'var(--accent)', fontSize: '9px', alignItems: 'center', gap: '2px',
                }}
              >
                <Plus size={10} weight="bold" /> BGM
              </button>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
            </div>
          );
        })}
      </div>

      {/* ACTIVE AUDIO PREVIEW */}
      {config.audio_file && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '4px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
            <audio ref={audioRef} crossOrigin="anonymous" controls style={{ width: '100%', height: '24px' }} src={getMediaSrc(config.audio_file) || ''} />
          </div>
        </div>
      )}
    </div>
  );
}
