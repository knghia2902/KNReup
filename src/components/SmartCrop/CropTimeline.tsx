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

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMeta);
    
    // Initial sync
    handleTimeUpdate();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMeta);
    };
  }, [videoRef, enabled]);

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
    onKeyframeDelete(frameIdx);
  }, [onKeyframeDelete]);

  if (!enabled || !trackingData) return null;

  const totalFrames = trackingData.frames.length || 1;
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
      {/* Controls row (optional, can be expanded later) */}
      <div className="sc-crop-timeline-header">
        <span className="sc-crop-timeline-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="sc-crop-timeline-hint">Double-click marker to remove</span>
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
        {keyframes.map((kf) => {
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
