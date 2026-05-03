import { useRef, useEffect, useCallback, type FC, type RefObject } from 'react';
import type { Keyframe, CropRegion } from './CropOverlay';

interface CropLivePreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  trackingData: any | null;
  keyframes: Keyframe[];
  enabled: boolean;
  cropLayout?: string;
}

export const CropLivePreview: FC<CropLivePreviewProps> = ({
  videoRef,
  trackingData,
  keyframes,
  enabled,
  cropLayout = 'vertical',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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
    
    const kf = keyframes.find(k => k.frame_idx === frameIdx);
    if (kf) return kf.regions;

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

    if (canvas.width !== trackingData.crop_width || canvas.height !== trackingData.crop_height) {
      canvas.width = trackingData.crop_width;
      canvas.height = trackingData.crop_height;
    }

    const frameIdx = Math.floor(video.currentTime * trackingData.fps);
    const regions = getRegionsForFrame(frameIdx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cropLayout === 'split') {
      const topR = regions.find(r => r.id === 'top');
      const botR = regions.find(r => r.id === 'bottom');
      
      if (topR) {
        try {
          ctx.drawImage(
            video,
            topR.x, topR.y, topR.width, topR.height,
            0, 0, canvas.width, canvas.height / 2
          );
        } catch (e) {}
      }
      
      if (botR) {
        try {
          ctx.drawImage(
            video,
            botR.x, botR.y, botR.width, botR.height,
            0, canvas.height / 2, canvas.width, canvas.height / 2
          );
        } catch (e) {}
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, canvas.height / 2 - 2, canvas.width, 4);

    } else {
      const mainR = regions.find(r => r.id === 'main');
      if (mainR) {
        try {
          ctx.drawImage(
            video,
            mainR.x, mainR.y, mainR.width, mainR.height,
            0, 0, canvas.width, canvas.height
          );
        } catch (e) {}
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [videoRef, trackingData, keyframes, enabled, cropLayout, getRegionsForFrame]);

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
