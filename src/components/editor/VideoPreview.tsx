import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { VideoControls } from './VideoControls';
import type { SubtitleSegment } from '../../stores/useSubtitleStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { convertFileSrc } from '@tauri-apps/api/core';

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
        height: `${toPercent(config.blur_h, videoDimensions.h)}%`,
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
          background: '#ef4444', borderRadius: 2, cursor: 'nwse-resize', pointerEvents: 'auto',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'resize')}
      />
      <div style={{ position: 'absolute', top: -18, left: 0, fontSize: 10, color: '#ef4444', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>BLUR</div>
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

// ─── Draggable Text Logo ─────────────────────────────
function DraggableTextLogo({ videoDimensions }: { videoDimensions: { w: number; h: number } }) {
  const config = useProjectStore();
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null);
  const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0, oh: 0, ofont: 40 });
  const wrapRef = useRef<HTMLDivElement>(null);
  // Đo kích thước thực tế của element (quy sang tọa độ video)
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

interface SubtitleConfig {
  enabled: boolean;
  position: number;
  font_size: number;
  font: string;
  color: string;
  outline_color: string;
}

interface VideoPreviewProps {
  videoSrc: string | null;
  segments: SubtitleSegment[];
  subtitleConfig: SubtitleConfig;
  videoRatio?: 'original' | '16:9' | '9:16';
  isEditingSub?: boolean;
  onPositionChange?: (pos: number) => void;
}

