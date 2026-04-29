import { memo } from 'react';
import { Clip, SubtitleClip } from '../../types/timeline';
import { AudioTrack } from './AudioTrack';
import { useTimelineStore } from '../../stores/useTimelineStore';

interface ClipBlockProps {
  clipId: string;
  pixelsPerSecond: number;
  scrollLeft: number;
  viewportWidth: number;
  viewportStartTime: number;
  viewportEndTime: number;
  isSelected: boolean;
  isMainTrack: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (side: 'left' | 'right', e: React.PointerEvent) => void;
}

function isSubtitleClip(clip: Clip | SubtitleClip): clip is SubtitleClip {
  return clip.type === 'subtitle';
}

export const ClipBlock = memo(({
  clipId,
  pixelsPerSecond,
  scrollLeft,
  viewportWidth,
  viewportStartTime,
  viewportEndTime,
  isSelected,
  isMainTrack,
  isLocked,
  onSelect,
  onDragStart,
  onResizeStart,
}: ClipBlockProps) => {
  const clip = useTimelineStore(s => s.clips[clipId]);

  if (!clip) return null;

  // Virtualization check
  const clipEnd = clip.timelineStart + clip.timelineDuration;
  if (clipEnd <= viewportStartTime || clip.timelineStart >= viewportEndTime) {
    return null;
  }
  const leftPx = clip.timelineStart * pixelsPerSecond;
  const widthPx = clip.timelineDuration * pixelsPerSecond;
  const heightOffset = isMainTrack ? 4 : 4;
  const blockHeight = isMainTrack ? 52 : 32;

  // Xác định background và border theo type
  let bgColor = 'var(--bg-surface)';
  let borderColor = 'var(--accent)';

  switch (clip.type) {
    case 'video':
      bgColor = 'var(--accent-subtle)';
      borderColor = 'var(--accent)';
      break;
    case 'audio':
      bgColor = clip.trackId === 'tts' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)';
      borderColor = clip.trackId === 'tts' ? '#f59e0b' : '#22c55e';
      break;
    case 'subtitle':
      bgColor = isSelected ? 'var(--ac-hover)' : 'var(--ac)';
      borderColor = isSelected ? '#fff' : 'rgba(0,0,0,0.2)';
      break;
  }

  const renderContent = () => {
    switch (clip.type) {
      case 'video': {
        const fileName = clip.sourceFile.split(/[/\\]/).pop() || 'Video';
        return (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            padding: '0 8px', overflow: 'hidden', pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.1) 100%)',
          }}>
            <span style={{ fontSize: 11, color: '#c7d2fe', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
              🎬 {fileName}
            </span>
          </div>
        );
      }
      case 'audio':
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <AudioTrack
              url={clip.sourceFile}
              pixelsPerSecond={pixelsPerSecond}
              color={borderColor}
              scrollLeft={scrollLeft - (clip.timelineStart * pixelsPerSecond)}
              viewportWidth={viewportWidth}
            />
          </div>
        );
      case 'subtitle':
        if (isSubtitleClip(clip)) {
          return (
            <>
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  padding: '0 4px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onDragStart(e);
                }}
              >
                {clip.translatedText || clip.sourceText || '[Trống]'}
              </div>
            </>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      data-clip-id={clipId}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        // Main track locked when subtitles exist — only resize/trim
        if (!isLocked) {
          onDragStart(e);
        }
      }}
      style={{
        position: 'absolute',
        left: leftPx,
        width: widthPx,
        height: blockHeight,
        top: heightOffset,
        background: bgColor,
        borderRadius: clip.type === 'subtitle' ? 4 : 8,
        border: isSelected ? '2px solid #fff' : `1px solid ${borderColor}`,
        overflow: 'hidden',
        cursor: isLocked ? 'default' : 'grab',
        boxShadow: isSelected ? '0 0 0 1px var(--ac-hover)' : 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Resize handle LEFT */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
          onResizeStart('left', e);
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: clip.type === 'subtitle' ? 'rgba(255,255,255,0.2)' : borderColor,
          cursor: 'ew-resize',
          zIndex: 10,
          flexShrink: 0,
        }}
      />

      {/* Content area */}
      {renderContent()}

      {/* Resize handle RIGHT */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
          onResizeStart('right', e);
        }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: clip.type === 'subtitle' ? 'rgba(255,255,255,0.2)' : borderColor,
          cursor: 'ew-resize',
          zIndex: 10,
          flexShrink: 0,
        }}
      />
    </div>
  );
});
