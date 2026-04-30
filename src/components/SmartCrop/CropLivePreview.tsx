import { useRef, useEffect, useCallback, type FC, type RefObject } from 'react';
import type { Keyframe } from './CropOverlay';

interface CropLivePreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  trackingData: any | null;
  keyframes: Keyframe[];
  enabled: boolean;
}

export const CropLivePreview: FC<CropLivePreviewProps> = ({
  videoRef,
  trackingData,
  keyframes,
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Helper to interpolate cx
  const getCxForFrame = useCallback((frameIdx: number): number => {
    if (!trackingData) return 0;
    const kf = keyframes.find(k => k.frame_idx === frameIdx);
    if (kf) return kf.cx;

    const sortedKfs = [...keyframes].sort((a, b) => a.frame_idx - b.frame_idx);
    if (sortedKfs.length > 0) {
      if (frameIdx > sortedKfs[sortedKfs.length - 1].frame_idx) {
        return sortedKfs[sortedKfs.length - 1].cx;
      }
      if (frameIdx < sortedKfs[0].frame_idx) {
        // before first
      } else {
        let prev: Keyframe | null = null;
        let next: Keyframe | null = null;
        for (const k of sortedKfs) {
          if (k.frame_idx <= frameIdx) prev = k;
          if (k.frame_idx > frameIdx && !next) next = k;
        }
        if (prev && next) {
          const t = (frameIdx - prev.frame_idx) / (next.frame_idx - prev.frame_idx);
          return prev.cx + t * (next.cx - prev.cx);
        }
        if (prev) return prev.cx;
      }
    }

    const frame = trackingData.frames[frameIdx];
    return frame ? frame.cx : trackingData.frame_width / 2;
  }, [trackingData, keyframes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !trackingData || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Set canvas internal resolution to the crop size for max quality
    if (canvas.width !== trackingData.crop_width || canvas.height !== trackingData.crop_height) {
      canvas.width = trackingData.crop_width;
      canvas.height = trackingData.crop_height;
    }

    const frameIdx = Math.floor(video.currentTime * trackingData.fps);
    const frame = trackingData.frames[frameIdx];

    if (!frame) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const cx = getCxForFrame(frameIdx);
    const cy = frame.cy;

    // Calculate source cropping rectangle
    const sx = cx - trackingData.crop_width / 2;
    const sy = cy - trackingData.crop_height / 2;
    const sw = trackingData.crop_width;
    const sh = trackingData.crop_height;

    // Draw the cropped portion of the video to the canvas
    try {
      ctx.drawImage(
        video,
        sx, sy, sw, sh,               // Source rect
        0, 0, canvas.width, canvas.height // Destination rect
      );
    } catch (e) {
      // Ignored - video might not be ready
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [videoRef, trackingData, keyframes, enabled, getCxForFrame]);

  useEffect(() => {
    if (enabled && trackingData) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [enabled, trackingData, draw]);

  if (!enabled || !trackingData) return null;

  return (
    <canvas
      ref={canvasRef}
      className="sc-live-preview"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: '#000'
      }}
    />
  );
};
