import React, { useEffect, useRef, useState, useCallback, type FC, type RefObject } from 'react';
import type { Keyframe } from './CropOverlay';

interface CropTimelineProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  trackingData: any | null;
  keyframes: Keyframe[];
  onKeyframeDelete: (frameIdx: number) => void;
  enabled: boolean;
}

export const CropTimeline: FC<CropTimelineProps> = ({
  videoRef,
  trackingData,
  keyframes,
  onKeyframeDelete,
  enabled
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync with video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) setDuration(video.duration);
    };

    const handleLoadedMeta = () => {
      if (video.duration) setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMeta);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    // Initial sync
    handleTimeUpdate();
    setIsPlaying(!video.paused);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMeta);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef, enabled]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [videoRef]);

  const stepFrame = useCallback((dir: number) => {
    if (videoRef.current) {
      const fps = trackingData?.fps || 30;
      videoRef.current.currentTime += dir * (1 / fps);
    }
  }, [videoRef, trackingData]);

  // Click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * duration;
  }, [videoRef, duration]);

  // Click on a keyframe to jump to it (and select it)
  const handleKeyframeClick = useCallback((e: React.MouseEvent, frameIdx: number) => {
    e.stopPropagation();
    if (!videoRef.current || !trackingData) return;
    videoRef.current.currentTime = frameIdx / trackingData.fps;
  }, [videoRef, trackingData]);

  // Double click to delete
  const handleKeyframeDoubleClick = useCallback((e: React.MouseEvent, frameIdx: number) => {
    e.stopPropagation();
    if (enabled) onKeyframeDelete(frameIdx);
  }, [onKeyframeDelete, enabled]);

  const progressPercent = (currentTime / duration) * 100;

  // Generate time markers every 5 seconds
  const markers = [];
  const maxTime = duration || 1;
  const step = Math.max(1, Math.ceil(maxTime / 10)); // ~10 markers total
  for (let t = 0; t <= maxTime; t += step) {
    markers.push(t);
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sc-crop-timeline-container">
      {/* Controls row */}
      <div className="sc-crop-timeline-header">
        <div className="sc-playback-controls">
          <button className="sc-playback-btn" onClick={() => stepFrame(-1)} title="Lùi 1 frame">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className="sc-playback-btn play" onClick={togglePlay} title={isPlaying ? "Dừng" : "Phát"}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <button className="sc-playback-btn" onClick={() => stepFrame(1)} title="Tiến 1 frame">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div className="sc-crop-timeline-info">
          <span className="sc-crop-timeline-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {enabled && <span className="sc-crop-timeline-hint">Nhấp đúp điểm vàng để xóa</span>}
        </div>
      </div>

      <div 
        ref={containerRef}
        className="sc-crop-timeline-track"
        onClick={handleTimelineClick}
      >
        {/* Progress Fill */}
        <div 
          className="sc-crop-timeline-progress" 
          style={{ width: `${progressPercent}%` }} 
        />
        
        {/* Time Markers Ruler */}
        <div className="sc-crop-timeline-ruler">
          {markers.map(t => {
            const percent = (t / maxTime) * 100;
            return (
              <div key={`marker-${t}`} className="sc-timeline-tick" style={{ left: `${percent}%` }}>
                <div className="sc-timeline-tick-mark" />
                <span className="sc-timeline-tick-label">{formatTime(t)}</span>
              </div>
            );
          })}
        </div>
        
        {/* Manual Keyframes */}
        {enabled && trackingData && keyframes.map((kf) => {
          const time = kf.frame_idx / trackingData.fps;
          const leftPercent = (time / duration) * 100;
          return (
            <div
              key={kf.frame_idx}
              className="sc-crop-timeline-keyframe"
              style={{ left: `${leftPercent}%` }}
              onClick={(e) => handleKeyframeClick(e, kf.frame_idx)}
              onDoubleClick={(e) => handleKeyframeDoubleClick(e, kf.frame_idx)}
              title={`Frame ${kf.frame_idx}`}
            />
          );
        })}

        {/* Playhead */}
        <div 
          className="sc-crop-timeline-playhead"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="sc-playhead-line" />
          <div className="sc-playhead-head" />
        </div>
      </div>
    </div>
  );
};
