import { useRef, useEffect, useState, useCallback } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { VideoControls } from './VideoControls';
import type { SubtitleSegment } from '../../stores/useSubtitleStore';

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
}

export function VideoPreview({ videoSrc, segments, subtitleConfig }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [fontReady, setFontReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ w: 0, h: 0 });

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

    if (currentSeg) {
      const text = currentSeg.translated_text || currentSeg.source_text;
      if (!text) return;

      const fontSize = subtitleConfig.font_size * (canvas.height / 720);
      const fontFamily = fontReady ? subtitleConfig.font : 'sans-serif';

      ctx.font = `${fontSize}px "${fontFamily}"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const posMap: Record<number, number> = { 1: 0.1, 2: 0.3, 3: 0.5, 4: 0.7, 5: 0.9 };
      const yRatio = posMap[subtitleConfig.position] ?? 0.9;
      const x = canvas.width / 2;
      const y = canvas.height * yRatio;

      ctx.strokeStyle = subtitleConfig.outline_color;
      ctx.lineWidth = fontSize * 0.08;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y);

      ctx.fillStyle = subtitleConfig.color;
      ctx.fillText(text, x, y);
    }

    if (!video.paused) {
      rafRef.current = requestAnimationFrame(renderSubtitles);
    }
  }, [segments, subtitleConfig, fontReady]);

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

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Internal dimension tracker for canvas sizing matching intrinsic video resolution mapped to container
    // To match actual grid size precisely, we use clientWidth/Height inside ResizeObserver, but for now we sync intrinsic ratio
    setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
  }, []);

  if (!videoSrc) {
    return (
      <>
        <div className="pvbody">
          <div className="vnolbl">Drop a video here...</div>
        </div>
        <div className="pvctrl" style={{ opacity: 0.5, pointerEvents: 'none' }}>
           <div className="cb play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
           <div className="scrub"><div className="scrubf" style={{width: '0%'}}></div></div>
           <div className="tcd">00:00 / 00:00</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pvbody">
        <span className="vtc">00:00:00:00</span>
        <div className="vcorn tl"></div>
        <div className="vcorn br"></div>
        <div className="vframe">
          <div 
            className="vinner"
            style={{ display: 'grid', placeItems: 'center' }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              style={{
                gridArea: '1 / 1',
                minWidth: 0, minHeight: 0,
                maxWidth: '100%', maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            <canvas 
              ref={canvasRef} 
              style={{
                gridArea: '1 / 1',
                minWidth: 0, minHeight: 0,
                maxWidth: '100%', maxHeight: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                objectFit: 'contain'
              }} 
            />
          </div>
        </div>
      </div>
      <VideoControls videoRef={videoRef} />
    </>
  );
}