export function VideoPreview({ videoSrc, segments, subtitleConfig, videoRatio = 'original', isEditingSub = false, onPositionChange }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const boxRectRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
  
  const projectConfig = useProjectStore();

  const [fontReady, setFontReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  // ─── Font Loading ────────────────────────────────────
  useEffect(() => {
    const font = new FontFaceObserver(subtitleConfig.font);
    setFontReady(false);
    font
      .load('Ẩặẫậ', 5000)
      .then(() => setFontReady(true))
      .catch(() => {
        console.warn(`Font "${subtitleConfig.font}" failed to load, using fallback`);
        setFontReady(true);
      });
  }, [subtitleConfig.font]);

  // ─── Drag Handlers ───────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let hitBox = false;
    const b = boxRectRef.current;
    if (isEditingSub && b && mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      setIsDragging(true);
      setDragOffsetY(mouseY - (b.y + b.h / 2));
      canvas.setPointerCapture(e.pointerId);
      hitBox = true;
    }

    if (!hitBox && videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isEditingSub || !onPositionChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const newCenterY = mouseY - dragOffsetY;
    let newRatio = (newCenterY / canvas.height) * 100;
    newRatio = Math.max(5, Math.min(95, newRatio));

    onPositionChange(newRatio);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      canvasRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  // ─── Canvas Rendering Loop ───────────────────────────
  const renderSubtitles = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !subtitleConfig.enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentTime = video.currentTime;
    const currentSeg = segments.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    );

    const forceShowDummy = projectConfig.watermark_enabled || projectConfig.blur_enabled || projectConfig.ocr_enabled;

    if (currentSeg || isEditingSub || forceShowDummy) {
      const text = currentSeg ? (currentSeg.translated_text || currentSeg.source_text || "") : "Vùng hiển thị Phụ đề (Tham khảo)";
      if (!text && !isEditingSub && !forceShowDummy) return;

      let fontFamily = subtitleConfig.font;
      if (!fontReady && !document.fonts.check(`12px "${fontFamily}"`)) {
        fontFamily = 'sans-serif';
      }
      
      let scaledFontSize = subtitleConfig.font_size * (canvas.height / 1080.0);
      ctx.font = `bold ${scaledFontSize}px "${fontFamily}", sans-serif`;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';

      const x = canvas.width / 2;
      const yRatio = subtitleConfig.position / 100;
      const boxCenterY = canvas.height * yRatio;
      
      const paddingX = scaledFontSize * 0.8;
      const paddingY = scaledFontSize * 0.3;
      
      const boxWidth = canvas.width * 0.9;
      const textMaxWidth = boxWidth - paddingX * 2;
      const measure = (textLine: string) => ctx.measureText(textLine).width;
      
      const getGreedyLines = (textStr: string): string[] => {
        const words = textStr.split(' ');
        let currentLines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (measure(testLine) <= textMaxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) currentLines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) currentLines.push(currentLine);
        return currentLines;
      };

      const allLines = text.split('\n').flatMap(l => getGreedyLines(l));

      const lines = allLines;
      const lineHeight = scaledFontSize * 1.15;
      
      // Chiều rộng cố định 90%, chiều cao động theo số dòng hiện tại
      const boxHeight = lines.length * lineHeight + paddingY * 2;
      const boxX = x - boxWidth / 2;
      const boxY = boxCenterY - boxHeight / 2;

      boxRectRef.current = { x: boxX, y: boxY, w: boxWidth, h: boxHeight };

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
          ctx.strokeStyle = subtitleConfig.outline_color;
          ctx.strokeText(line, x, startY);
          ctx.fillStyle = subtitleConfig.color;
          ctx.fillText(line, x, startY);
          startY += lineHeight;
        });
      }
    }

    if (!video.paused && !isDragging) {
      rafRef.current = requestAnimationFrame(renderSubtitles);
    }
  }, [segments, subtitleConfig, fontReady, isEditingSub, isDragging, projectConfig.blur_enabled, projectConfig.watermark_enabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      // Dùng setState có kiểm tra tham chiếu cũ để bailout khỏi Infinite Loop
      setVideoDimensions(prev => 
        prev.w === video.videoWidth && prev.h === video.videoHeight 
          ? prev 
          : { w: video.videoWidth, h: video.videoHeight }
      );
      useSubtitleStore.getState().setVideoDuration(video.duration);
    };

    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => rafRef.current = requestAnimationFrame(renderSubtitles);
    const onPause = () => {
      cancelAnimationFrame(rafRef.current);
      renderSubtitles();
    };
    const onSeeked = () => {
      renderSubtitles();
      window.dispatchEvent(new CustomEvent('timeupdate', { detail: video.currentTime }));
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
  }, [renderSubtitles]);

  useEffect(() => {
    if (videoRef.current?.paused) {
      renderSubtitles();
    }
  }, [segments, renderSubtitles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = videoDimensions.w;
    canvas.height = videoDimensions.h;
    renderSubtitles();
  }, [videoDimensions, renderSubtitles]);

  useEffect(() => {
    renderSubtitles();
  }, [subtitleConfig, renderSubtitles, isEditingSub]);

  const getVframeStyle = () => {
    let ratioW = 16;
    let ratioH = 9;

    if (videoRatio === '16:9') {
      ratioW = 16; ratioH = 9;
    } else if (videoRatio === '9:16') {
      ratioW = 9; ratioH = 16;
    } else if (videoDimensions.w && videoDimensions.h) {
      ratioW = videoDimensions.w; ratioH = videoDimensions.h;
    }

    return {
      width: `min(100cqw, calc(100cqh * ${ratioW} / ${ratioH}))`,
      height: `min(100cqh, calc(100cqw * ${ratioH} / ${ratioW}))`
    };
  };

  // ─── Tính toán effective dimensions (target frame sau pad/crop) ───
  // Dùng độ phân giải chuẩn (Standard Resolution) để đồng bộ với backend.
  const effectiveDimensions = useMemo(() => {
    if (!videoDimensions.w || !videoDimensions.h) return videoDimensions;
    if (videoRatio === '16:9') {
      return { w: 1920, h: 1080 };
    }
    if (videoRatio === '9:16') {
      return { w: 1080, h: 1920 };
    }
    // Original → giữ nguyên
    return videoDimensions;
  }, [videoDimensions, videoRatio]);

  // Overlay container luôn phủ full .vinner → user đặt overlay bất kỳ đâu trong target frame
  const getOverlayContainerStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      zIndex: 20,
      pointerEvents: 'none',
      overflow: 'hidden',
    };
  };

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  const [currentTime, setCurrentTime] = useState(0);

  // Sync state explicitly to capture current seg
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
        <div className="pvbody">
          <div className="vnolbl">Drop a video here...</div>
        </div>
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
          <div
            className="vinner"
            style={{ display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              style={{
                gridArea: '1 / 1',
                width: '100%', height: '100%',
                minWidth: 0, minHeight: 0,
                maxWidth: '100%', maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                gridArea: '1 / 1',
                width: '100%', height: '100%',
                minWidth: 0, minHeight: 0,
                maxWidth: '100%', maxHeight: '100%',
                objectFit: 'contain',
                pointerEvents: 'auto',
                zIndex: 10,
                cursor: isDragging ? 'grabbing' : (isEditingSub ? 'grab' : 'default')
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <div data-overlay-container style={getOverlayContainerStyle()}>
              {projectConfig.blur_enabled && effectiveDimensions.w > 0 && <DraggableBlur videoDimensions={effectiveDimensions} />}
              {projectConfig.ocr_enabled && effectiveDimensions.w > 0 && <DraggableOcr videoDimensions={effectiveDimensions} />}
              {projectConfig.watermark_enabled && effectiveDimensions.w > 0 && <DraggableTextLogo videoDimensions={effectiveDimensions} />}
              {projectConfig.image_logo_enabled && effectiveDimensions.w > 0 && <DraggableImageLogo videoDimensions={effectiveDimensions} />}
              
              {/* Click Canvas subtitle area → focus in SubTab panel */}
              {subtitleConfig.enabled && currentSeg && effectiveDimensions.h > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '5%',
                    width: '90%',
                    top: `${subtitleConfig.position}%`,
                    transform: 'translateY(-50%)',
                    minHeight: '40px',
                    cursor: 'pointer',
                    zIndex: 30,
                  }}
                  onClick={() => {
                    useSubtitleStore.getState().selectSegment(currentSeg.id);
                    window.dispatchEvent(new CustomEvent('focus-subtitle-panel', { detail: currentSeg.id }));
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <VideoControls videoRef={videoRef} />
    </>
  );
}
