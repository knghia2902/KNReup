import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES, applyLayoutOverrides } from '../TemplatePreview/templateData';
import { getTemplateSet } from '../TemplatePreview/sets';
import { Play, Pause } from '@phosphor-icons/react';
import '../../styles/template-preview.css'; // Reuse TP styles for the viewport
import '../../styles/v2-visual-styles.css'; // V2 styles

declare const gsap: any;

export function LabLivePreview() {
  const store = useVideoGenLabStore();
  const themeId = store.selectedTheme || 'tech-blue';
  const templateIdx = store.selectedTemplate || 0; // We need to add selectedTemplate to store

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any | null>(null);
  const animFrameRef = useRef<number>(0);

  const theme = THEME_PALETTES[themeId] || THEME_PALETTES['tech-blue'];
  const templateSetId = store.selectedTemplateSet || 'default';
  const tplList = getTemplateSet(templateSetId).templates;
  const tpl = tplList[templateIdx] || tplList[0];

  const fitViewport = useCallback(() => {
    const frame = frameRef.current;
    const wrap = wrapRef.current;
    const vp = viewportRef.current;
    if (!frame || !wrap || !vp) return;
    const rect = wrap.getBoundingClientRect();
    const availW = rect.width;
    const availH = rect.height;
    const scaleW = availW / 1080;
    const scaleH = availH / 1920;
    const scale = Math.min(scaleW, scaleH);
    vp.style.transform = `scale(${scale})`;
    frame.style.width = (1080 * scale) + 'px';
    frame.style.height = (1920 * scale) + 'px';
  }, []);

  const renderScene = useCallback(() => {
    const vp = viewportRef.current;
    const c = containerRef.current;
    if (!vp || !c) return;

    setIsPlaying(false);
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    vp.style.backgroundColor = theme.bg;
    vp.style.color = theme.text;

    c.innerHTML = '';
    c.style.padding = '80px';
    c.style.alignItems = 'center';
    c.style.justifyContent = 'center';
    c.style.gap = '';

    tpl.render(c, tpl.sampleData, theme);

    // Apply layout overrides (using default layout for Lab) only for default set
    if (templateSetId === 'default') {
      applyLayoutOverrides(c, vp, { 
        name: 'Default', 
        bodyFont: 'sans-serif',
        headlineFont: 'sans-serif',
        serifFont: 'sans-serif',
        dotColor: '',
        borderRadius: '0px',
        grain: false
      }, theme);
    }

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({ paused: true });
      tpl.animate(c, tl);
      timelineRef.current = tl;
    }

    setProgress(0);
  }, [tpl, theme]);

  const tickPlayback = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    const p = tl.progress();
    setProgress(p);
    if (p >= 1) {
      setIsPlaying(false);
      return;
    }
    animFrameRef.current = requestAnimationFrame(tickPlayback);
  }, []);

  const togglePlayback = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    if (isPlaying) {
      tl.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      if (tl.progress() >= 1) tl.restart();
      else tl.play();
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(tickPlayback);
    }
  }, [isPlaying, tickPlayback]);

  useEffect(() => {
    renderScene();
  }, [renderScene]);

  useEffect(() => {
    fitViewport();
    
    // Use ResizeObserver for robust layout tracking
    const wrap = wrapRef.current;
    let observer: ResizeObserver | null = null;
    if (wrap) {
        observer = new ResizeObserver(() => fitViewport());
        observer.observe(wrap);
    } else {
        window.addEventListener('resize', fitViewport);
    }

    if (typeof gsap === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      script.onload = () => { renderScene(); };
      document.head.appendChild(script);
    }

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', fitViewport);
    };
  }, [fitViewport, renderScene]);

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const tl = timelineRef.current;
    if (!tl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    tl.pause();
    tl.progress(pct);
    setIsPlaying(false);
    setProgress(pct);
  }, []);

  const duration = timelineRef.current?.duration() || 2.0;
  const currentTime = (duration * progress).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#000', position: 'relative' }}>
      {/* Viewport */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }} ref={wrapRef}>
        <div ref={frameRef} style={{ position: 'relative', overflow: 'hidden' }}>
          <div ref={viewportRef} style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920, transformOrigin: 'top left' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }} />
          </div>
          {/* Film grain overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.35%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', zIndex: 10 }}>
        <button 
          onClick={togglePlayback}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
        </button>

        <div style={{ flex: 1, height: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onMouseDown={handleScrub}>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress * 100}%`, backgroundColor: 'var(--accent-primary)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: 'translate(-50%, -50%)', width: '12px', height: '12px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {currentTime}s / {duration.toFixed(1)}s
        </div>
      </div>
    </div>
  );
}
