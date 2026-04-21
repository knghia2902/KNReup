import { Plus, Waveform } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';

/**
 * Built-in royalty-free audio samples.
 * Uses free Pixabay audio. In production, bundle as local assets.
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
  {
    id: 'corporate-uplift',
    name: 'Corporate Uplift',
    genre: 'Corporate',
    duration: '2:10',
    bpm: 110,
    url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5765c3e0a.mp3',
  },
  {
    id: 'electronic-beat',
    name: 'Electronic Beat',
    genre: 'Electronic',
    duration: '3:30',
    bpm: 140,
    url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dae2b6d8a.mp3',
  },
];

export function AudioLibrary() {
  const config = useProjectStore();

  const handleAddToTimeline = (sample: typeof AUDIO_SAMPLES[0]) => {
    config.updateConfig({
      bgm_enabled: true,
      bgm_file: sample.url,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="phd">
        <span className="phd-lbl">Audio Library</span>
        <span className="phd-cnt">{AUDIO_SAMPLES.length} tracks</span>
      </div>

      <div className="mlist" style={{ flex: 1, overflow: 'auto' }}>
        {AUDIO_SAMPLES.map((sample) => {
          const isActive = config.bgm_file === sample.url;
          return (
            <div
              key={sample.id}
              className={`audio-lib-item ${isActive ? 'active' : ''}`}
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData('application/knreup-asset', JSON.stringify({ type: 'audio', url: sample.url }));
              }}
              style={{ cursor: 'grab' }}
            >
              <div className="audio-lib-icon">
                <Waveform size={20} weight="duotone" />
              </div>

              <div className="audio-lib-info">
                <div className="audio-lib-name">{sample.name}</div>
                <div className="audio-lib-meta">
                  <span>{sample.genre}</span>
                  <span>•</span>
                  <span>{sample.duration}</span>
                  <span>•</span>
                  <span>{sample.bpm} BPM</span>
                </div>
              </div>

              <div className="audio-lib-actions">
                <button
                  className="audio-lib-btn"
                  title="Add to timeline"
                  onClick={() => handleAddToTimeline(sample)}
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
