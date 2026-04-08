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
  const { timelineZoom, updateConfig } = config;
  const { videoDuration, segments } = useSubtitleStore();
  
  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const pixelsPerSecond = 50 * timelineZoom;
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  // Chiều dài timeline = Độ dài bự nhất giữa Video hoặc mốc cuối của Subtitle + 20 giây padding
  const timelineWidthPx = Math.max(videoDuration, maxSubTime) * pixelsPerSecond + (20 * pixelsPerSecond);

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
            
            // Bám đuổi camera (scroll follow)
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

  return (
    <div className="tl" style={{ flexShrink: 0, height: 250, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: '#ffffff', userSelect: 'none' }}>
      
      {/* HEADER */}
      <div className="tlhd" style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)' }}>
        <span className="tltitle" style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 16 }}>
           TIMELINE 
           <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', letterSpacing: '1px' }}>{formatTime(currentTime)}</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomOut}>-</button>
          <button className="tlb" style={{ width: 28, height: 24, padding: 0 }} onClick={handleZoomIn}>+</button>
          <button className="tlb" style={{ height: 24, padding: '0 10px' }} onClick={() => updateConfig({ timelineZoom: 1 })}>fit</button>
        </div>
      </div>
      
      {/* 2-PANE BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANE: TRACK HEADERS */}
        <div style={{ width: 70, flexShrink: 0, borderRight: '1px solid var(--border)', background: '#f8fafc', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
           <div style={{ height: 26, borderBottom: '1px solid var(--border)', background: '#fff' }}></div>
           {[ 
             { id: 'vid', label: 'VID', color: '#3b82f6' },
             { id: 'tts', label: 'TTS', color: '#10b981' },
             { id: 'sub', label: 'SUB', color: '#f97316' },
             { id: 'bgm', label: 'BGM', color: '#9ca3af' }
           ].map((tk, idx) => (
             <div key={tk.id} style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: idx < 3 ? '1px solid var(--border)' : 'none', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: tk.color, marginRight: 8, flexShrink: 0 }}></div>
                {tk.label}
             </div>
           ))}
        </div>

        {/* RIGHT PANE: TIMELINE TRACKS */}
        <div className="tlbody" ref={containerRef} style={{ display: 'block', position: 'relative', overflowX: 'auto', overflowY: 'hidden', flex: 1, background: '#ffffff' }}
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
           <div style={{ width: `${timelineWidthPx}px`, minWidth: '100%', height: '100%', position: 'relative', flexShrink: 0 }}>
             
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

             <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
               
               {/* Timeline Ruler Row (Placeholder) */}
               <div style={{ height: 26, borderBottom: '1px solid var(--border)', background: '#f8fafc' }}></div>

               {/* VID Track */}
               <div className="tltr" style={{ height: 42, borderBottom: '1px solid var(--border)', position: 'relative', background: 'transparent' }}>
                  <div style={{ position: 'absolute', top: 6, bottom: 6, left: 4, width: `${videoDuration * pixelsPerSecond}px`, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                     <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.35 }}>
                        <VideoTrack videoPath={filePaths.length > 0 ? filePaths[0] : null} videoDuration={videoDuration} pixelsPerSecond={pixelsPerSecond} />
                     </div>
                     {filePaths.length > 0 && (
                        <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: '#334155', fontWeight: 600, zIndex: 10, background: 'rgba(241,245,249,0.95)', padding: '2px 8px', borderRadius: 5 }}>
                           <div style={{ width: 3, height: 12, background: '#94a3b8', marginRight: 8, borderRadius: 2 }}></div>
                           {filePaths[0].split(/[\\/]/).pop()}
                        </div>
                     )}
                     <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.6, pointerEvents: 'none', mixBlendMode: 'multiply' }}>
                        <AudioTrack url={filePaths.length > 0 ? filePaths[0] : null} pixelsPerSecond={pixelsPerSecond} color="#94a3b8" />
                     </div>
                  </div>
               </div>

               {/* TTS Track */}
               <div className="tltr" style={{ height: 42, borderBottom: '1px solid var(--border)', position: 'relative', background: 'transparent' }}>
                  <div style={{ position: 'absolute', top: 6, bottom: 6, left: 4, minWidth: `${videoDuration * pixelsPerSecond}px`, width: 'max-content', background: '#ecfdf5', borderRadius: 8, overflow: 'hidden', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center' }}>
                     <div style={{ flexShrink: 0, height: '100%', opacity: 0.9 }}>
                        <AudioTrack url={filePaths.length > 0 ? filePaths[0] : null} pixelsPerSecond={pixelsPerSecond} color="#10b981" />
                     </div>
                     {filePaths.length > 0 && (
                        <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: '#059669', fontWeight: 600, zIndex: 10, background: 'rgba(236,253,245,0.95)', padding: '2px 8px', borderRadius: 5 }}>
                           <div style={{ width: 3, height: 12, background: '#34d399', marginRight: 8, borderRadius: 2 }}></div>
                           tts_output_vi.wav
                        </div>
                     )}
                  </div>
               </div>

               {/* SUB Track */}
               <div className="tltr" style={{ height: 42, borderBottom: '1px solid var(--border)', position: 'relative', background: 'transparent' }}>
                  <SubtitleTrack pixelsPerSecond={pixelsPerSecond} />
               </div>

               {/* BGM Track */}
               <div className="tltr" style={{ height: 42, position: 'relative', background: 'transparent' }}>
                  <div style={{ position: 'absolute', top: 6, bottom: 6, left: 4, minWidth: `400px`, width: 'max-content', background: '#f8fafc', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                     <div style={{ flexShrink: 0, height: '100%', opacity: 0.8 }}>
                        {config.bgm_enabled && config.bgm_file ? (
                          <AudioTrack url={config.bgm_file} pixelsPerSecond={pixelsPerSecond} color="#94a3b8" />
                        ) : null}
                     </div>
                     {config.bgm_enabled && config.bgm_file && (
                        <div style={{ position: 'absolute', left: 8, display: 'flex', alignItems: 'center', fontSize: '11px', color: '#64748b', fontWeight: 600, zIndex: 10, background: 'rgba(248,250,252,0.95)', padding: '2px 8px', borderRadius: 5 }}>
                           <div style={{ width: 3, height: 12, background: '#cbd5e1', marginRight: 8, borderRadius: 2 }}></div>
                           {config.bgm_file.split(/[\\/]/).pop()}
                        </div>
                     )}
                  </div>
               </div>

             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
