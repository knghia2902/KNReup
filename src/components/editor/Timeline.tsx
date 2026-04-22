import { useEffect, useRef, useState, memo } from 'react';
import { Scissors, ArrowLineLeft, ArrowLineRight } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { AudioTrack } from './AudioTrack';
import { VideoTrack } from './VideoTrack';
import { SubtitleTrack } from './SubtitleTrack';

function formatTime(secs: number) {
  if (isNaN(secs) || !isFinite(secs)) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function formatTimeShort(secs: number) {
  if (!isFinite(secs) || isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TIMELINE_OFFSET_X = 4;

const TimelineRuler = memo(({ width, pixelsPerSecond, scrollLeft, viewportWidth }: any) => {
  let labelInterval = 5;
  if (pixelsPerSecond > 100) labelInterval = 1;
  else if (pixelsPerSecond < 10) labelInterval = 10;
  else if (pixelsPerSecond < 2) labelInterval = 60;

  const startIdx = Math.floor(scrollLeft / pixelsPerSecond / labelInterval);
  const endIdx = Math.ceil((scrollLeft + viewportWidth) / pixelsPerSecond / labelInterval);
  
  const labels = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const time = i * labelInterval;
    const x = time * pixelsPerSecond;
    labels.push({
      id: i,
      text: formatTimeShort(time),
      style: { position: 'absolute', left: x + TIMELINE_OFFSET_X, top: 4, fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', pointerEvents: 'none' }
    });
  }

  const tickStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: -scrollLeft + TIMELINE_OFFSET_X, width, height: '100%',
    backgroundImage: `
      repeating-linear-gradient(to right, var(--border-subtle) 0, var(--border-subtle) 1px, transparent 1px, transparent ${pixelsPerSecond}px),
      repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent ${pixelsPerSecond * 5}px)
    `,
    backgroundSize: `${pixelsPerSecond}px 8px, ${pixelsPerSecond * 5}px 14px`,
    backgroundPosition: '0 100%, 0 100%',
    backgroundRepeat: 'repeat-x',
    pointerEvents: 'none'
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: viewportWidth || '100%', height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 10, overflow: 'hidden' }}>
      <div style={tickStyle} />
      {labels.map(l => (
        <div key={l.id} style={{ ...l.style as any, left: (l.style.left as number) - scrollLeft }}>
          {l.text}
        </div>
      ))}
    </div>
  );
});

interface TimelineProps {
  filePaths: string[];
}

