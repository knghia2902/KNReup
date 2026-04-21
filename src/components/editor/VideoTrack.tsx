import { useEffect, useRef, useState, useMemo, memo } from 'react';

interface VideoTrackProps {
  videoPath: string;
  videoDuration: number;
  pixelsPerSecond: number;
  clipStart?: number;
  scrollLeft: number;
  viewportWidth: number;
}

export const VideoTrack = memo(({ 
  videoPath, 
  videoDuration, 
  pixelsPerSecond, 
  clipStart = 0,
  scrollLeft,
  viewportWidth
}: VideoTrackProps) => {
  // Ensure we never have more than ~500 blocks to avoid observer/DOM overload
  const blockDuration = useMemo(() => Math.max(2, videoDuration / 500), [videoDuration]);
  
  const blocks = useMemo(() => {
    const numBlocks = Math.ceil(videoDuration / blockDuration);
    return Array.from({ length: numBlocks }, (_, i) => i * blockDuration);
  }, [videoDuration, blockDuration]);

  // Virtualization is based on TIMELINE time.
  // The VideoTrack component renders from its own local 0..duration.
  const viewportStart = Math.max(0, scrollLeft / pixelsPerSecond);
  const viewportEnd = viewportStart + (viewportWidth / pixelsPerSecond);

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', gap: 0, width: videoDuration * pixelsPerSecond }}>
      {blocks.map((blockStartTime, i) => {
        const blockEndTime = blockStartTime + blockDuration;
        
        // Visibility check relative to timeline viewport
        const isVisible = blockEndTime > viewportStart && blockStartTime < viewportEnd;
        if (!isVisible) return <div key={i} style={{ width: blockDuration * pixelsPerSecond, height: '100%', flexShrink: 0 }} />;

        return (
          <ThumbnailBlock
            key={i}
            videoPath={videoPath}
            time={blockStartTime + clipStart} // Apply clip offset to the thumbnail extractor
            width={blockDuration * pixelsPerSecond}
          />
        );
      })}
    </div>
  );
});

const ThumbnailBlock = memo(({ time, videoPath, width }: { time: number, videoPath: string | null, width: number }) => {
  const [src, setSrc] = useState<string | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const isWideEnough = width >= 3;

  useEffect(() => {
    if (!videoPath || src) return;
    
    // Don't load if too narrow, but don't re-run effect for every width change
    if (!isWideEnough) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const url = `http://localhost:8008/api/pipeline/thumbnail?video_path=${encodeURIComponent(videoPath)}&time=${time}`;
        setSrc(url);
        observer.disconnect();
      }
    }, {
      root: document.querySelector('.tlbody'),
      rootMargin: '300px',
      threshold: 0
    });

    if (blockRef.current) observer.observe(blockRef.current);
    return () => observer.disconnect();
  }, [videoPath, time, src, isWideEnough]); // Only re-run if width crosses threshold

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
});
