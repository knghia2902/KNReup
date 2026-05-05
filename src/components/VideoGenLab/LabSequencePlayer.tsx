import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES, LAYOUT_PRESETS, applyLayoutOverrides } from '../TemplatePreview/templateData';
import { getTemplate } from '../TemplatePreview/sets';
import { Play, Pause, CaretLeft, CaretRight } from '@phosphor-icons/react';
import '../../styles/template-preview.css';

declare const gsap: any;

export function LabSequencePlayer() {
    const store = useVideoGenLabStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

    const viewportRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const animFrameRef = useRef<number>(0);
    const sceneDurations = useRef<number[]>([]);

    const theme = THEME_PALETTES[store.selectedTheme] || THEME_PALETTES['tech-blue'];
    const layout = LAYOUT_PRESETS['default'];

    const fitViewport = useCallback(() => {
        const wrap = wrapRef.current;
        const vp = viewportRef.current;
        if (!wrap || !vp) return;
        
        const rect = wrap.getBoundingClientRect();
        const availW = rect.width;
        const availH = rect.height;
        
        const scaleW = availW / 1080;
        const scaleH = availH / 1920;
        
        // Use Math.min to ensure the entire 9:16 frame is visible without cropping
        // Apply a small padding modifier (e.g. 0.95) so it doesn't touch the absolute edges if we want
        const scale = Math.min(scaleW, scaleH) * 0.95;
        
        vp.style.transform = `scale(${scale})`;
        
        // Center the viewport inside the container
        const actualW = 1080 * scale;
        const actualH = 1920 * scale;
        vp.style.left = `${(availW - actualW) / 2}px`;
        vp.style.top = `${(availH - actualH) / 2}px`;
    }, []);

    useEffect(() => {
        fitViewport();
        
        const wrap = wrapRef.current;
        let observer: ResizeObserver | null = null;
        if (wrap) {
            observer = new ResizeObserver(() => fitViewport());
            observer.observe(wrap);
        } else {
            window.addEventListener('resize', fitViewport);
        }
        
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', fitViewport);
        };
    }, [fitViewport]);

    // Build the master timeline
    useEffect(() => {
        if (!store.script || !store.script.scenes) return;
        
        setIsPlaying(false);
        if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setProgress(0);
        setCurrentSceneIdx(0);

        const buildTimeline = () => {
            const vp = viewportRef.current;
            if (!vp) return;
            vp.style.fontFamily = layout.bodyFont;
            vp.style.backgroundColor = theme.bg;
            vp.style.color = theme.text;

            if (typeof gsap !== 'undefined') {
                const masterTl = gsap.timeline({ paused: true });
                sceneDurations.current = [];
                let totalTime = 0;

                store.script.scenes.forEach((scene: any, i: number) => {
                    const c = sceneRefs.current[i];
                    if (!c) return;
                    
                    c.innerHTML = '';
                    c.style.padding = '80px';
                    c.style.alignItems = 'center';
                    c.style.justifyContent = 'center';
                    c.style.gap = '';
                    
                    // Hide initially
                    gsap.set(c, { autoAlpha: 0 });

                    const tplName = scene.templateData?.template || 'hook';
                    const tpl = getTemplate(store.selectedTemplateSet || 'default', tplName);

                    try {
                        tpl.render(c, scene.templateData, theme);
                        applyLayoutOverrides(c, vp, layout, theme);

                        const sceneTl = gsap.timeline();
                        // Show scene
                        sceneTl.set(c, { autoAlpha: 1 });
                        
                        // Animate scene
                        tpl.animate(c, sceneTl);
                        
                        // Add 1.5s hold time after animations finish
                        sceneTl.to({}, { duration: 1.5 });
                        
                        // Hide scene
                        sceneTl.set(c, { autoAlpha: 0 });
                        
                        // Add scene to master timeline
                        masterTl.add(sceneTl);
                        
                        // Record start time for this scene to update the currentSceneIdx later
                        sceneDurations.current.push(totalTime);
                        totalTime += sceneTl.duration();
                        
                    } catch (e) {
                        console.error("Failed to render scene:", scene, e);
                    }
                });

                timelineRef.current = masterTl;
                
                // Show the first scene immediately
                if (sceneRefs.current[0]) {
                    gsap.set(sceneRefs.current[0], { autoAlpha: 1 });
                }
            }
        };

        if (typeof gsap === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
            script.onload = buildTimeline;
            document.body.appendChild(script);
        } else {
            buildTimeline();
        }
    }, [store.script, theme, layout]);

    // Playback loop
    const tickPlayback = useCallback(() => {
        const tl = timelineRef.current;
        if (!tl) return;
        const p = tl.progress();
        setProgress(p);
        
        // Find which scene is currently playing based on time
        const currentTime = tl.time();
        let idx = 0;
        for (let i = 0; i < sceneDurations.current.length; i++) {
            if (currentTime >= sceneDurations.current[i]) {
                idx = i;
            }
        }
        setCurrentSceneIdx(idx);

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

    const goPrevScene = useCallback(() => {
        const tl = timelineRef.current;
        if (!tl) return;
        const prevIdx = Math.max(0, currentSceneIdx - 1);
        tl.time(sceneDurations.current[prevIdx] || 0);
        setProgress(tl.progress());
        setCurrentSceneIdx(prevIdx);
    }, [currentSceneIdx]);

    const goNextScene = useCallback(() => {
        const tl = timelineRef.current;
        if (!tl) return;
        const nextIdx = Math.min(sceneDurations.current.length - 1, currentSceneIdx + 1);
        tl.time(sceneDurations.current[nextIdx] || 0);
        setProgress(tl.progress());
        setCurrentSceneIdx(nextIdx);
    }, [currentSceneIdx]);

    return (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
            {/* Base Background & Scaled Viewport Container */}
            <div ref={wrapRef} style={{ position: 'absolute', inset: 0, backgroundColor: '#080a0f', overflow: 'hidden' }}>
                <div ref={viewportRef} style={{ width: '1080px', height: '1920px', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                    {store.script?.scenes?.map((scene, i) => (
                        <div 
                            key={scene.id || i}
                            ref={el => sceneRefs.current[i] = el}
                            style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', alignItems: 'center',
                                padding: '80px', boxSizing: 'border-box',
                                wordBreak: 'break-word',
                                visibility: 'hidden', opacity: 0
                            }}
                        />
                    ))}
                    
                    {/* Film grain overlay */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.35%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
                </div>
            </div>

            {/* Header Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10, pointerEvents: 'none' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Duyệt kịch bản</h3>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Scene {currentSceneIdx + 1} / {store.script?.scenes?.length || 0}</span>
            </div>

            {/* Footer Controls Overlay — compact */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--vgl-accent)', transition: isPlaying ? 'none' : 'width 0.2s' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <button onClick={goPrevScene} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                        <CaretLeft size={14} weight="bold" />
                    </button>
                    <button onClick={togglePlayback} style={{ background: 'var(--vgl-accent)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--vgl-accent-subtle)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                    </button>
                    <button onClick={goNextScene} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                        <CaretRight size={14} weight="bold" />
                    </button>
                </div>

                <button 
                    onClick={() => store.continuePipeline()}
                    style={{ width: '100%', padding: '10px', background: 'var(--vgl-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px var(--vgl-accent-subtle)' }}
                >
                    <Play size={14} weight="fill" />
                    Bắt đầu Render
                </button>
            </div>
        </div>
    );
}
