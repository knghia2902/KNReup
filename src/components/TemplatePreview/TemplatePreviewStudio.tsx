/* ═══════════════════════════════════════════════════════════
   KNReup — Template Preview Studio (React)
   Full port of test-preview into Tauri app
   ═══════════════════════════════════════════════════════════ */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SMART_TEMPLATES, THEME_PALETTES, LAYOUT_PRESETS, applyLayoutOverrides } from './templateData';
import type { ThemePalette, LayoutPreset } from './templateData';
import { Play, Pause, CaretLeft, CaretRight, FilmSlate, DownloadSimple, Clock, X } from '@phosphor-icons/react';
import '../../styles/template-preview.css';
import '../../styles/v2-visual-styles.css';

declare const gsap: any;

const BACKEND_URL = 'http://127.0.0.1:8008/api';

const themeEntries = Object.entries(THEME_PALETTES);
const layoutEntries = Object.entries(LAYOUT_PRESETS);

export const TemplatePreviewStudio: React.FC = () => {
    // ── State ────────────────────────────────────────────
    const [templateIdx, setTemplateIdx] = useState(0);
    const [themeId, setThemeId] = useState('tech-blue');
    const [layoutId, setLayoutId] = useState('default');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [grainEnabled, setGrainEnabled] = useState(true);
    const [grainLevel, setGrainLevel] = useState(35);

    // Export state
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState('');
    const [exportDone, setExportDone] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');

    // ── Refs ─────────────────────────────────────────────
    const viewportRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const grainRef = useRef<HTMLCanvasElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const animFrameRef = useRef<number>(0);
    const scrubbingRef = useRef(false);

    const theme = THEME_PALETTES[themeId];
    const layout = LAYOUT_PRESETS[layoutId];
    const tpl = SMART_TEMPLATES[templateIdx];

    // ── Viewport Fit ────────────────────────────────────
    const fitViewport = useCallback(() => {
        const frame = frameRef.current;
        const wrap = wrapRef.current;
        const vp = viewportRef.current;
        if (!frame || !wrap || !vp) return;
        const rect = wrap.getBoundingClientRect();
        const availW = rect.width - 40;
        const availH = rect.height - 80;
        const scaleW = availW / 1080;
        const scaleH = availH / 1920;
        const scale = Math.min(scaleW, scaleH, 0.45);
        vp.style.transform = `scale(${scale})`;
        frame.style.width = (1080 * scale) + 'px';
        frame.style.height = (1920 * scale) + 'px';
    }, []);

    // ── Render Scene ────────────────────────────────────
    const renderScene = useCallback(() => {
        const vp = viewportRef.current;
        const c = containerRef.current;
        if (!vp || !c) return;

        // Stop any existing playback
        setIsPlaying(false);
        if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        // Apply viewport styles
        vp.style.fontFamily = layout.bodyFont;
        vp.style.backgroundColor = theme.bg;
        vp.style.color = theme.text;

        // Clear container
        c.innerHTML = '';
        c.style.padding = '80px';
        c.style.alignItems = 'center';
        c.style.gap = '';

        // Render template content
        tpl.render(c, tpl.sampleData, theme);

        // Apply layout overrides only if using the default layout
        if (layoutId !== 'default' || themeId !== 'news-mono') {
             applyLayoutOverrides(c, vp, layout, theme);
        }
        // Wait, the V2 news set uses its own fonts and ignores the 'layout' entirely.
        // Actually, since we're using V2_NEWS_SET in LabLivePreview, but TemplatePreviewStudio
        // still uses SMART_TEMPLATES which is DEFAULT_SET. So TemplatePreviewStudio is fine.

        // Build GSAP timeline (paused)
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline({ paused: true });
            tpl.animate(c, tl);
            timelineRef.current = tl;
        }

        setProgress(0);
    }, [tpl, theme, layout]);

    // ── Playback ────────────────────────────────────────
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
            if (tl.progress() >= 1) {
                tl.restart();
            } else {
                tl.play();
            }
            setIsPlaying(true);
            animFrameRef.current = requestAnimationFrame(tickPlayback);
        }
    }, [isPlaying, tickPlayback]);

    const goPrev = useCallback(() => {
        setTemplateIdx(prev => (prev - 1 + SMART_TEMPLATES.length) % SMART_TEMPLATES.length);
    }, []);

    const goNext = useCallback(() => {
        setTemplateIdx(prev => (prev + 1) % SMART_TEMPLATES.length);
    }, []);

    // ── Timeline Scrub ──────────────────────────────────
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

    // ── Grain ───────────────────────────────────────────
    useEffect(() => {
        const canvas = grainRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let running = true;
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            if (!running) return;
            if (!grainEnabled) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                requestAnimationFrame(draw);
                return;
            }
            const w = canvas.width, h = canvas.height;
            const imageData = ctx.createImageData(w, h);
            const data = imageData.data;
            const intensity = grainLevel * 2.55;
            for (let i = 0; i < data.length; i += 4) {
                const v = Math.random() * intensity;
                data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            requestAnimationFrame(draw);
        };
        draw();

        return () => {
            running = false;
            window.removeEventListener('resize', resize);
        };
    }, [grainEnabled, grainLevel]);

    // ── Re-render on state change ───────────────────────
    useEffect(() => {
        renderScene();
    }, [renderScene]);

    // ── Fit viewport on mount + resize ──────────────────
    useEffect(() => {
        fitViewport();
        const onResize = () => fitViewport();
        window.addEventListener('resize', onResize);

        // Load GSAP
        if (typeof gsap === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
            script.onload = () => { renderScene(); };
            document.head.appendChild(script);
        }

        return () => window.removeEventListener('resize', onResize);
    }, [fitViewport, renderScene]);

    // ── Keyboard shortcuts ──────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext, togglePlayback]);

    // ── Export ───────────────────────────────────────────
    const handleExport = useCallback(async () => {
        setExporting(true);
        setExportProgress(0);
        setExportStatus('Preparing...');
        setExportDone(false);
        setDownloadUrl('');

        try {
            const response = await fetch(`${BACKEND_URL}/video-gen/render-preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: themeId, sceneDuration: 4.0, fps: 30 })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            if (!response.body) throw new Error('No stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') continue;
                    try {
                        const event = JSON.parse(payload);
                        setExportProgress(event.progress || 0);
                        setExportStatus(event.message || '');

                        if (event.status === 'done' && event.downloadUrl) {
                            setExportProgress(100);
                            setExportStatus('Export complete!');
                            setDownloadUrl(BACKEND_URL.replace('/api', '') + event.downloadUrl);
                            setExportDone(true);
                        } else if (event.status === 'error') {
                            setExportStatus('Error: ' + (event.message || 'Unknown'));
                            setExportDone(true);
                        }
                    } catch { /* skip non-JSON */ }
                }
            }
        } catch (err: any) {
            setExportStatus('Connection error: ' + err.message);
            setExportDone(true);
        }
    }, [themeId]);

    const closeExport = () => {
        setExporting(false);
        setExportDone(false);
    };

    // ── Computed values ─────────────────────────────────
    const duration = timelineRef.current?.duration() || 2.0;
    const currentTime = (duration * progress).toFixed(1);

    // ── Render ───────────────────────────────────────────
    return (
        <div className="tp-layout">
            {/* Grain Canvas */}
            <canvas
                ref={grainRef}
                className="tp-grain"
                style={{ opacity: grainEnabled ? 0.035 : 0 }}
            />

            {/* Top Bar */}
            <header className="tp-topbar" data-tauri-drag-region>
                <div className="tp-logo">
                    <div className="tp-logo-icon">
                        <FilmSlate size={14} weight="fill" />
                    </div>
                    <h1>KNReup <span className="tp-accent">Video Gen</span></h1>
                </div>
                <div className="tp-bar-controls">
                    <span className="tp-badge">{templateIdx + 1} / {SMART_TEMPLATES.length}</span>
                    <span className="tp-badge tp-theme-badge">{themeId}</span>
                    <span className="tp-badge tp-layout-badge">{layout.name}</span>
                    <button className="tp-export-btn" onClick={handleExport} disabled={exporting}>
                        <DownloadSimple size={16} weight="bold" />
                        Export MP4
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="tp-main">
                {/* Left Sidebar: Templates */}
                <aside className="tp-sidebar tp-sidebar-left">
                    <div className="tp-sidebar-title">Smart Templates</div>
                    <nav className="tp-template-list">
                        {SMART_TEMPLATES.map((t, i) => (
                            <div
                                key={t.id}
                                className={`tp-tpl-item${i === templateIdx ? ' active' : ''}`}
                                onClick={() => setTemplateIdx(i)}
                            >
                                <div className="tp-tpl-icon">{t.icon}</div>
                                <div className="tp-tpl-info">
                                    <div className="tp-tpl-name">{t.name}</div>
                                    <div className="tp-tpl-desc">{t.desc}</div>
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Center: Viewport */}
                <section className="tp-viewport-wrap" ref={wrapRef}>
                    <div className="tp-viewport-frame" ref={frameRef}>
                        <div
                            ref={viewportRef}
                            className="tp-viewport"
                            style={{ width: 1080, height: 1920, transformOrigin: 'top left' }}
                        >
                            <div ref={containerRef} className="tp-scene-container" />
                        </div>
                    </div>
                    {/* Playback Bar */}
                    <div className="tp-playback-bar">
                        <button className="tp-pb-btn" onClick={goPrev} title="Previous">
                            <CaretLeft size={16} weight="bold" />
                        </button>
                        <button className="tp-pb-btn tp-play-btn" onClick={togglePlayback} title="Play">
                            {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                        </button>
                        <button className="tp-pb-btn" onClick={goNext} title="Next">
                            <CaretRight size={16} weight="bold" />
                        </button>
                        <div className="tp-timeline-track" onMouseDown={handleScrub}>
                            <div className="tp-timeline-fill" style={{ width: `${progress * 100}%` }} />
                            <div className="tp-timeline-head" style={{ left: `${progress * 100}%` }} />
                        </div>
                        <span className="tp-time-display">{currentTime}s / {duration.toFixed(1)}s</span>
                    </div>
                </section>

                {/* Right Sidebar: Theme & Layout */}
                <aside className="tp-sidebar tp-sidebar-right">
                    <div className="tp-sidebar-title">Theme Palette</div>
                    <div className="tp-theme-grid">
                        {themeEntries.map(([id, t]) => (
                            <div
                                key={id}
                                className={`tp-theme-chip${id === themeId ? ' active' : ''}`}
                                onClick={() => setThemeId(id)}
                            >
                                <div className="tp-theme-dot" style={{ background: t.accent }} />
                                <div className="tp-theme-label">{t.name}</div>
                            </div>
                        ))}
                    </div>

                    <div className="tp-sidebar-title" style={{ marginTop: 24 }}>Layout</div>
                    <div className="tp-layout-grid">
                        {layoutEntries.map(([id, l]) => (
                            <div
                                key={id}
                                className={`tp-layout-chip${id === layoutId ? ' active' : ''}`}
                                onClick={() => setLayoutId(id)}
                            >
                                <div className="tp-layout-dot" style={{ background: l.dotColor }} />
                                {l.name}
                            </div>
                        ))}
                    </div>

                    <div className="tp-sidebar-title" style={{ marginTop: 24 }}>Grain</div>
                    <div className="tp-toggle-row">
                        <label className="tp-toggle">
                            <input type="checkbox" checked={grainEnabled} onChange={e => setGrainEnabled(e.target.checked)} />
                            <span className="tp-toggle-slider" />
                        </label>
                        <span className="tp-toggle-label">Film Grain</span>
                    </div>
                    <div className="tp-range-row">
                        <label>Intensity</label>
                        <input
                            type="range" min="0" max="100"
                            value={grainLevel}
                            onChange={e => setGrainLevel(parseInt(e.target.value))}
                        />
                    </div>
                </aside>
            </main>

            {/* Export Modal */}
            {exporting && (
                <div className="tp-export-overlay">
                    <div className="tp-export-modal">
                        <div className="tp-export-header">
                            <Clock size={28} weight="regular" />
                            <h2>Exporting Video</h2>
                        </div>
                        <div className="tp-export-track">
                            <div className="tp-export-fill" style={{ width: `${exportProgress}%` }} />
                        </div>
                        <div className="tp-export-status">{exportStatus}</div>
                        <div className="tp-export-percent">{exportProgress}%</div>
                        {exportDone && (
                            <div className="tp-export-actions">
                                {downloadUrl && (
                                    <a
                                        href={downloadUrl}
                                        className="tp-download-btn"
                                        download={`knreup_preview_${themeId}.mp4`}
                                    >
                                        <DownloadSimple size={16} weight="bold" />
                                        Download MP4
                                    </a>
                                )}
                                <button className="tp-close-btn" onClick={closeExport}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatePreviewStudio;
