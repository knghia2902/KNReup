import { memo, useState } from 'react';
import { TrackMeta, isOverlayTrack } from '../../types/timeline';
import { TextT, Waveform, SpeakerHigh, MusicNote, Lock, LockOpen, Eye, EyeSlash, SpeakerSlash } from '@phosphor-icons/react';

interface TrackHeaderProps {
  track: TrackMeta;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
}

// CapCut style icons cho mỗi track type
function getTrackIcon(trackId: string) {
  if (isOverlayTrack(trackId)) return (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <rect x="40" y="40" width="176" height="56" rx="8" opacity="0.8" />
      <rect x="40" y="112" width="176" height="56" rx="8" opacity="0.5" />
      <rect x="40" y="184" width="176" height="32" rx="8" opacity="0.3" />
    </svg>
  );
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
  const isOverlay = isOverlayTrack(track.id);
  const [hovered, setHovered] = useState(false);

  // Tính trạng thái có control nào active (cần luôn hiện)
  const hasActiveControl = track.locked || !track.visible || track.muted;

  return (
    <div 
      style={{ 
        height: track.height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        padding: '0 3px', 
        borderBottom: '1px solid var(--border-subtle)', 
        background: isMain ? 'rgba(var(--accent-rgb, 99,102,241), 0.06)' : isOverlay ? 'rgba(167,139,250,0.06)' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Track icon (always visible) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isMain ? 'var(--accent)' : isOverlay ? '#a78bfa' : 'var(--text-muted)', 
        opacity: 0.8,
        flexShrink: 0,
      }}>
        {getTrackIcon(track.id)}
      </div>

      {/* Control buttons — hiện khi hover HOẶC khi có control active */}
      {(hovered || hasActiveControl) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* Lock — chỉ hiện khi hover hoặc locked */}
          {(hovered || track.locked) && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: track.locked ? 'var(--accent)' : 'var(--text-muted)',
                opacity: track.locked ? 1 : 0.35,
              }}
              title={track.locked ? 'Unlock Track' : 'Lock Track'}
            >
              {track.locked ? <Lock size={10} weight="fill" /> : <LockOpen size={10} weight="regular" />}
            </button>
          )}

          {/* Eye — chỉ hiện khi hover hoặc hidden */}
          {(hovered || !track.visible) && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: track.visible ? 'var(--text-muted)' : 'var(--warning)',
                opacity: track.visible ? 0.35 : 1,
              }}
              title={track.visible ? 'Hide Track' : 'Show Track'}
            >
              {track.visible ? <Eye size={10} weight="regular" /> : <EyeSlash size={10} weight="regular" />}
            </button>
          )}

          {/* Mute — chỉ hiện khi hover hoặc muted */}
          {(hovered || track.muted) && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: track.muted ? 'var(--danger)' : 'var(--text-muted)',
                opacity: track.muted ? 1 : 0.35,
              }}
              title={track.muted ? 'Unmute' : 'Mute'}
            >
              {track.muted ? <SpeakerSlash size={10} weight="fill" /> : <SpeakerHigh size={10} weight="regular" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
