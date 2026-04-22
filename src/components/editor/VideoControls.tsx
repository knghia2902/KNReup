import { useState, useEffect, useCallback, type RefObject } from 'react';
import { Play, Pause, SkipBack, SkipForward } from '@phosphor-icons/react';

// Định nghĩa trực tiếp ở đây để đảm bảo không bị lỗi import/cache
function formatTimeLocal(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface VideoControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
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
        <SkipBack size={18} weight="fill" />
      </div>
      
      <div className="cb play" onClick={togglePlay}>
        {isPlaying ? (
          <Pause size={18} weight="fill" />
        ) : (
          <Play size={18} weight="fill" />
        )}
      </div>
      
      <div className="cb" onClick={skipForward} title="Skip forward 5s">
        <SkipForward size={18} weight="fill" />
      </div>

      <div className="scrub" onClick={handleSeek}>
        <div className="scrubf" style={{ width: `${pct}%` }}></div>
      </div>

      <div className="tcd" style={{ fontFamily: 'var(--font-mono)', minWidth: 120, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
        {formatTimeLocal(currentTime)} / {formatTimeLocal(duration)}
      </div>
    </div>
  );
}
