import { useRef, useEffect, useCallback, useState, type FC, type RefObject } from 'react';

export interface CropRegion {
  id: string; // 'main', 'top', 'bottom'
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Keyframe {
  frame_idx: number;
  regions: CropRegion[];
}

interface TrackingData {
  fps: number;
  frame_width: number;
  frame_height: number;
  crop_width: number; // default AI 9:16 width
  crop_height: number; // default AI 9:16 height
  frames: Array<{ idx: number; cx: number; cy: number }>;
}

interface CropOverlayProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  trackingData: TrackingData | null;
  keyframes: Keyframe[];
  onKeyframeAdd: (kf: Keyframe) => void;
  onKeyframeDelete: (frameIdx: number) => void;
  enabled: boolean;
  cropLayout?: string;
}

const HANDLE_SIZE = 10;

type HitZone = 'interior' | 'tl' | 'tr' | 'bl' | 'br';

interface DragState {
  regionId: string;
  zone: HitZone;
  startX: number;
  startY: number;
  startRegions: CropRegion[];
}

export const CropOverlay: FC<CropOverlayProps> = ({
  videoRef,
  trackingData,
  keyframes,
  onKeyframeAdd,
  onKeyframeDelete,
  enabled,
  cropLayout = 'vertical',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const currentFrameRef = useRef<number>(0);

  const getFrameIdx = useCallback(() => {
    if (!videoRef.current || !trackingData) return 0;
    return Math.floor(videoRef.current.currentTime * trackingData.fps);
  }, [videoRef, trackingData]);

  const getDefaultRegions = useCallback((cx: number, cy: number): CropRegion[] => {
    if (!trackingData) return [];
    if (cropLayout === 'split') {
      const topH = trackingData.crop_height / 2;
      return [
        { id: 'top', x: cx - trackingData.crop_width / 2, y: trackingData.frame_height * 0.3 - topH / 2, width: trackingData.crop_width, height: topH },
        { id: 'bottom', x: cx - trackingData.crop_width / 2, y: trackingData.frame_height * 0.7 - topH / 2, width: trackingData.crop_width, height: topH }
      ];
    } else {
      return [
        { id: 'main', x: cx - trackingData.crop_width / 2, y: cy - trackingData.crop_height / 2, width: trackingData.crop_width, height: trackingData.crop_height }
      ];
    }
  }, [trackingData, cropLayout]);

  const getRegionsForFrame = useCallback((frameIdx: number): CropRegion[] => {
    if (!trackingData) return [];
    
    // Exact keyframe
    const kf = keyframes.find(k => k.frame_idx === frameIdx);
    if (kf) return kf.regions;

    // Interpolate
    const sortedKfs = [...keyframes].sort((a, b) => a.frame_idx - b.frame_idx);
    if (sortedKfs.length > 0) {
      if (frameIdx > sortedKfs[sortedKfs.length - 1].frame_idx) {
        return sortedKfs[sortedKfs.length - 1].regions;
      }
      if (frameIdx > sortedKfs[0].frame_idx) {
        let prev: Keyframe | null = null;
        let next: Keyframe | null = null;
        for (const k of sortedKfs) {
          if (k.frame_idx <= frameIdx) prev = k;
          if (k.frame_idx > frameIdx && !next) next = k;
        }
        if (prev && next) {
          const t = (frameIdx - prev.frame_idx) / (next.frame_idx - prev.frame_idx);
          // Interpolate regions by ID
          const interpolated: CropRegion[] = [];
          for (const pr of prev.regions) {
            const nr = next.regions.find(r => r.id === pr.id) || pr;
            interpolated.push({
              id: pr.id,
              x: pr.x + t * (nr.x - pr.x),
              y: pr.y + t * (nr.y - pr.y),
              width: pr.width + t * (nr.width - pr.width),
              height: pr.height + t * (nr.height - pr.height),
            });
          }
          return interpolated;
        }
      }
    }

    // Default AI
    const frame = trackingData.frames[frameIdx] || { cx: trackingData.frame_width/2, cy: trackingData.frame_height/2 };
    return getDefaultRegions(frame.cx, frame.cy);
  }, [trackingData, keyframes, getDefaultRegions]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !trackingData || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const frameIdx = getFrameIdx();
    currentFrameRef.current = frameIdx;
    
    // Always call getRegionsForFrame which now handles out of bounds
    const regions = getRegionsForFrame(frameIdx);
    
    const scaleX = canvas.width / trackingData.frame_width;
    const scaleY = canvas.height / trackingData.frame_height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const isKf = keyframes.some(k => k.frame_idx === frameIdx);
    ctx.lineWidth = 2;
    ctx.setLineDash(isKf ? [] : [6, 3]);

    for (const r of regions) {
      const rx = r.x * scaleX;
      const ry = r.y * scaleY;
      const rw = r.width * scaleX;
      const rh = r.height * scaleY;

      ctx.clearRect(rx, ry, rw, rh);
      ctx.strokeStyle = r.id === 'bottom' ? '#a855f7' : (isKf ? '#f59e0b' : '#22d3ee');
      ctx.strokeRect(rx, ry, rw, rh);

      // Draw handles if dragging or if keyframe
      ctx.fillStyle = '#fff';
      const drawHandle = (hx: number, hy: number) => {
        ctx.fillRect(hx - HANDLE_SIZE/2, hy - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
      };
      drawHandle(rx, ry);
      drawHandle(rx + rw, ry);
      drawHandle(rx, ry + rh);
      drawHandle(rx + rw, ry + rh);

      // Label
      ctx.fillStyle = r.id === 'bottom' ? '#a855f7' : '#22d3ee';
      ctx.font = '10px Inter';
      ctx.fillText(r.id.charAt(0).toUpperCase() + r.id.slice(1), rx + 4, ry + 12);
      
      if (isKf && r.id === regions[0].id) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('◆ Keyframe', rx + 6, ry + 26);
      }
    }

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Frame ${frameIdx}`, 8, canvas.height - 8);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [videoRef, trackingData, keyframes, enabled, getFrameIdx, getRegionsForFrame]);

  useEffect(() => {
    if (enabled && trackingData) animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [enabled, trackingData, draw]);

  const getHitZone = (cx: number, cy: number, r: CropRegion, scaleX: number, scaleY: number): HitZone | null => {
    const rx = r.x * scaleX;
    const ry = r.y * scaleY;
    const rw = r.width * scaleX;
    const rh = r.height * scaleY;
    const hs = HANDLE_SIZE;

    // Check corners
    if (Math.abs(cx - rx) < hs && Math.abs(cy - ry) < hs) return 'tl';
    if (Math.abs(cx - (rx + rw)) < hs && Math.abs(cy - ry) < hs) return 'tr';
    if (Math.abs(cx - rx) < hs && Math.abs(cy - (ry + rh)) < hs) return 'bl';
    if (Math.abs(cx - (rx + rw)) < hs && Math.abs(cy - (ry + rh)) < hs) return 'br';
    
    // Check interior
    if (cx > rx && cx < rx + rw && cy > ry && cy < ry + rh) return 'interior';
    
    return null;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackingData || !enabled || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvasRef.current.width / trackingData.frame_width;
    const scaleY = canvasRef.current.height / trackingData.frame_height;

    const frameIdx = currentFrameRef.current;
    const regions = getRegionsForFrame(frameIdx);

    // Find hit from top to bottom
    for (let i = regions.length - 1; i >= 0; i--) {
      const r = regions[i];
      const zone = getHitZone(mx, my, r, scaleX, scaleY);
      if (zone) {
        setDragState({
          regionId: r.id,
          zone,
          startX: mx,
          startY: my,
          startRegions: JSON.parse(JSON.stringify(regions))
        });
        return;
      }
    }
  }, [trackingData, enabled, getRegionsForFrame]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !trackingData || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const scaleX = trackingData.frame_width / canvasRef.current.width;
    const scaleY = trackingData.frame_height / canvasRef.current.height;
    
    const dx = (mx - dragState.startX) * scaleX;
    const dy = (my - dragState.startY) * scaleY;

    const targetRatio = cropLayout === 'split' ? 9/8 : 9/16;

    const newRegions = dragState.startRegions.map(r => {
      if (r.id !== dragState.regionId) return r;
      const nr = { ...r };

      if (dragState.zone === 'interior') {
        nr.x += dx;
        nr.y += dy;
      } else {
        // Resizing
        let wDelta = 0;
        let hDelta = 0;

        if (dragState.zone === 'br') { wDelta = dx; hDelta = dx / targetRatio; }
        else if (dragState.zone === 'tr') { wDelta = dx; hDelta = dx / targetRatio; nr.y -= hDelta; }
        else if (dragState.zone === 'bl') { wDelta = -dx; hDelta = -dx / targetRatio; nr.x += dx; }
        else if (dragState.zone === 'tl') { wDelta = -dx; hDelta = -dx / targetRatio; nr.x += dx; nr.y -= hDelta; }

        nr.width += wDelta;
        nr.height += hDelta;

        // Minimum size
        if (nr.width < 100) {
          nr.width = 100;
          nr.height = 100 / targetRatio;
          // adjust x/y to prevent shifting if constrained
          // (Keeping it simple for now)
        }
      }
      return nr;
    });

    onKeyframeAdd({ frame_idx: currentFrameRef.current, regions: newRegions });
  }, [dragState, trackingData, cropLayout, onKeyframeAdd]);

  const handleMouseUp = useCallback(() => setDragState(null), []);

  const handleDoubleClick = useCallback(() => {
    onKeyframeDelete(currentFrameRef.current);
  }, [onKeyframeDelete]);

  // Determine cursor
  const getCursor = () => {
    if (!dragState) return 'default';
    if (dragState.zone === 'interior') return 'grabbing';
    if (['nw', 'se'].includes(dragState.zone)) return 'nwse-resize';
    if (['ne', 'sw'].includes(dragState.zone)) return 'nesw-resize';
    // Actually we mapped tl, tr, bl, br
    if (dragState.zone === 'tl' || dragState.zone === 'br') return 'nwse-resize';
    if (dragState.zone === 'tr' || dragState.zone === 'bl') return 'nesw-resize';
    return 'default';
  };

  if (!enabled || !trackingData) return null;

  return (
    <>
      <canvas ref={canvasRef} className="sc-crop-overlay" style={{ pointerEvents: 'none' }} />
      <div
        className="sc-crop-interaction-layer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: 'calc(100% - 60px)',
          cursor: getCursor(),
          zIndex: 11
        }}
      />
    </>
  );
};
