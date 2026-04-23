import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { VideoControls } from './VideoControls';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { AudioMixer } from '../../lib/audioMixer';

// ─── Draggable Blur Box ──────────────────────────────
function DraggableBlur({ videoDimensions }: { videoDimensions: { w: number; h: number } }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, ow: 0, oh: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const toPercent = (val: number, total: number) => (val / total) * 100;

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    setDragging(mode);
    startRef.current = { mx: e.clientX, my: e.clientY, ox: config.blur_x, oy: config.blur_y, ow: config.blur_w, oh: config.blur_h };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.stopPropagation();
    const parentEl = wrapRef.current?.closest('[data-overlay-container]') as HTMLElement | null;
    if (!parentEl) return;
    const rect = parentEl.getBoundingClientRect();
    const scaleX = videoDimensions.w / rect.width;
    const scaleY = videoDimensions.h / rect.height;
    const dx = (e.clientX - startRef.current.mx) * scaleX;
    const dy = (e.clientY - startRef.current.my) * scaleY;

    if (dragging === 'move') {
      config.updateConfig({
        blur_x: Math.max(0, Math.min(videoDimensions.w - startRef.current.ow, startRef.current.ox + dx)),
        blur_y: Math.max(0, Math.min(videoDimensions.h - startRef.current.oh, startRef.current.oy + dy)),
      });
    } else {
      config.updateConfig({
        blur_w: Math.max(20, Math.min(videoDimensions.w - startRef.current.ox, startRef.current.ow + dx)),
        blur_h: Math.max(20, Math.min(videoDimensions.h - startRef.current.oy, startRef.current.oh + dy)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      wrapRef.current?.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        border: '2px dashed #ef4444',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255,255,255,0.1)',
        left: `${toPercent(config.blur_x, videoDimensions.w)}%`,
        top: `${toPercent(config.blur_y, videoDimensions.h)}%`,
        width: `${toPercent(config.blur_w, videoDimensions.w)}%`,
        height: `${toPercent(config.blur_w * (config.blur_h / config.blur_w) || 0, videoDimensions.w)}%`, // Simplified for now
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
      }}
      // Actually the width/height % should be based on videoDimensions
    >
        {/* Reverting to standard percent to match other components */}
    </div>
  );
}

