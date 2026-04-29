import { memo } from 'react';
import { TrackMeta } from '../../types/timeline';
import { ClipBlock } from './ClipBlock';
import { useTimelineStore } from '../../stores/useTimelineStore';

interface TrackRowProps {
  track: TrackMeta;
  pixelsPerSecond: number;
  scrollLeft: number;
  viewportWidth: number;
  timelineWidth: number;
  selectedClipId: string | null;
  isHighlighted?: boolean;
  onClipSelect: (clipId: string) => void;
  onClipDragStart: (clipId: string, e: React.PointerEvent) => void;
  onClipResizeStart: (clipId: string, side: 'left' | 'right', e: React.PointerEvent) => void;
  isLocked?: boolean;
}

const TIMELINE_OFFSET_X = 4;

export const TrackRow = memo(({
  track,
  pixelsPerSecond,
  scrollLeft,
  viewportWidth,
  timelineWidth,
  selectedClipId,
  isHighlighted = false,
  onClipSelect,
  onClipDragStart,
  onClipResizeStart,
  isLocked = false,
}: TrackRowProps) => {
  const isMain = track.id === 'main';

  const clipIds = useTimelineStore(s => s.trackClips[track.id] || []);

  const viewportStartTime = Math.max(0, scrollLeft / pixelsPerSecond);
  const viewportEndTime = (scrollLeft + viewportWidth) / pixelsPerSecond;

  return (
    <div
      className="tltr"
      style={{
        height: track.height,
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
        background: isHighlighted
          ? 'rgba(99, 102, 241, 0.1)'
          : isMain ? 'rgba(var(--accent-rgb, 99,102,241), 0.03)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        left: -scrollLeft + TIMELINE_OFFSET_X,
        top: 0,
        width: timelineWidth,
        height: '100%',
      }}>
        {clipIds.map(clipId => (
          <ClipBlock
            key={clipId}
            clipId={clipId}
            pixelsPerSecond={pixelsPerSecond}
            scrollLeft={scrollLeft}
            viewportWidth={viewportWidth}
            viewportStartTime={viewportStartTime}
            viewportEndTime={viewportEndTime}
            isSelected={selectedClipId === clipId}
            isMainTrack={isMain}
            onSelect={() => onClipSelect(clipId)}
            onDragStart={(e: React.PointerEvent) => onClipDragStart(clipId, e)}
            onResizeStart={(side: 'left' | 'right', e: React.PointerEvent) => onClipResizeStart(clipId, side, e)}
            isLocked={isMain ? isLocked : false}
          />
        ))}
      </div>
    </div>
  );
});
