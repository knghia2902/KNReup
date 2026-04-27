import { memo } from 'react';
import { Clip, SubtitleClip } from '../../types/timeline';
import { VideoTrack } from './VideoTrack';
import { AudioTrack } from './AudioTrack';
import { useSubtitleStore } from '../../stores/useSubtitleStore';

interface ClipBlockProps {
  clip: Clip | SubtitleClip;
  pixelsPerSecond: number;
  scrollLeft: number;
  viewportWidth: number;
  isSelected: boolean;
  isMainTrack: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (side: 'left' | 'right', e: React.PointerEvent) => void;
}

function isSubtitleClip(clip: Clip | SubtitleClip): clip is SubtitleClip {
  return clip.type === 'subtitle';
}

export const ClipBlock = memo(({
  clip,
  pixelsPerSecond,
  scrollLeft,
  viewportWidth,
  isSelected,
  isMainTrack,
  onSelect,
  onDragStart,
  onResizeStart,
}: ClipBlockProps) => {
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
      bgColor = 'rgba(34,197,94,0.15)';
      borderColor = '#22c55e';
      break;
    case 'subtitle':
      bgColor = isSelected ? 'var(--ac-hover)' : 'var(--ac)';
      borderColor = isSelected ? '#fff' : 'rgba(0,0,0,0.2)';
      break;
  }

  const renderContent = () => {
    switch (clip.type) {
      case 'video':
        return (
          <>
            <VideoTrack
              videoPath={clip.sourceFile}
              videoDuration={clip.sourceDuration || clip.timelineDuration}
              pixelsPerSecond={pixelsPerSecond}
              clipStart={clip.sourceStart}
              scrollLeft={scrollLeft - (clip.timelineStart * pixelsPerSecond)}
              viewportWidth={viewportWidth}
            />
            {/* Embedded audio waveform overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }}>
              <AudioTrack
                url={clip.sourceFile}
                pixelsPerSecond={pixelsPerSecond}
                color="var(--success)"
                scrollLeft={scrollLeft - (clip.timelineStart * pixelsPerSecond)}
                viewportWidth={viewportWidth}
              />
            </div>
          </>
        );
      case 'audio':
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <AudioTrack
              url={clip.sourceFile}
              pixelsPerSecond={pixelsPerSecond}
              color="var(--accent)"
              scrollLeft={scrollLeft - (clip.timelineStart * pixelsPerSecond)}
              viewportWidth={viewportWidth}
            />
          </div>
        );
      case 'subtitle':
        if (isSubtitleClip(clip)) {
          return (
            <div
              style={{
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
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        // Cho subtitle, drag được handle bên trong
        if (clip.type !== 'subtitle') {
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
        cursor: 'grab',
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