// ─── Draggable OCR Region ──────────────────────────────
function DraggableOcr({ videoDimensions }: { videoDimensions: { w: number; h: number } }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, ow: 0, oh: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const toPercent = (val: number, total: number) => (val / total) * 100;

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    setDragging(mode);
    startRef.current = { mx: e.clientX, my: e.clientY, ox: config.ocr_x, oy: config.ocr_y, ow: config.ocr_w, oh: config.ocr_h };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.stopPropagation();
    const parentEl = wrapRef.current?.closest('[data-overlay-container]') as HTMLElement | null;
    if (!parentEl) return;
    const rect = parentEl.getBoundingClientRect();
    const scaleX = videoDimensions.w / rect.width;
    const scaleY = videoDimensions.h / rect.height;
    const dx = (e.clientX - startRef.current.mx) * scaleX;
    const dy = (e.clientY - startRef.current.my) * scaleY;

    if (dragging === 'move') {
      config.updateConfig({
        ocr_x: Math.max(0, Math.min(videoDimensions.w - startRef.current.ow, startRef.current.ox + dx)),
        ocr_y: Math.max(0, Math.min(videoDimensions.h - startRef.current.oh, startRef.current.oy + dy)),
      });
    } else {
      config.updateConfig({
        ocr_w: Math.max(20, Math.min(videoDimensions.w - startRef.current.ox, startRef.current.ow + dx)),
        ocr_h: Math.max(20, Math.min(videoDimensions.h - startRef.current.oy, startRef.current.oh + dy)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      wrapRef.current?.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        border: '2px dashed rgba(0,255,100,0.8)',
        backgroundColor: 'rgba(0,255,100,0.1)',
        left: `${toPercent(config.ocr_x, videoDimensions.w)}%`,
        top: `${toPercent(config.ocr_y, videoDimensions.h)}%`,
        width: `${toPercent(config.ocr_w, videoDimensions.w)}%`,
        height: `${toPercent(config.ocr_h, videoDimensions.h)}%`,
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          position: 'absolute', right: -4, bottom: -4, width: 10, height: 10,
          background: 'rgba(0,255,100,1)', borderRadius: 2, cursor: 'nwse-resize', pointerEvents: 'auto',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
      />
      <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 10, color: 'rgba(0,255,100,1)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>OCR</div>
    </div>
  );
}

// ─── Draggable Subtitle Bounding Box ───────────────────────
function DraggableSubtitleRegion({ currentSegId }: { currentSegId?: number }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  
  // Pair-based heuristic: if Y > 100, X and Y are legacy pixels. If W > 100, W and H are legacy.
  const isPosLegacy = config.subtitle_y !== undefined && config.subtitle_y > 100;
  const isSizeLegacy = (config.subtitle_w !== undefined && config.subtitle_w > 100) || (config.subtitle_h !== undefined && config.subtitle_h > 100);

  const safeNx = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1080) * 100 : v; };
  const safeNy = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1920) * 100 : v; };
  const safeNw = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1080) * 100 : v; };
  const safeNh = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1920) * 100 : v; };

  const startRef = useRef({ mx: 0, my: 0, px: 0, py: 0, pw: 0, ph: 0, time: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  if (!config.subtitle_enabled) return null;

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    setDragging(mode);
    startRef.current = { 
      mx: e.clientX, 
      my: e.clientY, 
      px: safeNx(config.subtitle_x, 5), 
      py: safeNy(config.subtitle_y, 80), 
      pw: safeNw(config.subtitle_w, 90), 
      ph: safeNh(config.subtitle_h, 15), 
      time: Date.now() 
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const parentEl = wrapRef.current?.closest('[data-overlay-container]') as HTMLElement | null;
    if (!parentEl) return;
    const rect = parentEl.getBoundingClientRect();
    
    // Calculate movement in percentage of the container
    const dxPct = ((e.clientX - startRef.current.mx) / rect.width) * 100;
    const dyPct = ((e.clientY - startRef.current.my) / rect.height) * 100;

    if (dragging === 'move') {
      config.updateConfig({
        subtitle_x: Math.max(0, Math.min(100 - startRef.current.pw, startRef.current.px + dxPct)),
        subtitle_y: Math.max(0, Math.min(100 - startRef.current.ph, startRef.current.py + dyPct)),
      });
    } else {
      config.updateConfig({
        subtitle_w: Math.max(5, Math.min(100 - startRef.current.px, startRef.current.pw + dxPct)),
        subtitle_h: Math.max(5, Math.min(100 - startRef.current.py, startRef.current.ph + dyPct)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      wrapRef.current?.releasePointerCapture(e.pointerId);
      setDragging(null);
      if (Date.now() - startRef.current.time < 300 && startRef.current.mx === e.clientX && startRef.current.my === e.clientY) {
        if (currentSegId) {
          useSubtitleStore.getState().selectSegment(currentSegId);
          window.dispatchEvent(new CustomEvent('focus-subtitle-panel', { detail: currentSegId }));
        }
      }
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        border: dragging ? '2px dashed rgba(255,255,0,0.8)' : '1px dashed rgba(255,255,0,0.5)',
        backgroundColor: dragging ? 'rgba(255,255,0,0.1)' : 'transparent',
        left: `${safeNx(config.subtitle_x, 5)}%`,
        top: `${safeNy(config.subtitle_y, 80)}%`,
        width: `${Math.min(safeNw(config.subtitle_w, 90), 100 - safeNx(config.subtitle_x, 5))}%`,
        height: `${Math.min(safeNh(config.subtitle_h, 15), 100 - safeNy(config.subtitle_y, 80))}%`,
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        pointerEvents: config.subtitle_enabled ? 'auto' : 'none',
        boxSizing: 'border-box',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        if (!dragging && wrapRef.current) wrapRef.current.style.border = '2px dashed rgba(255,255,0,0.8)';
      }}
      onMouseLeave={() => {
        if (!dragging && wrapRef.current) wrapRef.current.style.border = '1px dashed rgba(255,255,0,0.5)';
      }}
    >
      <div
        style={{
          position: 'absolute', right: -4, bottom: -4, width: 10, height: 10,
          background: 'rgba(255,255,0,1)', borderRadius: 2, cursor: 'nwse-resize', pointerEvents: 'auto',
          opacity: 0.8
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
      />
      <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 10, color: 'rgba(255,255,0,1)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>SUBTITLE</div>
    </div>
  );
}

// ─── Draggable Text Logo ─────────────────────────────
function DraggableTextLogo({ videoDimensions }: { videoDimensions: { w: number; h: number } }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, oh: 0, ofont: 40 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [elSize, setElSize] = useState({ w: 200, h: 50 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const el = wrapRef.current;
      const parent = el?.closest('[data-overlay-container]') as HTMLElement | null;
      if (el && parent && parent.clientWidth > 0) {
        const sx = videoDimensions.w / parent.clientWidth;
        const sy = videoDimensions.h / parent.clientHeight;
        setElSize({ w: el.offsetWidth * sx, h: el.offsetHeight * sy });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [videoDimensions]);

  const toPercent = (val: number, total: number) => (val / total) * 100;

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    setDragging(mode);
    startRef.current = { mx: e.clientX, my: e.clientY, ox: config.watermark_x, oy: config.watermark_y, oh: elSize.h, ofont: config.watermark_fontsize || 40 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const parentEl = wrapRef.current?.closest('[data-overlay-container]') as HTMLElement | null;
    if (!parentEl) return;
    const rect = parentEl.getBoundingClientRect();
    const scaleX = videoDimensions.w / rect.width;
    const scaleY = videoDimensions.h / rect.height;
    const dx = (e.clientX - startRef.current.mx) * scaleX;
    const dy = (e.clientY - startRef.current.my) * scaleY;

    if (dragging === 'move') {
      config.updateConfig({
        watermark_x: Math.max(0, Math.min(videoDimensions.w - elSize.w, startRef.current.ox + dx)),
        watermark_y: Math.max(0, Math.min(videoDimensions.h - elSize.h, startRef.current.oy + dy)),
      });
    } else {
      const newHeight = startRef.current.oh + dy;
      if (startRef.current.oh > 0) {
        const ratio = newHeight / startRef.current.oh;
        const newFontSize = Math.max(10, Math.min(600, Math.round(startRef.current.ofont * ratio)));
        config.updateConfig({ watermark_fontsize: newFontSize });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      wrapRef.current?.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  if (!config.watermark_text || config.watermark_text.trim() === '') return null;

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        left: `${toPercent(config.watermark_x, videoDimensions.w)}%`,
        top: `${toPercent(config.watermark_y, videoDimensions.h)}%`,
        opacity: config.watermark_opacity,
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        userSelect: 'none',
        border: dragging ? '1px dashed rgba(255,255,255,0.5)' : 'none',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={{
        color: 'white',
        fontSize: `${toPercent(config.watermark_fontsize || 40, videoDimensions.h)}cqh`,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        {config.watermark_text}
      </div>
      <div
        style={{
          position: 'absolute', right: -4, bottom: -4, width: 10, height: 10,
          background: '#22d3ee', borderRadius: 2, cursor: 'nwse-resize', pointerEvents: 'auto',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
      />
      <div style={{ position: 'absolute', top: -16, left: 0, fontSize: 10, color: '#22d3ee', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>TEXT</div>
    </div>
  );
}

// ─── Draggable Image Logo ────────────────────────────
function DraggableImageLogo({ videoDimensions }: { videoDimensions: { w: number; h: number } }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, ow: 150, oh: 150 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [elSize, setElSize] = useState({ w: 200, h: 80 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const el = wrapRef.current;
      const parent = el?.closest('[data-overlay-container]') as HTMLElement | null;
      if (el && parent && parent.clientWidth > 0) {
        const sx = videoDimensions.w / parent.clientWidth;
        const sy = videoDimensions.h / parent.clientHeight;
        setElSize({ w: el.offsetWidth * sx, h: el.offsetHeight * sy });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [videoDimensions]);

  const toPercent = (val: number, total: number) => (val / total) * 100;

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    setDragging(mode);
    startRef.current = { mx: e.clientX, my: e.clientY, ox: config.image_logo_x, oy: config.image_logo_y, ow: config.image_logo_w || 150, oh: config.image_logo_h || 150 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const parentEl = wrapRef.current?.closest('[data-overlay-container]') as HTMLElement | null;
    if (!parentEl) return;
    const rect = parentEl.getBoundingClientRect();
    const scaleX = videoDimensions.w / rect.width;
    const scaleY = videoDimensions.h / rect.height;
    const dx = (e.clientX - startRef.current.mx) * scaleX;
    const dy = (e.clientY - startRef.current.my) * scaleY;

    if (dragging === 'move') {
      config.updateConfig({
        image_logo_x: Math.max(0, Math.min(videoDimensions.w - elSize.w, startRef.current.ox + dx)),
        image_logo_y: Math.max(0, Math.min(videoDimensions.h - elSize.h, startRef.current.oy + dy)),
      });
    } else {
      config.updateConfig({
        image_logo_w: Math.max(20, Math.min(videoDimensions.w - startRef.current.ox, startRef.current.ow + dx)),
        image_logo_h: Math.max(20, Math.min(videoDimensions.h - startRef.current.oy, startRef.current.oh + dy)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      wrapRef.current?.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  if (!config.image_logo_file || config.image_logo_file.trim() === '') return null;

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        left: `${toPercent(config.image_logo_x, videoDimensions.w)}%`,
        top: `${toPercent(config.image_logo_y, videoDimensions.h)}%`,
        width: `${toPercent(config.image_logo_w || 150, videoDimensions.w)}cqw`,
        height: `${toPercent(config.image_logo_h || 150, videoDimensions.h)}cqh`,
        opacity: config.image_logo_opacity,
        cursor: dragging === 'move' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        userSelect: 'none',
        border: dragging ? '1px dashed rgba(255,255,255,0.5)' : 'none',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={convertFileSrc(config.image_logo_file)}
        alt="logo"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
      />
      <div
        style={{
          position: 'absolute', right: -4, bottom: -4, width: 10, height: 10,
          background: '#a855f7', borderRadius: 2, cursor: 'nwse-resize', pointerEvents: 'auto',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
      />
      <div style={{ position: 'absolute', top: -16, left: 0, fontSize: 10, color: '#a855f7', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>IMG</div>
    </div>
  );
}

interface VideoPreviewProps {
  videoSrc: string | null;
  videoRatio?: 'original' | '16:9' | '9:16';
  isEditingSub?: boolean;
}

export function VideoPreview({ videoSrc, videoRatio = 'original', isEditingSub = false }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const projectConfig = useProjectStore();
  const { segments } = useSubtitleStore();

  const [fontReady, setFontReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ w: 0, h: 0 });

  // ─── Tính toán effective dimensions (target frame sau pad/crop) ───
  const effectiveDimensions = useMemo(() => {
    if (!videoDimensions.w || !videoDimensions.h) return videoDimensions;
    if (videoRatio === '16:9') {
      return { w: 1920, h: 1080 };
    }
    if (videoRatio === '9:16') {
      return { w: 1080, h: 1920 };
    }
    return videoDimensions;
  }, [videoDimensions, videoRatio]);

  // ─── Font Loading ────────────────────────────────────
  useEffect(() => {
    const font = new FontFaceObserver(projectConfig.subtitle_font);
    setFontReady(false);
    font
      .load('Ẩặẫậ', 5000)
      .then(() => setFontReady(true))
      .catch(() => {
        console.warn(`Font "${projectConfig.subtitle_font}" failed to load, using fallback`);
        setFontReady(true);
      });
  }, [projectConfig.subtitle_font]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const renderSubtitles = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !projectConfig.subtitle_enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTime = video.currentTime;
    const currentSeg = segments.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    );

    if (!projectConfig.subtitle_enabled) {
      if (!video.paused) rafRef.current = requestAnimationFrame(renderSubtitles);
      return;
    }

    const forceShowDummy = projectConfig.watermark_enabled || projectConfig.blur_enabled || projectConfig.ocr_enabled;

    if (currentSeg || isEditingSub || forceShowDummy) {
      let text = currentSeg ? (currentSeg.translated_text || currentSeg.source_text || "") : "Vùng hiển thị Phụ đề (Tham khảo)";
      text = text.trim();
      if (text) text = text.charAt(0).toUpperCase() + text.slice(1);
      if (!text && !isEditingSub && !forceShowDummy) return;

      let fontFamily = projectConfig.subtitle_font;
      if (!fontReady && !document.fonts.check(`12px "${fontFamily}"`)) fontFamily = 'sans-serif';
      
      let scaledFontSize = projectConfig.subtitle_font_size * (canvas.height / 1080.0);
      ctx.font = `bold ${scaledFontSize}px "${fontFamily}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';

      const isPosLegacy = projectConfig.subtitle_y !== undefined && projectConfig.subtitle_y > 100;
      const isSizeLegacy = (projectConfig.subtitle_w !== undefined && projectConfig.subtitle_w > 100) || (projectConfig.subtitle_h !== undefined && projectConfig.subtitle_h > 100);

      const safeNx = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1080) * 100 : v; };
      const safeNy = (val: number | undefined, df: number) => { const v = val ?? df; return isPosLegacy ? (v / 1920) * 100 : v; };
      const safeNw = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1080) * 100 : v; };
      const safeNh = (val: number | undefined, df: number) => { const v = val ?? df; return isSizeLegacy ? (v / 1920) * 100 : v; };

      const subX = safeNx(projectConfig.subtitle_x, 5);
      const subY = safeNy(projectConfig.subtitle_y, 80);
      let subW = safeNw(projectConfig.subtitle_w, 90);
      let subH = safeNh(projectConfig.subtitle_h, 15);

      if (subX + subW > 100) subW = Math.max(5, 100 - subX);
      if (subY + subH > 100) subH = Math.max(5, 100 - subY);

      const boxWidth = (subW / 100) * canvas.width;
      const boxHeight = (subH / 100) * canvas.height;
      const boxX = (subX / 100) * canvas.width;
      const boxY = (subY / 100) * canvas.height;
      const boxCenterX = boxX + boxWidth / 2;
      const boxCenterY = boxY + boxHeight / 2;
      
      const textMaxWidth = boxWidth - scaledFontSize * 0.2;
      const measure = (textLine: string) => ctx.measureText(textLine).width;
      
      const getGreedyLines = (textStr: string): string[] => {
        const words = textStr.split(' ');
        let currentLines: string[] = [];
        let currentLine = '';
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (measure(testLine) <= textMaxWidth) currentLine = testLine;
          else {
            if (currentLine) currentLines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) currentLines.push(currentLine);
        return currentLines;
      };

      const lines = text.split('\n').flatMap(l => getGreedyLines(l));
      const lineHeight = scaledFontSize * 1.15;

      if (isEditingSub) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (text) {
        let startY = boxCenterY - ((lines.length - 1) / 2) * lineHeight;
        ctx.lineWidth = Math.max(2, scaledFontSize * 0.16);
        lines.forEach(line => {
          ctx.strokeStyle = projectConfig.subtitle_outline_color;
          ctx.strokeText(line, boxCenterX, startY);
          ctx.fillStyle = projectConfig.subtitle_color;
          ctx.fillText(line, boxCenterX, startY);
          startY += lineHeight;
        });
      }
    }

    if (!video.paused) rafRef.current = requestAnimationFrame(renderSubtitles);
  }, [segments, projectConfig, fontReady, isEditingSub]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setVideoDimensions(prev => 
        prev.w === video.videoWidth && prev.h === video.videoHeight 
          ? prev 
          : { w: video.videoWidth, h: video.videoHeight }
      );
      useSubtitleStore.getState().setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
      useSubtitleStore.getState().setVideoDuration(video.duration);
    };

    if (video.readyState >= 1) onLoadedMetadata();
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [videoSrc]);

  // ─── AudioMixer: Connect video element ──────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    AudioMixer.init();
    AudioMixer.connectVideo(video);
    AudioMixer.setOriginalVolume(
      projectConfig.audio_mix_mode === 'mix' ? projectConfig.original_volume : 0
    );
  }, [videoSrc]);

  // ─── AudioMixer: Sync original volume ───────────────
  useEffect(() => {
    AudioMixer.setOriginalVolume(
      projectConfig.audio_mix_mode === 'mix' ? projectConfig.original_volume : 0
    );
  }, [projectConfig.original_volume, projectConfig.audio_mix_mode]);

  // ─── AudioMixer: Preload TTS buffers ────────────────
  useEffect(() => {
    if (segments.length > 0) {
      AudioMixer.preloadTTSBuffers(segments);
    }
  }, [segments]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => {
      rafRef.current = requestAnimationFrame(renderSubtitles);
      AudioMixer.resume();
      AudioMixer.scheduleTTS(segments, video.currentTime);
    };
    const onPause = () => {
      cancelAnimationFrame(rafRef.current);
      renderSubtitles();
      AudioMixer.cancelTTS();
    };
    const onSeeked = () => {
      renderSubtitles();
      window.dispatchEvent(new CustomEvent('timeupdate', { detail: video.currentTime }));
      // Re-schedule TTS nếu đang play
      if (!video.paused) {
        AudioMixer.cancelTTS();
        AudioMixer.scheduleTTS(segments, video.currentTime);
      }
    };
    const onTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration) && video.duration !== useSubtitleStore.getState().videoDuration) {
        useSubtitleStore.getState().setVideoDuration(video.duration);
      }
      window.dispatchEvent(new CustomEvent('timeupdate', { detail: video.currentTime }));
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [renderSubtitles, segments]);

  useEffect(() => {
    if (videoRef.current?.paused) renderSubtitles();
  }, [segments, renderSubtitles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = effectiveDimensions.w || 1920;
    canvas.height = effectiveDimensions.h || 1080;
    renderSubtitles();
  }, [effectiveDimensions, renderSubtitles]);

  useEffect(() => {
    renderSubtitles();
  }, [projectConfig, renderSubtitles, isEditingSub]);

  const getVframeStyle = () => {
    let ratioW = 16; let ratioH = 9;
    if (videoRatio === '16:9') { ratioW = 16; ratioH = 9; }
    else if (videoRatio === '9:16') { ratioW = 9; ratioH = 16; }
    else if (videoDimensions.w && videoDimensions.h) { ratioW = videoDimensions.w; ratioH = videoDimensions.h; }
    return {
      width: `min(100cqw, calc(100cqh * ${ratioW} / ${ratioH}))`,
      height: `min(100cqh, calc(100cqw * ${ratioH} / ${ratioW}))`
    };
  };

  const getOverlayContainerStyle = (): React.CSSProperties => ({
    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    zIndex: 20, pointerEvents: 'none', overflow: 'hidden',
  });

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTime = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', handleTime);
    return () => video.removeEventListener('timeupdate', handleTime);
  }, [videoSrc]);

  const currentSeg = useMemo(() => {
    return segments.find((s) => currentTime >= s.start && currentTime <= s.end);
  }, [currentTime, segments]);

  if (!videoSrc) {
    return (
      <>
        <div className="pvbody"><div className="vnolbl">Drop a video here...</div></div>
        <div className="pvctrl" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <div className="cb play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
          <div className="scrub"><div className="scrubf" style={{ width: '0%' }}></div></div>
          <div className="tcd">00:00 / 00:00</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pvbody">
        <div className="vframe" style={getVframeStyle()}>
          <div className="vinner" style={{ display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
            <video ref={videoRef} src={videoSrc} onLoadedMetadata={handleLoadedMetadata} playsInline
              style={{ gridArea: '1 / 1', width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <canvas ref={canvasRef} width={effectiveDimensions.w || 1920} height={effectiveDimensions.h || 1080}
              style={{ gridArea: '1 / 1', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'auto', zIndex: 10 }}
              onPointerDown={handlePointerDown}
            />
            <div data-overlay-container style={getOverlayContainerStyle()}>
              {projectConfig.blur_enabled && effectiveDimensions.w > 0 && <DraggableBlur videoDimensions={effectiveDimensions} />}
              {projectConfig.ocr_enabled && effectiveDimensions.w > 0 && <DraggableOcr videoDimensions={effectiveDimensions} />}
              {projectConfig.watermark_enabled && effectiveDimensions.w > 0 && <DraggableTextLogo videoDimensions={effectiveDimensions} />}
              {projectConfig.image_logo_enabled && effectiveDimensions.w > 0 && <DraggableImageLogo videoDimensions={effectiveDimensions} />}
              {projectConfig.subtitle_enabled && effectiveDimensions.w > 0 && (
                <DraggableSubtitleRegion currentSegId={currentSeg?.id} />
              )}
            </div>
          </div>
        </div>
      </div>
      <VideoControls videoRef={videoRef} />
    </>
  );
}
