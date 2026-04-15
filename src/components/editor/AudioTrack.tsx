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
    if (!url || !containerRef.current) return;

    // Khởi tạo wavesurfer nếu chưa có
    if (!wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color,
        progressColor: color,
        height: 32,
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

    // Load file mới
    const tauriUrl = url.startsWith('http') ? url : convertFileSrc(url);
    wavesurfer.current.load(tauriUrl).catch((e) => {
      console.warn("Wavesurfer load error:", e);
    });

    return () => {
      // Đừng destroy ở đây để tránh flash khi re-render
    };
  }, [url, color]);

  useEffect(() => {
    if (wavesurfer.current && isReady) {
      try {
        wavesurfer.current.zoom(pixelsPerSecond);
      } catch (e) { /* ignore */ }
    }
  }, [pixelsPerSecond, isReady]);

  // Cleanup khi component thực sự unmount
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
        width: duration > 0 ? `${duration * pixelsPerSecond}px` : '100%', 
        height: '100%', 
        minWidth: '200px',
        overflow: 'hidden', 
        pointerEvents: 'none'
      }} 
    />
  );
}
