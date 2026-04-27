import { memo } from 'react';
import { TrackMeta, Clip, SubtitleClip } from '../../types/timeline';
import { ClipBlock } from './ClipBlock';

interface TrackRowProps {
  track: TrackMeta;
  clips: (Clip | SubtitleClip)[];
  pixelsPerSecond: number;
  scrollLeft: number;
  viewportWidth: number;
  timelineWidth: number;
  selectedClipId: string | null;
  onClipSelect: (clipId: string) => void;
  onClipDragStart: (clipId: string, e: React.PointerEvent) => void;
  onClipResizeStart: (clipId: string, side: 'left' | 'right', e: React.PointerEvent) => void;
}

const TIMELINE_OFFSET_X = 4;

export const TrackRow = memo(({
  track,
  clips,
  pixelsPerSecond,
  scrollLeft,
  viewportWidth,
  timelineWidth,
  selectedClipId,
  onClipSelect,
  onClipDragStart,
  onClipResizeStart,
}: TrackRowProps) => {
  const isMain = track.id === 'main';

  // Virtualization: chỉ render clips visible trong viewport
  const viewportStartTime = Math.max(0, scrollLeft / pixelsPerSecond);
  const viewportEndTime = (scrollLeft + viewportWidth) / pixelsPerSecond;

  const visibleClips = clips.filter(clip => {
    const clipEnd = clip.timelineStart + clip.timelineDuration;
    return clipEnd > viewportStartTime && clip.timelineStart < viewportEndTime;
  });

  return (
    <div
      className="tltr"
      style={{
        height: track.height,
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
        background: isMain ? 'rgba(var(--accent-rgb, 99,102,241), 0.03)' : 'transparent',
      }}
    >
      <div style={{
        position: 'absolute',
        left: -scrollLeft + TIMELINE_OFFSET_X,
        top: 0,
        width: timelineWidth,
        height: '100%',
      }}>
        {visibleClips.map(clip => (
          <ClipBlock
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            scrollLeft={scrollLeft}
            viewportWidth={viewportWidth}
            isSelected={selectedClipId === clip.id}
            isMainTrack={isMain}
            onSelect={() => onClipSelect(clip.id)}
            onDragStart={(e) => onClipDragStart(clip.id, e)}
            onResizeStart={(side, e) => onClipResizeStart(clip.id, side, e)}
          />
        ))}
      </div>
    </div>
  );
});
