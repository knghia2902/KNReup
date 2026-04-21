import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { convertFileSrc } from '@tauri-apps/api/core';
import { sidecar } from '../../lib/sidecar';

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
    const cleanUrl = url.trim();
    const isRemote = cleanUrl.startsWith('http');
    const finalUrl = isRemote ? `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(cleanUrl)}` : convertFileSrc(cleanUrl);

    const audio = new Audio();
    audio.src = finalUrl;
    audio.onloadedmetadata = () => setTotalDuration(audio.duration);
  }, [url]);

  const CHUNK_LEN = 300; // 5 min chunks
  const numChunks = Math.ceil((clipDuration || totalDuration || 0) / CHUNK_LEN);
  const chunks = Array.from({ length: numChunks }, (_, i) => i);
  
  // Virtualization is based on TIMELINE space.
  const viewportStart = Math.max(0, scrollLeft / pixelsPerSecond);
  const viewportEnd = viewportStart + (viewportWidth / pixelsPerSecond);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', width: (clipDuration || totalDuration) * pixelsPerSecond }}>
      {chunks.map(idx => {
        const start = idx * CHUNK_LEN;
        const end = start + CHUNK_LEN;
        const isVisible = end > viewportStart && start < viewportEnd;
        if (!isVisible) return <div key={idx} style={{ width: CHUNK_LEN * pixelsPerSecond, height: '100%', flexShrink: 0 }} />;
        
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

  useEffect(() => {
    if (!url || !containerRef.current) return;
    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: color,
      height: 32,
      barWidth: 2,
      interact: false,
      hideScrollbar: true,
      minPxPerSec: pixelsPerSecond,
    });

    const cleanUrl = url.trim();
    const isRemote = cleanUrl.startsWith('http');
    const tauriUrl = isRemote ? `${sidecar.getBaseUrl()}/api/proxy?url=${encodeURIComponent(cleanUrl)}` : convertFileSrc(cleanUrl);

    wavesurfer.current.load(tauriUrl).then(() => {
       wavesurfer.current?.setTime(startTime);
    }).catch(e => {
       if (e.name !== 'AbortError') console.error('WaveSurfer load error:', e);
    });

    return () => {
      wavesurfer.current?.destroy();
      wavesurfer.current = null;
    };
  }, [url, startTime, pixelsPerSecond, color]);

  return (
    <div style={{ width: duration * pixelsPerSecond, height: '100%', flexShrink: 0, overflow: 'hidden', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
       <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', left: -startTime * pixelsPerSecond }} />
    </div>
  );
}
