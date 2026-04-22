import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { getMediaSrc } from '../../utils/url';

interface AudioTrackProps {
  url: string | null;
  pixelsPerSecond: number;
  color: string;
  clipStart?: number;
  clipDuration?: number;
  scrollLeft: number;
  viewportWidth: number;
}

export function AudioTrack({ url, pixelsPerSecond, color, clipStart = 0, clipDuration, scrollLeft, viewportWidth }: AudioTrackProps) {
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (!url) return;
    const finalUrl = getMediaSrc(url);
    if (!finalUrl) return;

    const audio = new Audio();
    audio.src = finalUrl;
    const handleLoadedMetadata = () => setTotalDuration(audio.duration);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.src = '';
      audio.load(); // Forces immediate stop of the load
    };
  }, [url]);

  // Dynamically adjust chunk length based on zoom levels to avoid too many simultaneous WaveSurfer loads.
  // Using discrete steps to keep chunk boundaries stable during most zoom operations.
  let CHUNK_LEN = 300; // Default 5 mins
  if (pixelsPerSecond < 0.1) {
    CHUNK_LEN = 10800; // 3 hours
  } else if (pixelsPerSecond < 1) {
    CHUNK_LEN = 1800; // 30 mins
  }

  const numChunks = Math.ceil((clipDuration || totalDuration || 0) / CHUNK_LEN);
  const chunks = Array.from({ length: numChunks }, (_, i) => i);
  
  // Virtualization is based on TIMELINE space.
  const bufferPx = 100;
  const viewportStart = Math.max(0, (scrollLeft - bufferPx) / pixelsPerSecond);
  const viewportEnd = (scrollLeft + viewportWidth + bufferPx) / pixelsPerSecond;

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', width: (clipDuration || totalDuration) * pixelsPerSecond }}>
      {chunks.map(idx => {
        const start = idx * CHUNK_LEN;
        const end = start + CHUNK_LEN;
        const isVisible = end > viewportStart && start < viewportEnd;
        if (!isVisible) return <div key={idx} style={{ width: CHUNK_LEN * pixelsPerSecond, height: '100%', flexShrink: 0 }} />;
        
        // Skip rendering waveform if zoomed out too much (saves CPU/Memory on very long files)
        // At < 0.02 px/s, a 3-hour video fits in 216px. Waveform is barely visible.
        if (pixelsPerSecond < 0.02) {
          return <div key={idx} style={{ width: CHUNK_LEN * pixelsPerSecond, height: '100%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }} />;
        }

        return (
          <AudioChunk 
            key={idx}
            url={url}
            pixelsPerSecond={pixelsPerSecond}
            color={color}
            startTime={start}
            duration={CHUNK_LEN}
          />
        );
      })}
    </div>
  );
}

function AudioChunk({ url, pixelsPerSecond, color, startTime, duration }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const isDestroyed = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    isDestroyed.current = false;
    setIsReady(false);
    if (!url || !containerRef.current) return;

    // Debounce creation to avoid mounting/unmounting many instances during rapid scrolling
    const timer = setTimeout(() => {
      if (isDestroyed.current || !containerRef.current) return;

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color,
        progressColor: color,
        height: 32,
        barWidth: 2,
        interact: false,
        hideScrollbar: true,
        minPxPerSec: pixelsPerSecond,
        fetchParams: { mode: 'cors' },
      });
      wavesurfer.current = ws;

      const tauriUrl = getMediaSrc(url);
      if (!tauriUrl) return;

      ws.once('ready', () => {
        if (!isDestroyed.current) {
          setIsReady(true);
          ws.setTime(startTime);
        }
      });

      ws.load(tauriUrl).catch(e => {
         // Silently ignore AbortError during unmount/rapid scroll
         if (e.name !== 'AbortError' && !isDestroyed.current) {
           console.error('WaveSurfer load error:', e);
         }
      });
    }, 50);

    return () => {
      isDestroyed.current = true;
      clearTimeout(timer);
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [url, startTime, color]);

  // Dedicated effect for zoom, avoiding full WaveSurfer recreation
  useEffect(() => {
    if (wavesurfer.current && !isDestroyed.current && isReady) {
      try {
        wavesurfer.current.zoom(pixelsPerSecond);
      } catch (e) {
        // Fallback or ignore if not ready
      }
    }
  }, [pixelsPerSecond, isReady]);

  return (
    <div style={{ width: duration * pixelsPerSecond, height: '100%', flexShrink: 0, overflow: 'hidden', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
       <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', left: -startTime * pixelsPerSecond }} />
    </div>
  );
}
