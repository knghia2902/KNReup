import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { convertFileSrc } from '@tauri-apps/api/core';

interface AudioTrackProps {
  url: string | null;
  pixelsPerSecond: number;
  color: string;
}

export function AudioTrack({ url, pixelsPerSecond, color }: AudioTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!url || !containerRef.current) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
        setIsReady(false);
      }
      return;
    }

    if (!wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color,
        progressColor: color,
        height: 26,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        interact: false,
        hideScrollbar: true,
        normalize: true,
      });

      wavesurfer.current.on('ready', () => {
        setIsReady(true);
        if (wavesurfer.current) {
           setDuration(wavesurfer.current.getDuration());
        }
      });
    }

    setIsReady(false);
    wavesurfer.current.load(convertFileSrc(url)).catch((e) => {
      if (e.name !== 'AbortError') {
         console.warn("Wavesurfer load error:", e);
      }
    });

    return () => {};
  }, [url, color]);

  useEffect(() => {
    if (wavesurfer.current && isReady) {
      try {
        wavesurfer.current.zoom(pixelsPerSecond);
      } catch (e) {
        // ignore
      }
    }
  }, [pixelsPerSecond, isReady]);

  useEffect(() => {
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: duration > 0 ? `${duration * pixelsPerSecond}px` : '100vw', 
        height: '100%', 
        overflow: 'hidden', 
        pointerEvents: 'none'
      }} 
    />
  );
}
