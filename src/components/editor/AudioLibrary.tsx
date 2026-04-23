import { Plus, Waveform, UploadSimple, MusicNotes, X } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';
import { SliderControl } from '../controls/SliderControl';
import { getMediaSrc } from '../../utils/url';
import { useRef, useEffect } from 'react';
import { AudioMixer } from '../../lib/audioMixer';

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

  // Connect BGM element khi loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !config.audio_file) return;

    const handleCanPlay = () => {
      AudioMixer.init();
      AudioMixer.connectBGM(audio);
      AudioMixer.setBGMVolume(config.audio_volume);
    };

    audio.addEventListener('canplay', handleCanPlay);
    return () => audio.removeEventListener('canplay', handleCanPlay);
  }, [config.audio_file]);

  // Sync BGM volume qua GainNode
  useEffect(() => {
    AudioMixer.setBGMVolume(config.audio_volume);
  }, [config.audio_volume]);

  const handleImportLocal = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'flac', 'm4a'] }]
      });
      if (selected && typeof selected === 'string') {
        config.updateConfig({ 
          audio_enabled: true, 
          audio_file: selected 
        });
      }
    } catch (err) {
      console.error("Failed to import audio:", err);
    }
  };

  const handleSelectTrack = (url: string) => {
    config.updateConfig({
      audio_enabled: true,
      audio_file: url,
    });
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
        {/* LOCAL AUDIO INDICATOR */}
        {config.audio_file && !AUDIO_SAMPLES.some(s => s.url === config.audio_file) && (
          <div className="audio-lib-item active" style={{ marginBottom: '8px', border: '1px solid var(--accent)' }}>
            <div className="audio-lib-icon"><Waveform size={20} weight="fill" /></div>
            <div className="audio-lib-info" style={{ flex: 1 }}>
              <div className="audio-lib-name" style={{ fontSize: '11px', fontWeight: 600 }}>{config.audio_file.split(/[/\\]/).pop()}</div>
              <div className="audio-lib-meta">Local File</div>
            </div>
            <button className="btn-icon" onClick={() => config.updateConfig({ audio_file: '' })}><X size={14} /></button>
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Library Tracks</div>
        
        {AUDIO_SAMPLES.map((sample) => {
          const isActive = config.audio_file === sample.url;
          return (
            <div
              key={sample.id}
              className={`audio-lib-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectTrack(sample.url)}
              style={{ cursor: 'pointer', marginBottom: '4px', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', gap: '10px', background: isActive ? 'var(--accent-subtle)' : 'transparent' }}
            >
              <div className="audio-lib-icon">
                <Waveform size={20} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--accent)" : "var(--text-muted)"} />
              </div>
              <div className="audio-lib-info" style={{ flex: 1 }}>
                <div className="audio-lib-name" style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>{sample.name}</div>
                <div className="audio-lib-meta" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{sample.genre} • {sample.duration}</div>
              </div>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
            </div>
          );
        })}
      </div>

      {/* ACTIVE AUDIO CONTROLS (Moved from right panel) */}
      {config.audio_enabled && config.audio_file && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ marginBottom: '8px', padding: '4px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
            <audio ref={audioRef} crossOrigin="anonymous" controls style={{ width: '100%', height: '24px' }} src={getMediaSrc(config.audio_file) || ''} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SliderControl
              label="Volume"
              value={Math.round(config.audio_volume * 100)}
              min={0} max={100} unit="%"
              onChange={(v) => config.updateConfig({ audio_volume: v / 100 })}
            />
            <SliderControl
              label="Ducking"
              value={Math.round(config.ducking_strength * 100)}
              min={0} max={100} unit="%"
              onChange={(v) => config.updateConfig({ ducking_strength: v / 100 })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
