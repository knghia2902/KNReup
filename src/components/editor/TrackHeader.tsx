import { memo } from 'react';
import { TrackMeta } from '../../types/timeline';

interface TrackHeaderProps {
  track: TrackMeta;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
}

export const TrackHeader = memo(({ track, onToggleMute, onToggleLock, onToggleVisibility }: TrackHeaderProps) => {
  const isMain = track.id === 'main';

  return (
    <div style={{ 
      height: track.height, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 6px', 
      borderBottom: '1px solid var(--border-subtle)', 
      fontSize: isMain ? '11px' : '10px', 
      color: 'var(--text-muted)', 
      fontWeight: isMain ? 700 : 600,
      background: isMain ? 'rgba(var(--accent-rgb, 99,102,241), 0.05)' : 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: track.color }} />
        {track.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Lock toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px', 
            display: 'flex', fontSize: '10px', opacity: track.locked ? 0.9 : 0.4,
            color: 'var(--text-muted)',
          }}
          title={track.locked ? 'Unlock Track' : 'Lock Track'}
        >
          {track.locked ? '🔒' : '🔓'}
        </button>
        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            display: 'flex', fontSize: '10px', opacity: track.visible ? 0.9 : 0.4,
            color: 'var(--text-muted)',
          }}
          title={track.visible ? 'Hide Track' : 'Show Track'}
        >
          {track.visible ? '👁️' : '👁️‍🗨️'}
        </button>
        {/* Volume/Mute toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            display: 'flex', fontSize: '10px', opacity: track.muted ? 0.4 : 0.9,
            color: 'var(--text-muted)',
          }}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
});
