import { useRef, useEffect, useState, useCallback } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { VideoControls } from './VideoControls';
import type { SubtitleSegment } from '../../stores/useSubtitleStore';
import { useProjectStore } from '../../stores/useProjectStore';

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

    if (currentSeg || isEditingSub) {
      const text = currentSeg ? (currentSeg.translated_text || currentSeg.source_text || "") : "Vùng hiển thị Phụ đề (Kéo thả)";
      if (!text && !isEditingSub) return;

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

      const linesPerPage = 2;
      const totalPages = Math.ceil(allLines.length / linesPerPage) || 1;
      
      let lines = allLines;
      if (totalPages > 1 && currentSeg) {
        const segDuration = currentSeg.end - currentSeg.start;
        const timeElapsed = currentTime - currentSeg.start;
        const pageDuration = segDuration / totalPages;
        
        let currentPage = Math.floor(timeElapsed / pageDuration);
        if (currentPage >= totalPages) currentPage = totalPages - 1;
        if (currentPage < 0) currentPage = 0;
        
        const startIndex = currentPage * linesPerPage;
        lines = allLines.slice(startIndex, startIndex + linesPerPage);
      } else if (totalPages > 1) {
        // Fallback for placeholder default text
        lines = allLines.slice(0, linesPerPage);
      }

      const lineHeight = scaledFontSize * 1.15;
      
      // Chiều rộng cố định 90%, chiều cao động theo số dòng hiện tại của page (max 2)
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
  }, [segments, subtitleConfig, fontReady, isEditingSub, isDragging]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => rafRef.current = requestAnimationFrame(renderSubtitles);
    const onPause = () => {
      cancelAnimationFrame(rafRef.current);
      renderSubtitles();
    };
    const onSeeked = () => renderSubtitles();

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [renderSubtitles]);

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

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
  }, []);

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
            style={{ display: 'grid', placeItems: 'center', position: 'relative' }}
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
                pointerEvents: 'auto',
                zIndex: 10,
                objectFit: 'contain',
                cursor: isDragging ? 'grabbing' : (isEditingSub ? 'grab' : 'default')
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {projectConfig.blur_enabled && videoDimensions.w > 0 && (
              <div style={{
                gridArea: '1 / 1',
                zIndex: 20,
                position: 'absolute',
                border: '2px dashed red',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.1)',
                left: `${(projectConfig.blur_x / videoDimensions.w) * 100}%`,
                top: `${(projectConfig.blur_y / videoDimensions.h) * 100}%`,
                width: `${(projectConfig.blur_w / videoDimensions.w) * 100}%`,
                height: `${(projectConfig.blur_h / videoDimensions.h) * 100}%`,
                pointerEvents: 'none'
              }} />
            )}
            {projectConfig.watermark_enabled && projectConfig.watermark_text && videoDimensions.w > 0 && (
              <div style={{
                gridArea: '1 / 1',
                zIndex: 20,
                position: 'absolute',
                color: 'white',
                fontSize: '2vw',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                opacity: projectConfig.watermark_opacity,
                left: `${(projectConfig.watermark_x / videoDimensions.w) * 100}%`,
                top: `${(projectConfig.watermark_y / videoDimensions.h) * 100}%`,
                pointerEvents: 'none'
              }}>
                {projectConfig.watermark_text}
              </div>
            )}
          </div>
        </div>
      </div>
      <VideoControls videoRef={videoRef} />
    </>
  );
}