export function Timeline({ filePaths }: TimelineProps) {
  const config = useProjectStore();
  const { timelineZoom, updateConfig, bgm_enabled, bgm_file, snapEnabled, snapThreshold, selectedClipId } = config;
  const { videoDuration, segments, activeFile, selectedId } = useSubtitleStore();

  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [resizingClip, setResizingClip] = useState<{ type: 'vid' | 'bgm' | 'sub', side: 'left' | 'right' } | null>(null);
  const [draggingClip, setDraggingClip] = useState<'vid' | 'bgm' | null>(null);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);

  const pixelsPerSecond = Math.max(0.1, 50 * timelineZoom);
  const currentVideoPath = activeFile || (filePaths.length > 0 ? filePaths[0] : null);
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  const rawDuration = Math.max(videoDuration || 0, maxSubTime, 1);
  const safeDuration = isFinite(rawDuration) ? rawDuration : 3600;
  
  const timelineWidthPx = Math.min(safeDuration * pixelsPerSecond + (100 * pixelsPerSecond), 10000000);

  const handleSplitAtPlayhead = () => {
    if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
      useSubtitleStore.getState().splitSegment(selectedId, currentTime);
    }
    // Video split deferred until multi-clip support
  };

  const handleSplitLeft = () => {
    if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
      const seg = segments.find(s => s.id === selectedId);
      if (seg && currentTime > seg.start && currentTime < seg.end) {
        useSubtitleStore.getState().trimSegment(selectedId, currentTime, seg.end);
      }
    } else {
      config.splitLeft(currentTime, videoDuration);
    }
  };

  const handleSplitRight = () => {
    if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
      const seg = segments.find(s => s.id === selectedId);
      if (seg && currentTime > seg.start && currentTime < seg.end) {
        useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
      }
    } else {
      config.splitRight(currentTime, videoDuration);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setScrollLeft(el.scrollLeft);
      setViewportWidth(el.clientWidth);
    };
    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    }
  }, []);

  const getSnapMetadata = (time: number) => {
    if (!snapEnabled) return { snapped: false, time };
    const snapPoints = [0, videoDuration];
    const vidEnd = config.vid_clip_start + (config.vid_clip_duration || videoDuration);
    snapPoints.push(config.vid_clip_start, vidEnd);
    if (bgm_enabled) snapPoints.push(config.bgm_timeline_start);
    segments.forEach(s => snapPoints.push(s.start, s.end));
    
    const threshold = snapThreshold / pixelsPerSecond;
    let closestTime = time;
    let snapped = false;
    let minDiff = threshold;

    snapPoints.forEach(p => {
      const diff = Math.abs(time - p);
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = p;
        snapped = true;
      }
    });
    return { snapped, time: closestTime };
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = -1;
    const updatePlayhead = () => {
      if (playheadRef.current && !isDraggingPlayhead) {
        const video = document.querySelector('video');
        if (video) {
          const time = video.currentTime;
          if (time !== lastTime) {
            lastTime = time;
            setCurrentTime(time);
            const xPos = time * pixelsPerSecond;
            playheadRef.current.style.transform = `translateX(${xPos + TIMELINE_OFFSET_X - scrollLeft}px)`;
          }
        }
      }
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pixelsPerSecond, isDraggingPlayhead, scrollLeft]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const tlbody = containerRef.current;
      if (!tlbody) return;
      const rect = tlbody.getBoundingClientRect();

      if (isDraggingPlayhead) {
        const x = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
        const newTime = Math.max(0, x / pixelsPerSecond);
        const { snapped, time: snappedTime } = getSnapMetadata(newTime);
        setActiveSnapTime(snapped ? snappedTime : null);
        setCurrentTime(snappedTime);
        if (playheadRef.current) {
          playheadRef.current.style.transform = `translateX(${snappedTime * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
        }
        const video = document.querySelector('video');
        if (video) video.currentTime = snappedTime;
      }

      if (resizingClip) {
        const x = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
        const newTime = Math.max(0, x / pixelsPerSecond);
        const { snapped, time: t } = getSnapMetadata(newTime);
        setActiveSnapTime(snapped ? t : null);
        if (resizingClip.type === 'vid') {
           const { vid_clip_start, vid_clip_duration } = useProjectStore.getState();
           const dur = vid_clip_duration || videoDuration;
           if (resizingClip.side === 'left') {
             updateConfig({ vid_clip_start: t, vid_clip_duration: Math.max(0.1, dur - (t - vid_clip_start)) });
           } else {
             updateConfig({ vid_clip_duration: Math.max(0.1, t - vid_clip_start) });
           }
        } else if (resizingClip.type === 'bgm') {
           const { bgm_timeline_start, bgm_clip_duration } = useProjectStore.getState();
           if (resizingClip.side === 'left') {
             updateConfig({ bgm_timeline_start: t, bgm_clip_duration: Math.max(0.1, bgm_clip_duration - (t - bgm_timeline_start)) });
           } else {
             updateConfig({ bgm_clip_duration: Math.max(0.1, t - bgm_timeline_start) });
           }
        }
      }

      if (draggingClip) {
        const x = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
        const newTime = Math.max(0, x / pixelsPerSecond);
        const { snapped, time: t } = getSnapMetadata(newTime);
        setActiveSnapTime(snapped ? t : null);
        if (draggingClip === 'vid') {
           updateConfig({ vid_clip_start: t });
        } else if (draggingClip === 'bgm') {
           updateConfig({ bgm_timeline_start: t });
        }
      }
    };

    const handlePointerUp = () => {
      setIsDraggingPlayhead(false);
      setResizingClip(null);
      setDraggingClip(null);
      setActiveSnapTime(null);
    };

    if (isDraggingPlayhead || resizingClip || draggingClip) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPlayhead, resizingClip, draggingClip, pixelsPerSecond]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
        handleSplitAtPlayhead();
        e.preventDefault();
      }

      if (e.key.toLowerCase() === 'q') {
         handleSplitLeft();
         e.preventDefault();
      }
      if (e.key.toLowerCase() === 'w') {
         handleSplitRight();
         e.preventDefault();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedClipId === 'bgm-main') {
          useProjectStore.getState().updateConfig({ bgm_enabled: false, bgm_file: '', selectedClipId: null });
          e.preventDefault();
          return;
        }
        if (selectedId !== null) {
          if (e.shiftKey) {
            useSubtitleStore.getState().deleteAndRippleSubtitle(selectedId);
          } else {
            useSubtitleStore.getState().deleteSegment(selectedId);
          }
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, selectedClipId, selectedId, segments]);

  const handleZoomIn = () => updateConfig({ timelineZoom: Math.min(10, timelineZoom + 0.5) });
  const handleZoomOut = () => updateConfig({ timelineZoom: Math.max(0.1, timelineZoom - 0.5) });

  const TRACK_HEIGHT = 50;

  return (
    <div className="tl" style={{ flexShrink: 0, height: '100%', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', userSelect: 'none' }}>
      
      <div className="tlhd" style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <span className="tltitle" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 16 }}>
           TIMELINE 
           <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>{formatTime(currentTime)}</span>
        </span>

        <div style={{ marginLeft: 20, display: 'flex', gap: 2, alignItems: 'center', background: 'var(--bg-primary)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
           <button className="tlb-split" onClick={handleSplitLeft} title="Split Left (Q)" disabled={!selectedClipId}>
              <ArrowLineLeft size={16} />
           </button>
           <button className="tlb-split" onClick={handleSplitAtPlayhead} title="Split (Ctrl+B)" disabled={!selectedClipId}>
              <Scissors size={16} />
           </button>
           <button className="tlb-split" onClick={handleSplitRight} title="Split Right (W)" disabled={!selectedClipId}>
              <ArrowLineRight size={16} />
           </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomOut}>-</button>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomIn}>+</button>
          <button className="tlb" style={{ height: 24, padding: '0 10px' }} onClick={() => updateConfig({ timelineZoom: 1 })}>fit</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
        
        {/* LEFT HEADERS: ONLY 3 TRACKS */}
        <div style={{ width: 70, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 20 }}>
            <div style={{ height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}></div>
            {[ 
              { id: 'vid', label: 'VID', color: 'var(--accent)' },
              { id: 'sub', label: 'SUB', color: 'var(--accent)' },
              { id: 'bgm', label: 'BGM', color: 'var(--success)' }
            ].map((tk) => (
              <div key={tk.id} style={{ height: TRACK_HEIGHT, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <div style={{ width: 6, height: 6, borderRadius: '50%', background: tk.color }}></div>
                   {tk.label}
                 </div>
              </div>
            ))}
        </div>

        <div 
          className="tlbody" 
          ref={containerRef}
          onPointerDown={(e) => {
            const tlbody = containerRef.current;
            if (!tlbody) return;
            const rect = tlbody.getBoundingClientRect();
            const pointerX = e.clientX - rect.left + tlbody.scrollLeft;
            const newTime = Math.max(0, (pointerX - TIMELINE_OFFSET_X) / pixelsPerSecond);
            const { time: snappedTime } = getSnapMetadata(newTime);
            const video = document.querySelector('video');
            if (video) video.currentTime = snappedTime;
            setCurrentTime(snappedTime);
            if (playheadRef.current) {
              playheadRef.current.style.transform = `translateX(${snappedTime * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
            }
            updateConfig({ selectedClipId: null });
            useSubtitleStore.getState().selectSegment(null);
          }}
          style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg-primary)', display: 'block' }}
        >
          <div style={{ width: timelineWidthPx, height: 1, pointerEvents: 'none' }} />

          <div style={{ position: 'sticky', left: 0, top: 0, width: viewportWidth || '100%', height: '100%', pointerEvents: 'none', display: 'block' }}>
            <TimelineRuler width={viewportWidth} pixelsPerSecond={pixelsPerSecond} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
            
            <div className="tllist" style={{ paddingTop: 26, height: '100%', pointerEvents: 'auto', position: 'relative' }}>
              
              {activeSnapTime !== null && (
                 <div style={{ position: 'absolute', top: 0, bottom: 0, left: activeSnapTime * pixelsPerSecond + TIMELINE_OFFSET_X - scrollLeft, width: '1px', background: 'rgba(225, 29, 72, 0.6)', zIndex: 50, pointerEvents: 'none' }} />
              )}

              {/* ROW 1: VIDEO (WITH EMBEDDED AUDIO) */}
              <div className="tltr" style={{ height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: -scrollLeft + TIMELINE_OFFSET_X, top: 0, width: timelineWidthPx, height: '100%' }}>
                  {currentVideoPath && (
                     <div 
                       onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'vid-main' }); setDraggingClip('vid'); }}
                       style={{ position: 'absolute', height: 42, top: 4, left: config.vid_clip_start * pixelsPerSecond, width: (config.vid_clip_duration || videoDuration || 1) * pixelsPerSecond, background: 'var(--accent-subtle)', borderRadius: 8, border: config.selectedClipId === 'vid-main' ? '2px solid #fff' : '1px solid var(--accent)', overflow: 'hidden', cursor: draggingClip === 'vid' ? 'grabbing' : 'grab' }}>
                         <VideoTrack videoPath={currentVideoPath} videoDuration={videoDuration} pixelsPerSecond={pixelsPerSecond} clipStart={config.vid_clip_start} scrollLeft={scrollLeft - (config.vid_clip_start * pixelsPerSecond)} viewportWidth={viewportWidth} />
                         <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }}>
                            <AudioTrack url={activeFile} pixelsPerSecond={pixelsPerSecond} color="var(--success)" scrollLeft={scrollLeft - (config.vid_clip_start * pixelsPerSecond)} viewportWidth={viewportWidth} />
                         </div>
                         <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'vid-main' }); setResizingClip({ type: 'vid', side: 'left' }); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize', zIndex: 10 }} />
                         <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'vid-main' }); setResizingClip({ type: 'vid', side: 'right' }); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize', zIndex: 10 }} />
                     </div>
                  )}
                </div>
              </div>

              {/* ROW 2: SUBTITLES */}
              <div className="tltr" style={{ height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', left: -scrollLeft + TIMELINE_OFFSET_X, top: 0, width: timelineWidthPx, height: '100%', paddingTop: 4 }}>
                   <SubtitleTrack pixelsPerSecond={pixelsPerSecond} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
                 </div>
              </div>

              {/* ROW 3: BGM */}
              <div className="tltr" style={{ height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', left: -scrollLeft + TIMELINE_OFFSET_X, top: 0, width: timelineWidthPx, height: '100%' }}>
                   {bgm_enabled && bgm_file && (
                      <div 
                        onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'bgm-main' }); setDraggingClip('bgm'); }}
                        style={{ position: 'absolute', top: 4, bottom: 4, left: config.bgm_timeline_start * pixelsPerSecond, width: (config.bgm_clip_duration || 200 / pixelsPerSecond) * pixelsPerSecond, background: 'var(--bg-surface)', borderRadius: 8, border: config.selectedClipId === 'bgm-main' ? '2px solid #fff' : '1px solid var(--accent)', display: 'flex', alignItems: 'center', cursor: draggingClip === 'bgm' ? 'grabbing' : 'grab' }}
                      >
                           <AudioTrack url={bgm_file} pixelsPerSecond={pixelsPerSecond} color="var(--accent)" scrollLeft={scrollLeft - (config.bgm_timeline_start * pixelsPerSecond)} viewportWidth={viewportWidth} />
                           <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'bgm-main' }); setResizingClip({ type: 'bgm', side: 'left' }); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize' }} />
                           <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'bgm-main' }); setResizingClip({ type: 'bgm', side: 'right' }); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize' }} />
                      </div>
                   )}
                 </div>
              </div>
            </div>

            {/* PLAYHEAD */}
            <div 
              className="playhead-fixed" 
              ref={playheadRef}
              onPointerDown={(e) => { e.stopPropagation(); setIsDraggingPlayhead(true); }}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, marginLeft: -7, zIndex: 100, pointerEvents: 'auto', cursor: 'ew-resize', display: 'flex', justifyContent: 'center', transform: `translateX(${TIMELINE_OFFSET_X - scrollLeft}px)`, transition: isDraggingPlayhead ? 'none' : 'transform 0.05s linear' }}
            >
              <div style={{ width: 1, height: '100%', background: '#e11d48', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: -4, width: 0, height: 0, borderLeft: '4.5px solid transparent', borderRight: '4.5px solid transparent', borderTop: '7px solid #e11d48' }} />
                <div style={{ position: 'absolute', top: 7, left: -4, width: 9, height: 2, background: '#e11d48' }} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
