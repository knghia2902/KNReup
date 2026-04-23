import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { Scissors, ArrowLineLeft, ArrowLineRight, Trash, MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { AudioTrack } from './AudioTrack';
import { VideoTrack } from './VideoTrack';
import { SubtitleTrack } from './SubtitleTrack';
import { formatTime, formatTimeShort } from '../../utils/time';
import { AudioMixer } from '../../lib/audioMixer';

// Định nghĩa trực tiếp ở đây để đảm bảo không bị lỗi import/cache
function formatTimeLocal(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimeShortLocal(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TIMELINE_OFFSET_X = 4;

const TimelineRuler = memo(({ width, pixelsPerSecond, scrollLeft, viewportWidth }: any) => {
  // Nice intervals in seconds
  const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 14400, 28800, 43200, 86400];
  const minSpacing = 100; // pixels
  
  let labelInterval = niceIntervals[niceIntervals.length - 1];
  for (const interval of niceIntervals) {
    if (interval * pixelsPerSecond >= minSpacing) {
      labelInterval = interval;
      break;
    }
  }

  const startIdx = Math.floor(scrollLeft / pixelsPerSecond / labelInterval);
  const endIdx = Math.ceil((scrollLeft + viewportWidth) / pixelsPerSecond / labelInterval);
  
  const labels = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const time = i * labelInterval;
    const x = time * pixelsPerSecond;
    labels.push({
      id: i,
      text: formatTimeShortLocal(time),
      style: { position: 'absolute', left: x + TIMELINE_OFFSET_X, top: 4, fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }
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
  const { timelineZoom, updateConfig, audio_enabled, audio_file, snapEnabled, snapThreshold, selectedClipId } = config;
  const { videoDuration, segments, activeFile, selectedId } = useSubtitleStore();

  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [resizingClip, setResizingClip] = useState<{ type: 'vid' | 'audio' | 'sub', side: 'left' | 'right' } | null>(null);
  const [draggingClip, setDraggingClip] = useState<'vid' | 'audio' | null>(null);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);

  const pixelsPerSecond = Math.max(0.0001, 50 * timelineZoom);
  const currentVideoPath = activeFile || (filePaths.length > 0 ? filePaths[0] : null);
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  
  // Use config duration if set, otherwise fallback to store video duration
  const activeDuration = config.vid_clip_duration || videoDuration || 0;
  
  // AUTO-FIX: If the cached clip duration is shorter than the actual video, 
  // and we just loaded the metadata, expand it to full.
  useEffect(() => {
    if (videoDuration > 1) {
       // If config duration is 0, smaller than actual, or non-finite, reset to full
       if (!config.vid_clip_duration || config.vid_clip_duration < videoDuration - 0.1 || !isFinite(config.vid_clip_duration)) {
          console.log('[timeline-v3] Expanding clip duration to full:', videoDuration);
          updateConfig({ vid_clip_duration: videoDuration, vid_clip_start: 0 });
       }
    }
  }, [videoDuration]);

  const rawDuration = Math.max(activeDuration, maxSubTime, 1);
  const safeDuration = isFinite(rawDuration) ? rawDuration : 3600;

  // CapCut logic: Minimum zoom should be exactly what's needed to fit the whole video on screen
  // Reduced by factor of 5 to allow more zoom out as requested by user
  const minZoom = useMemo(() => {
    if (safeDuration > 0 && viewportWidth > 0) {
      return ((viewportWidth - 40) / (safeDuration * 50)) * 0.2;
    }
    return 0.0001;
  }, [safeDuration, viewportWidth]);

  // Ensure current zoom is never less than minZoom
  useEffect(() => {
    if (timelineZoom < minZoom && minZoom > 0) {
      updateConfig({ timelineZoom: minZoom });
    }
  }, [minZoom, timelineZoom, updateConfig]);

  // Log for debugging duration issues
  useEffect(() => {
    console.log('[timeline-v4] videoDuration from store:', videoDuration);
    console.log('[timeline-v4] vid_clip_duration from config:', config.vid_clip_duration);
    console.log('[timeline-v4] activeDuration calculated:', activeDuration);
  }, [videoDuration, config.vid_clip_duration]);

  // Cap at 30M pixels which is safe for most browsers
  const timelineWidthPx = Math.min(safeDuration * pixelsPerSecond + (500 * pixelsPerSecond), 30000000);

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
      config.splitLeft(currentTime, activeDuration);
    }
  };

  const handleSplitRight = () => {
    if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
      const seg = segments.find(s => s.id === selectedId);
      if (seg && currentTime > seg.start && currentTime < seg.end) {
        useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
      }
    } else {
      config.splitRight(currentTime, activeDuration);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedClipId === 'audio-main') {
      updateConfig({ audio_enabled: false, audio_file: '', selectedClipId: null });
    } else if (selectedId !== null) {
      useSubtitleStore.getState().deleteSegment(selectedId);
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
    if (audio_enabled) snapPoints.push(config.audio_timeline_start);
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
        // Cancel TTS khi scrub — im lặng
        AudioMixer.cancelTTS();
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
        } else if (resizingClip.type === 'audio') {
           const { audio_timeline_start, audio_clip_duration } = useProjectStore.getState();
           if (resizingClip.side === 'left') {
             updateConfig({ audio_timeline_start: t, audio_clip_duration: Math.max(0.1, audio_clip_duration - (t - audio_timeline_start)) });
           } else {
             updateConfig({ audio_clip_duration: Math.max(0.1, t - audio_timeline_start) });
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
        } else if (draggingClip === 'audio') {
           updateConfig({ audio_timeline_start: t });
        }
      }
    };

    const handlePointerUp = () => {
      setIsDraggingPlayhead(false);
      setResizingClip(null);
      setDraggingClip(null);
      setActiveSnapTime(null);
      // Re-schedule TTS nếu video đang play sau khi stop drag
      const video = document.querySelector('video');
      if (video && !video.paused) {
        AudioMixer.scheduleTTS(
          useSubtitleStore.getState().segments,
          video.currentTime
        );
      }
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
        if (selectedClipId === 'audio-main') {
          useProjectStore.getState().updateConfig({ audio_enabled: false, audio_file: '', selectedClipId: null });
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
  const handleZoomOut = () => updateConfig({ timelineZoom: Math.max(minZoom, timelineZoom - 0.5) });

  const handleFitToView = () => {
    if (minZoom > 0) {
      updateConfig({ timelineZoom: minZoom }); 
    } else {
      updateConfig({ timelineZoom: 1 });
    }
  };

  const TRACK_HEIGHT = 50;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const currentZoom = useProjectStore.getState().timelineZoom;
        const newZoom = Math.max(minZoom, Math.min(10, currentZoom + (currentZoom * delta * 2)));
        updateConfig({ timelineZoom: newZoom });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [updateConfig]);

  return (
    <div className="tl" style={{ flexShrink: 0, height: '100%', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', userSelect: 'none' }}>
      
      <div className="tlhd" style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        
        {/* TOOLBAR: LEFT GROUP */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: 'var(--bg-primary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
           <button className="tlb-split" onClick={handleSplitAtPlayhead} title="Split (Ctrl+B)" disabled={!selectedClipId}>
              <Scissors size={16} weight="regular" />
           </button>
           <button className="tlb-split" onClick={handleSplitLeft} title="Split Left (Q)" disabled={!selectedClipId}>
              <ArrowLineLeft size={16} weight="regular" />
           </button>
           <button className="tlb-split" onClick={handleSplitRight} title="Split Right (W)" disabled={!selectedClipId}>
              <ArrowLineRight size={16} weight="regular" />
           </button>
           <button className="tlb-split" onClick={() => updateConfig({ vid_clip_duration: videoDuration })} title="Reset to Full Duration" disabled={!videoDuration}>
              <ArrowsOut size={16} weight="regular" />
           </button>
           <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 4px' }} />
           <button className="tlb-split" onClick={handleDeleteSelected} title="Delete (Del)" disabled={selectedClipId !== 'audio-main' && selectedId === null}>
              <Trash size={16} weight="regular" />
           </button>
        </div>

        {/* ZOOM CONTROLS: RIGHT GROUP */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="tlb-split" onClick={handleZoomOut} title="Zoom Out">
            <MagnifyingGlassMinus size={17} weight="regular" />
          </button>
          
          <div 
            style={{ width: 80, height: 16, display: 'flex', alignItems: 'center', cursor: 'pointer', margin: '0 4px' }}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const updateZoom = (clientX: number) => {
                const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                let newZoom;
                if (pct <= 0.5) {
                  // Map [0, 0.5] to [minZoom, 1] logarithmically
                  const factor = pct / 0.5;
                  newZoom = minZoom * Math.pow(1 / minZoom, factor);
                } else {
                  // Map [0.5, 1] to [1, 10] logarithmically
                  const factor = (pct - 0.5) / 0.5;
                  newZoom = 1 * Math.pow(10 / 1, factor);
                }
                updateConfig({ timelineZoom: Math.max(minZoom, Math.min(10, newZoom)) });
              };
              updateZoom(e.clientX);
              const onMove = (me: PointerEvent) => updateZoom(me.clientX);
              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
          >
            <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)', borderRadius: 2, position: 'relative' }}>
               {/* Logarithmic-like mapping for better precision at low zoom levels */}
               <div style={{ 
                 position: 'absolute', 
                 left: `${timelineZoom <= 1 
                   ? (Math.log10(timelineZoom / minZoom) / Math.log10(1 / minZoom)) * 50 
                   : 50 + (Math.log10(timelineZoom) / Math.log10(10)) * 50}%`, 
                 top: '50%', 
                 transform: 'translate(-50%, -50%)', 
                 width: 10, 
                 height: 10, 
                 borderRadius: '50%', 
                 background: 'var(--accent)', 
                 border: '2px solid #fff',
                 pointerEvents: 'none'
               }} />
            </div>
          </div>

          <button className="tlb-split" onClick={handleZoomIn} title="Zoom In">
            <MagnifyingGlassPlus size={17} weight="regular" />
          </button>
          
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />
          
          <button className="tlb-split" onClick={handleFitToView} title="Fit to View">
            <ArrowsOut size={17} weight="regular" />
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
        
        {/* LEFT HEADERS: 3 TRACKS WITH MINI VOLUME INDICATORS */}
        <div style={{ width: 70, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 20 }}>
            <div style={{ height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}></div>
            {[ 
              { id: 'vid', label: 'VID', color: 'var(--accent)', volumeKey: 'original_volume' as const, muteCheck: () => config.audio_mix_mode === 'replace' },
              { id: 'sub', label: 'TTS', color: 'var(--warning, #f59e0b)', volumeKey: 'volume' as const, muteCheck: () => !config.dubbing_enabled },
              { id: 'audio', label: 'BGM', color: 'var(--success)', volumeKey: 'audio_volume' as const, muteCheck: () => !config.audio_enabled }
            ].map((tk) => (
              <div key={tk.id} style={{ height: TRACK_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', borderBottom: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                   <div style={{ width: 6, height: 6, borderRadius: '50%', background: tk.color }}></div>
                   {tk.label}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                   {tk.muteCheck() ? (
                     <svg width="12" height="12" viewBox="0 0 256 256" fill="none" style={{ opacity: 0.4 }}>
                       <path d="M228.44,89.34l-48,48a4,4,0,0,1-5.66-5.66L222.34,84.12a4,4,0,1,1,5.66,5.66ZM160,84.12,112.44,131.68a4,4,0,0,0,5.66,5.66L160,95.78Z" fill="var(--text-muted)"/>
                       <path d="M155.52,24.81a4,4,0,0,0-4.23.42L84,76H40A12,12,0,0,0,28,88v80a12,12,0,0,0,12,12H84l67.29,50.77A4,4,0,0,0,156,228V32A4,4,0,0,0,155.52,24.81Z" fill="var(--text-muted)"/>
                     </svg>
                   ) : (
                     <>
                       <svg width="12" height="12" viewBox="0 0 256 256" fill="none" style={{ opacity: 0.6 }}>
                         <path d="M155.52,24.81a4,4,0,0,0-4.23.42L84,76H40A12,12,0,0,0,28,88v80a12,12,0,0,0,12,12H84l67.29,50.77A4,4,0,0,0,156,228V32A4,4,0,0,0,155.52,24.81Z" fill={tk.color}/>
                         <path d="M192,128a31.82,31.82,0,0,1-6.51,19.34,4,4,0,1,1-6.31-4.9A23.88,23.88,0,0,0,184,128a24,24,0,0,0-4.87-14.5,4,4,0,0,1,6.33-4.88A31.88,31.88,0,0,1,192,128Z" fill={tk.color}/>
                       </svg>
                       <div style={{ width: 20, height: 3, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                         <div style={{ width: `${((config[tk.volumeKey] as number) || 0) * 100}%`, height: '100%', background: tk.color, borderRadius: 1, transition: 'width 0.1s' }} />
                       </div>
                     </>
                   )}
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
                 <div style={{ position: 'absolute', top: 0, bottom: 0, left: activeSnapTime * pixelsPerSecond + TIMELINE_OFFSET_X - scrollLeft, width: '1px', background: '#22c55e', zIndex: 50, pointerEvents: 'none' }} />
              )}

              {/* ROW 1: VIDEO (WITH EMBEDDED AUDIO) */}
              <div className="tltr" style={{ height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: -scrollLeft + TIMELINE_OFFSET_X, top: 0, width: timelineWidthPx, height: '100%' }}>
                  {currentVideoPath && (
                     <div 
                       onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'vid-main' }); setDraggingClip('vid'); }}
                       style={{ position: 'absolute', height: 42, top: 4, left: config.vid_clip_start * pixelsPerSecond, width: activeDuration * pixelsPerSecond, background: 'var(--accent-subtle)', borderRadius: 8, border: config.selectedClipId === 'vid-main' ? '2px solid #fff' : '1px solid var(--accent)', overflow: 'hidden', cursor: draggingClip === 'vid' ? 'grabbing' : 'grab' }}>
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

              {/* ROW 3: AUDIO */}
              <div className="tltr" style={{ height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', left: -scrollLeft + TIMELINE_OFFSET_X, top: 0, width: timelineWidthPx, height: '100%' }}>
                   {audio_enabled && audio_file && (
                      <div 
                        onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'audio-main' }); setDraggingClip('audio'); }}
                        style={{ position: 'absolute', top: 4, bottom: 4, left: config.audio_timeline_start * pixelsPerSecond, width: (config.audio_clip_duration || 200 / pixelsPerSecond) * pixelsPerSecond, background: 'var(--bg-surface)', borderRadius: 8, border: config.selectedClipId === 'audio-main' ? '2px solid #fff' : '1px solid var(--accent)', display: 'flex', alignItems: 'center', cursor: draggingClip === 'audio' ? 'grabbing' : 'grab' }}
                      >
                           <AudioTrack url={audio_file} pixelsPerSecond={pixelsPerSecond} color="var(--accent)" scrollLeft={scrollLeft - (config.audio_timeline_start * pixelsPerSecond)} viewportWidth={viewportWidth} />
                           <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'audio-main' }); setResizingClip({ type: 'audio', side: 'left' }); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize' }} />
                           <div onPointerDown={(e) => { e.stopPropagation(); updateConfig({ selectedClipId: 'audio-main' }); setResizingClip({ type: 'audio', side: 'right' }); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent)', cursor: 'ew-resize' }} />
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
