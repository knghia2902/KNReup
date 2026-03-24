import { useState, useEffect, useCallback, type RefObject } from 'react';

interface VideoControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function VideoControls({ videoRef }: VideoControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, [videoRef]);

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(video.currentTime - 5, 0);
  }, [videoRef]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(video.currentTime + 5, duration);
  }, [videoRef, duration]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * duration;
    },
    [videoRef, duration]
  );

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="pvctrl">
      <div className="cb" onClick={skipBackward} title="Skip backward 5s">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
        </svg>
      </div>
      
      <div className="cb play" onClick={togglePlay}>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </div>
      
      <div className="cb" onClick={skipForward} title="Skip forward 5s">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
        </svg>
      </div>

      <div className="scrub" onClick={handleSeek}>
        <div className="scrubf" style={{ width: `${pct}%` }}></div>
      </div>

      <div className="tcd">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
