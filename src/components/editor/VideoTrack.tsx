import { useEffect, useRef, useState } from 'react';

interface VideoTrackProps {
  videoPath: string | null;
  videoDuration: number;
  pixelsPerSecond: number;
}

export function VideoTrack({ videoPath, videoDuration, pixelsPerSecond }: VideoTrackProps) {
  // block duration = 5 seconds
  const blockDuration = 5;
  const numBlocks = Math.ceil(videoDuration / blockDuration);
  const blocks = Array.from({ length: numBlocks }, (_, i) => i * blockDuration);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
      {blocks.map(time => (
        <ThumbnailBlock 
          key={time} 
          time={time} 
          videoPath={videoPath} 
          width={blockDuration * pixelsPerSecond} 
        />
      ))}
    </div>
  );
}

function ThumbnailBlock({ time, videoPath, width }: { time: number, videoPath: string | null, width: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoPath) return;
    
    // Đừng load thumbnail nếu timeline bị zoom out quá nhỏ lẻ (tránh render 1000 tấm ảnh 1 lúc)
    if (width < 3) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !src) {
          // Gắn cache-buster nhẹ bằng encodeURIComponent(videoPath)
          const url = `http://localhost:8008/api/pipeline/thumbnail?video_path=${encodeURIComponent(videoPath)}&time=${time}`;
          setSrc(url);
          observer.disconnect();
        }
      });
    }, {
      root: document.querySelector('.tlbody'), // Vùng scroll ngang timeline
      rootMargin: '300px', // Fetch trước khi lọt vào view 300px
      threshold: 0
    });

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => observer.disconnect();
  }, [videoPath, time, src, width]);

  return (
    <div 
      ref={blockRef} 
      style={{ 
        width: `${width}px`, 
        height: '100%', 
        overflow: 'hidden', 
        borderRight: '1px solid rgba(0,0,0,0.5)',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.1)'
      }}
    >
      {src && (
         <img 
           src={src} 
           alt={`thumb-${time}`} 
           style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} 
           loading="lazy" 
           decoding="async" 
         />
      )}
    </div>
  );
}
