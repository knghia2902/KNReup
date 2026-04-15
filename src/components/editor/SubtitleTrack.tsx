import { useEffect, useRef, useState } from 'react';
import { useSubtitleStore, SubtitleSegment } from '../../stores/useSubtitleStore';

interface SubtitleTrackProps {
  pixelsPerSecond: number;
}

export function SubtitleTrack({ pixelsPerSecond }: SubtitleTrackProps) {
  const { segments, selectSegment, selectedId, splitSegment, trimSegment, deleteSegment } = useSubtitleStore();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.toLowerCase() === 'c' && selectedId !== null) {
        const video = document.querySelector('video');
        if (video) {
          const time = video.currentTime;
          const seg = useSubtitleStore.getState().segments.find(s => s.id === selectedId);
          if (seg && time > seg.start && time < seg.end) {
             splitSegment(selectedId, time);
          }
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        deleteSegment(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, splitSegment, deleteSegment]);

  return (
    <div ref={trackRef} style={{ position: 'relative', top: 0, left: 0, width: '100%', height: '100%' }}>
      {segments.map(s => (
        <SubtitleBlock 
           key={s.id} 
           segment={s} 
           pixelsPerSecond={pixelsPerSecond} 
           isSelected={s.id === selectedId}
           onClick={() => {
             selectSegment(s.id);
             window.dispatchEvent(new CustomEvent('focus-subtitle-panel', { detail: s.id }));
           }}
           onTrim={(newStart, newEnd) => trimSegment(s.id, newStart, newEnd)}
        />
      ))}
    </div>
  );
}

function SubtitleBlock({ segment, pixelsPerSecond, isSelected, onClick, onTrim }: { 
  segment: SubtitleSegment; 
  pixelsPerSecond: number; 
  isSelected: boolean; 
  onClick: () => void; 
  onTrim: (s: number, e: number) => void 
}) {
  const segments = useSubtitleStore(state => state.segments);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, sStart: 0 });
  
  const currentIndex = segments.findIndex(s => s.id === segment.id);
  const prevSegment = currentIndex > 0 ? segments[currentIndex - 1] : null;
  const nextSegment = currentIndex < segments.length - 1 ? segments[currentIndex + 1] : null;

  const minAllowableStart = prevSegment ? prevSegment.end : 0;
  const maxAllowableEnd = nextSegment ? nextSegment.start : Infinity;

  const leftPx = segment.start * pixelsPerSecond;
  const widthPx = (segment.end - segment.start) * pixelsPerSecond;

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingLeft && !isDraggingRight && !isDraggingCenter) return;
      const tlbody = document.querySelector('.tlbody');
      if (!tlbody) return;
      
      const rect = tlbody.getBoundingClientRect();
      const scrollLeft = tlbody.scrollLeft;
      const pointerX = e.clientX - rect.left + scrollLeft;
      const newTime = pointerX / pixelsPerSecond;

      if (isDraggingLeft) {
        let newStart = Math.max(minAllowableStart, Math.min(newTime, segment.end - 0.3));
        onTrim(Math.max(0, newStart), segment.end);
      } else if (isDraggingRight) {
        let newEnd = Math.min(maxAllowableEnd, Math.max(newTime, segment.start + 0.3));
        onTrim(segment.start, newEnd);
      } else if (isDraggingCenter) {
        const deltaX = pointerX - dragStartPoint.x;
        const deltaTime = deltaX / pixelsPerSecond;
        let newStart = dragStartPoint.sStart + deltaTime;
        const duration = segment.end - segment.start;
        
        if (newStart < minAllowableStart) newStart = minAllowableStart;
        if (newStart + duration > maxAllowableEnd) newStart = maxAllowableEnd - duration;
        
        onTrim(newStart, newStart + duration);
      }
    };

    const handlePointerUp = () => {
      if (isDraggingLeft || isDraggingRight || isDraggingCenter) {
        setIsDraggingLeft(false);
        setIsDraggingRight(false);
        setIsDraggingCenter(false);
      }
    };

    if (isDraggingLeft || isDraggingRight || isDraggingCenter) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingLeft, isDraggingRight, isDraggingCenter, dragStartPoint, segment, pixelsPerSecond, onTrim]);

  return (
    <div 
      onPointerDown={onClick}
      style={{ 
        position: 'absolute', 
        left: leftPx, 
        width: widthPx,
        height: 30, 
        top: 6, 
        background: isSelected ? 'var(--ac-hover)' : 'var(--ac)', 
        borderRadius: 4, 
        border: isSelected ? '1px solid #fff' : '1px solid rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 1px var(--ac-hover)' : 'none',
        cursor: 'pointer'
      }}
    >
      <div 
        onPointerDown={(e) => { e.stopPropagation(); setIsDraggingLeft(true); }}
        style={{ width: 6, height: '100%', cursor: 'ew-resize', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} 
      />
      
      <div 
        style={{ flex: 1, padding: '0 4px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', color: '#fff', fontWeight: 600, cursor: 'grab' }}
        onPointerDown={(e) => {
          const tlbody = document.querySelector('.tlbody');
          if (tlbody) {
            const rect = tlbody.getBoundingClientRect();
            const pointerX = e.clientX - rect.left + tlbody.scrollLeft;
            setDragStartPoint({ x: pointerX, sStart: segment.start });
            setIsDraggingCenter(true);
          }
        }}
      >
        {segment.translated_text || segment.source_text || '[Trống]'}
      </div>

      <div 
        onPointerDown={(e) => { e.stopPropagation(); setIsDraggingRight(true); }}
        style={{ width: 6, height: '100%', cursor: 'ew-resize', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} 
      />
    </div>
  );
}
