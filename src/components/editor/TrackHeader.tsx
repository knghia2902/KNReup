import { memo } from 'react';
import { TrackMeta } from '../../types/timeline';
import { TextT, Waveform, SpeakerHigh, MusicNote, Lock, LockOpen, Eye, EyeSlash, SpeakerSlash } from '@phosphor-icons/react';

interface TrackHeaderProps {
  track: TrackMeta;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
}

// CapCut style icons cho mỗi track type
function getTrackIcon(trackId: string) {
  switch (trackId) {
    case 'sub':  return <TextT size={14} weight="bold" />;
    case 'main': return <Waveform size={14} weight="bold" />;
    case 'tts':  return <SpeakerHigh size={14} weight="bold" />;
    case 'bgm':  return <MusicNote size={14} weight="bold" />;
    default:     return null;
  }
}

export const TrackHeader = memo(({ track, onToggleMute, onToggleLock, onToggleVisibility }: TrackHeaderProps) => {
  const isMain = track.id === 'main';

  return (
    <div style={{ 
      height: track.height, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 4px', 
      borderBottom: '1px solid var(--border-subtle)', 
      background: isMain ? 'rgba(var(--accent-rgb, 99,102,241), 0.06)' : 'transparent',
    }}>
      {/* Track icon (CapCut style — no text label) */}
      <div style={{ 
        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isMain ? 'var(--accent)' : 'var(--text-muted)', 
        opacity: 0.8,
        flexShrink: 0,
      }}>
        {getTrackIcon(track.id)}
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          className="tl-track-btn"
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', 
            padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: track.locked ? 'var(--accent)' : 'var(--text-muted)',
            opacity: track.locked ? 1 : 0.35,
          }}
          title={track.locked ? 'Unlock Track' : 'Lock Track'}
        >
          {track.locked ? <Lock size={12} weight="fill" /> : <LockOpen size={12} weight="regular" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="tl-track-btn"
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: track.visible ? 'var(--text-muted)' : 'var(--warning)',
            opacity: track.visible ? 0.35 : 1,
          }}
          title={track.visible ? 'Hide Track' : 'Show Track'}
        >
          {track.visible ? <Eye size={12} weight="regular" /> : <EyeSlash size={12} weight="regular" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="tl-track-btn"
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: track.muted ? 'var(--danger)' : 'var(--text-muted)',
            opacity: track.muted ? 1 : 0.35,
          }}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? <SpeakerSlash size={12} weight="fill" /> : <SpeakerHigh size={12} weight="regular" />}
        </button>
      </div>
    </div>
  );
});
