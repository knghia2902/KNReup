import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { AudioTrack } from './AudioTrack';
import { VideoTrack } from './VideoTrack';
import { SubtitleTrack } from './SubtitleTrack';

interface TimelineProps {
  filePaths: string[];
}

function formatTime(secs: number) {
  if (isNaN(secs)) return '00:00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const f = Math.floor((secs % 1) * 30); // 30fps frames
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}:${f.toString().padStart(2,'0')}`;
}

export function Timeline({ filePaths }: TimelineProps) {
  const config = useProjectStore();
  const { timelineZoom, updateConfig, bgm_enabled, bgm_file } = config;
  const { videoDuration, segments, activeFile } = useSubtitleStore();
  
  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const pixelsPerSecond = 50 * timelineZoom;
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  
  // Xác định file thực tế để hiển thị (ưu tiên activeFile, fallback về file đầu tiên trong list)
  const currentVideoPath = activeFile || (filePaths.length > 0 ? filePaths[0] : null);

  // Đảm bảo duration không bao giờ bằng 0 để tránh width = 0
  const safeDuration = Math.max(videoDuration || 0, maxSubTime, 1);
  const timelineWidthPx = safeDuration * pixelsPerSecond + (20 * pixelsPerSecond);

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
            playheadRef.current.style.transform = `translateX(${xPos}px)`;
            
            if (containerRef.current) {
              const container = containerRef.current;
              const rect = container.getBoundingClientRect();
              const playheadViewportX = xPos - container.scrollLeft;
              if (playheadViewportX > rect.width * 0.8) {
                 container.scrollLeft = xPos - rect.width * 0.8;
              }
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    
    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pixelsPerSecond, isDraggingPlayhead]);

  // Handle Playhead Dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingPlayhead) return;
      const tlbody = containerRef.current;
      if (!tlbody) return;
      
      const rect = tlbody.getBoundingClientRect();
      const pointerX = e.clientX - rect.left + tlbody.scrollLeft;
      const newTime = Math.max(0, (pointerX - 4) / pixelsPerSecond);
      
      setCurrentTime(newTime);
      if (playheadRef.current) {
        playheadRef.current.style.transform = `translateX(${newTime * pixelsPerSecond}px)`;
      }
      
      const video = document.querySelector('video');
      if (video) video.currentTime = newTime;
    };
    
    const handlePointerUp = () => setIsDraggingPlayhead(false);

    if (isDraggingPlayhead) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPlayhead, pixelsPerSecond]);

  const handleZoomIn = () => updateConfig({ timelineZoom: Math.min(10, timelineZoom + 0.5) });
  const handleZoomOut = () => updateConfig({ timelineZoom: Math.max(0.1, timelineZoom - 0.5) });

  // Handle Ctrl + Wheel Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = useProjectStore.getState().timelineZoom;
        // Scale deltaY down by a factor of 1000 so one mouse tick (100) zooms smoothly by 0.1
        const zoomDelta = e.deltaY * -0.001;
        updateConfig({ 
          timelineZoom: Math.max(0.1, Math.min(10, currentZoom + zoomDelta)) 
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [timelineZoom, updateConfig]);

  const TRACK_HEIGHT = 50; 

  return (
    <div className="tl" style={{ flexShrink: 0, height: '100%', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', userSelect: 'none' }}>
      
      {/* HEADER */}
      <div className="tlhd" style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <span className="tltitle" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 16 }}>
           TIMELINE 
           <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>{formatTime(currentTime)}</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomOut}>-</button>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomIn}>+</button>
          <button className="tlb" style={{ height: 24, padding: '0 10px' }} onClick={() => updateConfig({ timelineZoom: 1 })}>fit</button>
        </div>
      </div>
      
      {/* 2-PANE BODY */}
      <div style={{ display: 'flex', flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', alignItems: 'flex-start' }}>
        
        {/* LEFT PANE: TRACK HEADERS */}
        <div style={{ width: 70, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'relative', zIndex: 10, alignSelf: 'stretch' }}>
           <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}></div>
           {[ 
             { id: 'vid', label: 'VID', color: 'var(--accent)', top: 26 },
             { id: 'tts', label: 'TTS', color: 'var(--success)', top: 76 },
             { id: 'sub', label: 'SUB', color: 'var(--accent)', top: 126 },
             { id: 'bgm', label: 'BGM', color: 'var(--text-muted)', top: 176 }
           ].map((tk) => (
             <div key={tk.id} style={{ position: 'absolute', top: tk.top, left: 0, width: '100%', height: TRACK_HEIGHT, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: tk.color, flexShrink: 0 }}></div>
                  {tk.label}
                </div>
             </div>
           ))}
        </div>

        {/* RIGHT PANE: TIMELINE TRACKS */}
        <div className="tlbody" ref={containerRef} style={{ display: 'block', position: 'relative', overflowX: 'auto', overflowY: 'hidden', flex: 1, background: 'var(--bg-primary)', alignSelf: 'stretch' }}
             onPointerDown={(e) => {
               const tlbody = containerRef.current;
               if (!tlbody) return;
               const rect = tlbody.getBoundingClientRect();
               const pointerX = e.clientX - rect.left + tlbody.scrollLeft;
               const newTime = Math.max(0, (pointerX - 4) / pixelsPerSecond);
               const video = document.querySelector('video');
               if (video) video.currentTime = newTime;
               setCurrentTime(newTime);
               if (playheadRef.current) {
                 playheadRef.current.style.transform = `translateX(${newTime * pixelsPerSecond}px)`;
               }
             }}>
           <div style={{ width: `${timelineWidthPx}px`, minWidth: '100%', height: 'max-content', minHeight: '100%', position: 'relative', flexShrink: 0 }}>
             
             {/* Playhead */}
             <div className="playhead-fixed" ref={playheadRef} style={{ 
               position: 'absolute', top: 0, bottom: 0, left: 4, width: 14, marginLeft: -7, zIndex: 100,
               transform: 'translateX(0px)', transition: isDraggingPlayhead ? 'none' : 'transform 0.05s linear',
               cursor: 'ew-resize', pointerEvents: 'auto', display: 'flex', justifyContent: 'center'
             }} onPointerDown={(e) => { e.stopPropagation(); setIsDraggingPlayhead(true); }}>
               <div style={{ width: 1, height: '100%', background: '#e11d48', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 0, left: -4, width: 0, height: 0, borderLeft: '4.5px solid transparent', borderRight: '4.5px solid transparent', borderTop: '7px solid #e11d48' }}></div>
                 <div style={{ position: 'absolute', top: 7, left: -4, width: 9, height: 2, background: '#e11d48' }}></div>
               </div>
             </div>

             <div style={{ position: 'relative', width: '100%', height: '226px' }}>
               
               {/* Timeline Ruler Row (Placeholder) */}
               <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 10 }}></div>

               {/* VID Track */}
               <div className="tltr" style={{ position: 'absolute', top: 26, left: 0, width: '100%', height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                  {currentVideoPath && (
                    <div style={{ position: 'absolute', height: 42, left: 4, width: `${Math.max(videoDuration || 1, 1) * pixelsPerSecond}px`, background: 'var(--accent-subtle)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', zIndex: 5 }}>
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.8 }}>
                          <VideoTrack videoPath={currentVideoPath} videoDuration={videoDuration || 1} pixelsPerSecond={pixelsPerSecond} />
                       </div>
                       <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600, zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 5 }}>
                          <div style={{ width: 3, height: 12, background: 'var(--accent)', marginRight: 8, borderRadius: 2 }}></div>
                          {currentVideoPath.split(/[\\/]/).pop()}
                       </div>
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.6, pointerEvents: 'none', mixBlendMode: 'screen' }}>
                          <AudioTrack url={currentVideoPath} pixelsPerSecond={pixelsPerSecond} color="var(--accent)" />
                       </div>
                    </div>
                  )}
               </div>

               {/* TTS Track */}
               <div className="tltr" style={{ position: 'absolute', top: 76, left: 0, width: '100%', height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', height: 42, left: 4, minWidth: '100px', width: `${Math.max(videoDuration || 1, 1) * pixelsPerSecond}px`, background: 'var(--success-subtle, rgba(5,150,105,0.08))', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', zIndex: 5 }}>
                     <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: 'var(--success)', fontWeight: 600, zIndex: 10, background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 5 }}>
                        <div style={{ width: 3, height: 12, background: 'var(--success)', marginRight: 8, borderRadius: 2 }}></div>
                        tts_output_vi.wav
                     </div>
                  </div>
               </div>

               {/* SUB Track */}
               <div className="tltr" style={{ position: 'absolute', top: 126, left: 0, width: '100%', height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                  <div style={{ height: 42, width: '100%', zIndex: 5, position: 'relative' }}>
                     <SubtitleTrack pixelsPerSecond={pixelsPerSecond} />
                  </div>
               </div>

               {/* BGM Track */}
               <div className="tltr" style={{ position: 'absolute', top: 176, left: 0, width: '100%', height: TRACK_HEIGHT, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                  {bgm_enabled && bgm_file && (
                     <div style={{ position: 'absolute', height: 42, left: 4, minWidth: '200px', width: 'max-content', background: 'var(--bg-surface)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', zIndex: 5 }}>
                        <div style={{ flexShrink: 0, height: '100%', opacity: 0.8 }}>
                           <AudioTrack url={bgm_file} pixelsPerSecond={pixelsPerSecond} color="var(--accent)" />
                        </div>
                        <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: 'var(--accent)', fontWeight: 600, zIndex: 10, background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 5 }}>
                           <div style={{ width: 3, height: 12, background: 'var(--accent)', marginRight: 8, borderRadius: 2 }}></div>
                           {bgm_file.split(/[\\/]/).pop()}
                        </div>
                     </div>
                  )}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
