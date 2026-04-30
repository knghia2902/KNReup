/**
 * CropOverlay — Canvas overlay vẽ crop rectangle 9:16 trên video gốc.
 *
 * - Đồng bộ với video.currentTime qua requestAnimationFrame
 * - User drag rectangle ngang = tạo keyframe tại frame hiện tại
 * - Chỉ horizontal pan (D-08: không zoom/rotation)
 */
import { useRef, useEffect, useCallback, useState, type FC, type RefObject } from 'react';

export interface Keyframe {
  frame_idx: number;
  cx: number;
}

interface TrackingData {
  fps: number;
  frame_width: number;
  frame_height: number;
  crop_width: number;
  crop_height: number;
  frames: Array<{ idx: number; cx: number; cy: number }>;
}

interface CropOverlayProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  trackingData: TrackingData | null;
  keyframes: Keyframe[];
  onKeyframeAdd: (kf: Keyframe) => void;
  onKeyframeDelete: (frameIdx: number) => void;
  enabled: boolean;
}

export const CropOverlay: FC<CropOverlayProps> = ({
  videoRef,
  trackingData,
  keyframes,
  onKeyframeAdd,
  onKeyframeDelete,
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; originalCx: number } | null>(null);
  const currentFrameRef = useRef<number>(0);

  // Get current frame index from video time
  const getFrameIdx = useCallback(() => {
    if (!videoRef.current || !trackingData) return 0;
    return Math.floor(videoRef.current.currentTime * trackingData.fps);
  }, [videoRef, trackingData]);

  // Get cx for a frame (with keyframe override)
  const getCxForFrame = useCallback((frameIdx: number): number => {
    if (!trackingData) return 0;

    // Check keyframe override
    const kf = keyframes.find(k => k.frame_idx === frameIdx);
    if (kf) return kf.cx;

    // Interpolate between keyframes
    const sortedKfs = [...keyframes].sort((a, b) => a.frame_idx - b.frame_idx);
    if (sortedKfs.length > 0) {
      if (frameIdx > sortedKfs[sortedKfs.length - 1].frame_idx) {
        return sortedKfs[sortedKfs.length - 1].cx;
      }
      if (frameIdx < sortedKfs[0].frame_idx) {
        // Before first keyframe — use AI tracking
      } else {
        // Between keyframes — linear interpolation
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
        if (prev && !next) return prev.cx;
      }
    }

    // Default: use AI tracking data
    const frame = trackingData.frames[frameIdx];
    return frame ? frame.cx : trackingData.frame_width / 2;
  }, [trackingData, keyframes]);

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !trackingData || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Match canvas to video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const frameIdx = getFrameIdx();
    currentFrameRef.current = frameIdx;

    const frame = trackingData.frames[frameIdx];
    if (!frame) {
      // Keep loop alive even if frame is out of bounds (e.g. video ended)
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const cx = getCxForFrame(frameIdx);
    const cy = frame.cy;

    // Scale factors
    const scaleX = canvas.width / trackingData.frame_width;
    const scaleY = canvas.height / trackingData.frame_height;

    // Crop rectangle position
    const rectX = (cx - trackingData.crop_width / 2) * scaleX;
    const rectY = (cy - trackingData.crop_height / 2) * scaleY;
    const rectW = trackingData.crop_width * scaleX;
    const rectH = trackingData.crop_height * scaleY;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dim outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(rectX, rectY, rectW, rectH);

    // Crop border
    const isKf = keyframes.some(k => k.frame_idx === frameIdx);
    ctx.strokeStyle = isKf ? '#f59e0b' : '#22d3ee';
    ctx.lineWidth = 2;
    ctx.setLineDash(isKf ? [] : [6, 3]);
    ctx.strokeRect(rectX, rectY, rectW, rectH);
    ctx.setLineDash([]);

    // Keyframe indicator
    if (isKf) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('◆ Keyframe', rectX + 6, rectY + 16);
    }

    // Frame info
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Frame ${frameIdx}`, 8, canvas.height - 8);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [videoRef, trackingData, keyframes, enabled, getFrameIdx, getCxForFrame]);

  // Start/stop animation loop
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

  // Mouse handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!trackingData || !enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const frameIdx = currentFrameRef.current;
    const cx = getCxForFrame(frameIdx);

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - rect.left, originalCx: cx };
  }, [trackingData, enabled, getCxForFrame]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current || !trackingData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const deltaX = currentX - dragStartRef.current.x;
    const scaleX = trackingData.frame_width / canvas.width;

    // Preview: update cx based on drag delta
    const newCx = Math.max(
      trackingData.crop_width / 2,
      Math.min(
        trackingData.frame_width - trackingData.crop_width / 2,
        dragStartRef.current.originalCx + deltaX * scaleX
      )
    );

    // Immediately add/update keyframe for visual feedback
    const frameIdx = currentFrameRef.current;
    onKeyframeAdd({ frame_idx: frameIdx, cx: Math.round(newCx * 100) / 100 });
  }, [isDragging, trackingData, onKeyframeAdd]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Double-click to delete keyframe
  const handleDoubleClick = useCallback(() => {
    const frameIdx = currentFrameRef.current;
    onKeyframeDelete(frameIdx);
  }, [onKeyframeDelete]);

  if (!enabled || !trackingData) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="sc-crop-overlay"
        style={{ pointerEvents: 'none' }}
      />
      <div
        className="sc-crop-interaction-layer"
        onMouseDown={handleMouseDown as any}
        onMouseMove={handleMouseMove as any}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 60px)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 11
        }}
      />
    </>
  );
};
