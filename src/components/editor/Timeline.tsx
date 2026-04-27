import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { TimelineToolbar } from './TimelineToolbar';
import { TrackHeader } from './TrackHeader';
import { TrackRow } from './TrackRow';
import { AudioMixer } from '../../lib/audioMixer';
import { getTrackOrder, isOverlayTrack } from '../../types/timeline';
import { projectToVideoClip, segmentsToSubtitleClips } from '../../utils/timelineMigration';
import { SubtitleClip, ClipType } from '../../types/timeline';

const TIMELINE_OFFSET_X = 4;

// ─── TimelineRuler (giữ nguyên logic cũ) ───
function formatTimeShortLocal(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TimelineRuler = memo(({ width, pixelsPerSecond, scrollLeft, viewportWidth }: any) => {
  const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 14400, 28800, 43200, 86400];
  const minSpacing = 100;
  
  let labelInterval = niceIntervals[niceIntervals.length - 1];
  for (const interval of niceIntervals) {
    if (interval * pixelsPerSecond >= minSpacing) {
      labelInterval = interval;
      break;
    }
  }

  const startIdx = Math.floor(scrollLeft / pixelsPerSecond / labelInterval);
  const endIdx = Math.ceil((scrollLeft + viewportWidth) / pixelsPerSecond / labelInterval);
  
  const labels = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const time = i * labelInterval;
    const x = time * pixelsPerSecond;
    labels.push({ id: i, text: formatTimeShortLocal(time), x });
  }

  const tickStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: -scrollLeft + TIMELINE_OFFSET_X, width, height: '100%',
    backgroundImage: `
      repeating-linear-gradient(to right, var(--border-subtle) 0, var(--border-subtle) 1px, transparent 1px, transparent ${pixelsPerSecond}px),
      repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent ${pixelsPerSecond * 5}px)
    `,
    backgroundSize: `${pixelsPerSecond}px 8px, ${pixelsPerSecond * 5}px 14px`,
    backgroundPosition: '0 100%, 0 100%',
    backgroundRepeat: 'repeat-x',
    pointerEvents: 'none'
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: viewportWidth || '100%', height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 10, overflow: 'hidden' }}>
      <div style={tickStyle} />
      {labels.map(l => (
        <div key={l.id} style={{ position: 'absolute', left: l.x + TIMELINE_OFFSET_X - scrollLeft, top: 4, fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: 'var(--font-mono)' } as any}>
          {l.text}
        </div>
      ))}
    </div>
  );
});

// ─── Main Timeline Component ───
interface TimelineProps {
  filePaths: string[];
}

export function Timeline({ filePaths }: TimelineProps) {
  const config = useProjectStore();
  const { timelineZoom, updateConfig, snapEnabled, snapThreshold, selectedClipId } = config;
  const { videoDuration, segments, activeFile, selectedId } = useSubtitleStore();
  const timelineStore = useTimelineStore();

  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [resizingClip, setResizingClip] = useState<{ clipId: string; side: 'left' | 'right' } | null>(null);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);
  const [ghostState, setGhostState] = useState<{ x: number; width: number; trackY: number } | null>(null);
  const [insertIndicator, setInsertIndicator] = useState<{ trackId: string; timePosition: number; index: number } | null>(null);
  const [highlightTrackId, setHighlightTrackId] = useState<string | null>(null);

  // Dynamic track order (overlay tracks between SUB and MAIN)
  const overlayIds = timelineStore.overlayTrackIds || [];
  const trackOrder = useMemo(() => getTrackOrder(overlayIds), [overlayIds]);

  const pixelsPerSecond = Math.max(0.0001, 50 * timelineZoom);
  const currentVideoPath = activeFile || (filePaths.length > 0 ? filePaths[0] : null);
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  const activeDuration = config.vid_clip_duration || videoDuration || 0;

  // ─── Timeline Offset: ripple khi chưa sub ───
  // Khi chưa có subtitle: clip dồn về 0 trên timeline (timelineOffset = vid_clip_start)
  // Khi có subtitle: giữ clip tại vid_clip_start (timelineOffset = 0) để subtitle sync
  const timelineOffset = segments.length === 0 ? (config.vid_clip_start || 0) : 0;

  // ─── Migration: sync old stores → clip model ───
  useEffect(() => {
    if (videoDuration > 1) {
      if (!config.vid_clip_duration || config.vid_clip_duration < videoDuration - 0.1 || !isFinite(config.vid_clip_duration)) {
        updateConfig({ vid_clip_duration: videoDuration, vid_clip_start: 0 });
      }
    }
  }, [videoDuration]);

  useEffect(() => {
    const clips: (import('../../types/timeline').Clip | SubtitleClip)[] = [];

    // Video → Main Track (apply timelineOffset for ripple)
    if (currentVideoPath && activeDuration > 0) {
      const vidClip = projectToVideoClip(config, currentVideoPath, activeDuration);
      vidClip.timelineStart = (config.vid_clip_start || 0) - timelineOffset;
      clips.push(vidClip);
    }

    // BGM → BGM Track (chỉ khi đã được place lên timeline qua drag-drop)
    // Audio clip không tự tạo từ config — user phải drag từ Media Bin
    // Legacy compat: nếu đã có clip BGM trong store thì giữ lại
    const existingBgmClips = timelineStore.getTrackClips('bgm');
    existingBgmClips.forEach(c => clips.push(c));

    // Subtitles → SUB Track
    const subClips = segmentsToSubtitleClips(segments);
    clips.push(...subClips);

    timelineStore.setClips(clips);
  }, [currentVideoPath, activeDuration, config.vid_clip_start, segments, timelineOffset]);

  // ─── Duration / Zoom ───
  const rawDuration = Math.max(activeDuration, maxSubTime, timelineStore.getTotalDuration(), 1);
  const safeDuration = isFinite(rawDuration) ? rawDuration : 3600;

  const minZoom = useMemo(() => {
    if (safeDuration > 0 && viewportWidth > 0) {
      return ((viewportWidth - 40) / (safeDuration * 50)) * 0.2;
    }
    return 0.0001;
  }, [safeDuration, viewportWidth]);

  useEffect(() => {
    if (timelineZoom < minZoom && minZoom > 0) updateConfig({ timelineZoom: minZoom });
  }, [minZoom, timelineZoom]);

  const timelineWidthPx = Math.min(safeDuration * pixelsPerSecond + (500 * pixelsPerSecond), 30000000);

  // ─── Scroll / Viewport ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => { setScrollLeft(el.scrollLeft); setViewportWidth(el.clientWidth); };
    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);

  // ─── Snap ───
  const getSnapMetadata = (time: number) => {
    if (!snapEnabled) return { snapped: false, time };
    const snapPoints: number[] = [0];
    // Thu thập snap points từ TẤT CẢ clips trên mọi track
    Object.values(timelineStore.clips).forEach(clip => {
      snapPoints.push(clip.timelineStart);
      snapPoints.push(clip.timelineStart + clip.timelineDuration);
    });
    const threshold = snapThreshold / pixelsPerSecond;
    let closestTime = time;
    let snapped = false;
    let minDiff = threshold;
    snapPoints.forEach(p => {
      const diff = Math.abs(time - p);
      if (diff < minDiff) { minDiff = diff; closestTime = p; snapped = true; }
    });
    return { snapped, time: closestTime };
  };

  // ─── Playhead RAF ───
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = -1;
    const updatePlayhead = () => {
      if (playheadRef.current && !isDraggingPlayhead) {
        const video = document.querySelector('video');
        if (video) {
          const time = video.currentTime - timelineOffset; // Map video time → timeline pos
          if (time !== lastTime) {
            lastTime = time;
            setCurrentTime(time);
            playheadRef.current.style.transform = `translateX(${time * pixelsPerSecond + TIMELINE_OFFSET_X - scrollLeft}px)`;
          }
        }
      }
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    animationFrameId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pixelsPerSecond, isDraggingPlayhead, scrollLeft, timelineOffset]);

  // ─── Cross-track drop validation ───
  const canDropOnTrack = useCallback((clipType: ClipType, sourceTrackId: string, targetTrackId: string): boolean => {
    if (sourceTrackId === targetTrackId) return true; // same track = reposition
    if (clipType === 'video') return targetTrackId === 'main' || isOverlayTrack(targetTrackId) || targetTrackId === '__new_overlay__';
    if (clipType === 'audio') return ['bgm', 'tts'].includes(targetTrackId);
    return false; // subtitle: no cross-track
  }, []);

  // ─── Track-at-Y detection ───
  const getTrackAtY = useCallback((mouseY: number): string | null => {
    const rulerHeight = 26;
    let acc = rulerHeight;
    for (const tId of trackOrder) {
      const track = timelineStore.tracks[tId];
      if (!track) continue;
      const bottom = acc + track.height;
      if (mouseY >= acc && mouseY < bottom) return tId;
      acc = bottom;
    }
    // Phía trên tất cả tracks → tạo overlay mới
    if (mouseY < rulerHeight) return '__new_overlay__';
    return null;
  }, [trackOrder, timelineStore.tracks]);

  // ─── Insert position detection ───
  const detectInsertPosition = useCallback((trackId: string, timePos: number, excludeClipId: string) => {
    const state = useTimelineStore.getState();
    const clipIds = (state.trackClips[trackId] || []).filter(id => id !== excludeClipId);
    for (let i = 0; i <= clipIds.length; i++) {
      const prevClip = i > 0 ? state.clips[clipIds[i - 1]] : null;
      const nextClip = i < clipIds.length ? state.clips[clipIds[i]] : null;
      const gapStart = prevClip ? prevClip.timelineStart + prevClip.timelineDuration : 0;
      const gapEnd = nextClip ? nextClip.timelineStart : Infinity;
      const threshold = 0.5;
      if (Math.abs(timePos - gapStart) < threshold || (timePos >= gapStart && timePos <= gapEnd && gapEnd - gapStart > 0.1)) {
        return { index: i, snapTime: gapStart };
      }
    }
    return null;
  }, []);

  // ─── Pointer drag events (playhead + clip drag + resize) ───
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const tlbody = containerRef.current;
      if (!tlbody) return;
      const rect = tlbody.getBoundingClientRect();
      const x = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
      const mouseY = e.clientY - rect.top + tlbody.scrollTop;
      const newTime = Math.max(0, x / pixelsPerSecond);
      const { snapped, time: t } = getSnapMetadata(newTime);
      setActiveSnapTime(snapped ? t : null);

      if (isDraggingPlayhead) {
        setCurrentTime(t);
        if (playheadRef.current) playheadRef.current.style.transform = `translateX(${t * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
        const video = document.querySelector('video');
        if (video) video.currentTime = t + timelineOffset;
        AudioMixer.cancelTTS();
      }

      if (draggingClipId) {
        const clip = timelineStore.clips[draggingClipId];
        if (clip) {
          // Detect target track
          const targetTrackId = getTrackAtY(mouseY);
          const validDrop = targetTrackId ? canDropOnTrack(clip.type as ClipType, clip.trackId, targetTrackId) : false;
          setHighlightTrackId(validDrop ? targetTrackId : null);

          // Ghost preview
          const clipWidthPx = clip.timelineDuration * pixelsPerSecond;
          setGhostState({ x: e.clientX - rect.left - clipWidthPx / 2, width: clipWidthPx, trackY: mouseY });

          // Insert detection (trên target track hoặc track hiện tại)
          const checkTrack = (validDrop && targetTrackId && targetTrackId !== '__new_overlay__') ? targetTrackId : clip.trackId;
          const insertPos = detectInsertPosition(checkTrack, t, draggingClipId);
          setInsertIndicator(insertPos ? { trackId: checkTrack, timePosition: insertPos.snapTime, index: insertPos.index } : null);

          // Same-track reposition (backward compat)
          if (!targetTrackId || targetTrackId === clip.trackId || !validDrop) {
            if (clip.trackId === 'main') updateConfig({ vid_clip_start: t });
            else if (clip.trackId === 'bgm') updateConfig({ audio_timeline_start: t });
            timelineStore.updateClip(draggingClipId, { timelineStart: t });
          }
        }
      }

      if (resizingClip) {
        const clip = timelineStore.clips[resizingClip.clipId];
        if (!clip) return;
        if (clip.trackId === 'main') {
          const { vid_clip_start, vid_clip_duration } = useProjectStore.getState();
          const dur = vid_clip_duration || videoDuration;
          if (resizingClip.side === 'left') {
            const limit_t = vid_clip_start - (videoDuration - dur);
            const safe_t = Math.max(t, limit_t);
            const newDur = dur - (safe_t - vid_clip_start);
            updateConfig({ vid_clip_start: safe_t, vid_clip_duration: Math.max(0.1, newDur) });
          } else {
            updateConfig({ vid_clip_duration: Math.max(0.1, Math.min(videoDuration, t - vid_clip_start)) });
          }
        } else if (clip.trackId === 'bgm') {
          const { audio_timeline_start, audio_clip_duration } = useProjectStore.getState();
          const dur = audio_clip_duration || 200;
          if (resizingClip.side === 'left') {
            const safe_t = Math.max(0, t);
            const newDur = dur - (safe_t - audio_timeline_start);
            updateConfig({ audio_timeline_start: safe_t, audio_clip_duration: Math.max(0.1, newDur) });
          } else {
            updateConfig({ audio_clip_duration: Math.max(0.1, t - audio_timeline_start) });
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingPlayhead) AudioMixer.muteAll(false);

      // Cross-track drop logic
      if (draggingClipId && highlightTrackId) {
        const clip = timelineStore.clips[draggingClipId];
        if (clip && highlightTrackId !== clip.trackId) {
          if (highlightTrackId === '__new_overlay__') {
            // Tạo overlay track mới và di chuyển clip sang
            const newTrackId = timelineStore.createOverlayTrack();
            timelineStore.moveClipToTrack(draggingClipId, newTrackId);
          } else if (insertIndicator && insertIndicator.trackId === highlightTrackId) {
            // Ripple insert vào vị trí chính xác
            timelineStore.rippleInsert(draggingClipId, highlightTrackId, insertIndicator.index);
          } else {
            // Simple move
            timelineStore.moveClipToTrack(draggingClipId, highlightTrackId);
          }
          // Schedule cleanup overlay tracks trống
          if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
          cleanupTimerRef.current = window.setTimeout(() => timelineStore.cleanupEmptyOverlayTracks(), 500);
        } else if (clip && insertIndicator && insertIndicator.trackId === clip.trackId) {
          // Same-track ripple insert
          timelineStore.rippleInsert(draggingClipId, clip.trackId, insertIndicator.index);
        }
      }

      setIsDraggingPlayhead(false);
      setDraggingClipId(null);
      setResizingClip(null);
      setActiveSnapTime(null);
      setGhostState(null);
      setInsertIndicator(null);
      setHighlightTrackId(null);
      const video = document.querySelector('video');
      if (video && !video.paused) {
        AudioMixer.scheduleTTS(useSubtitleStore.getState().segments, video.currentTime);
      }
    };

    if (isDraggingPlayhead || draggingClipId || resizingClip) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPlayhead, draggingClipId, resizingClip, pixelsPerSecond, highlightTrackId, insertIndicator]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
        // Split at playhead — chỉ hoạt động cho subtitle (tạo 2 segments)
        // True video split (chia đôi thành 2 clips) cần multi-clip model → future phase
        if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
          useSubtitleStore.getState().splitSegment(selectedId, currentTime);
        }
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'q') {
        if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
          const seg = segments.find(s => s.id === selectedId);
          if (seg && currentTime > seg.start && currentTime < seg.end) {
            useSubtitleStore.getState().trimSegment(selectedId, currentTime, seg.end);
          }
        } else {
          config.splitLeft(currentTime, activeDuration);
        }
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'w') {
        if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
          const seg = segments.find(s => s.id === selectedId);
          if (seg && currentTime > seg.start && currentTime < seg.end) {
            useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
          }
        } else {
          config.splitRight(currentTime, activeDuration);
        }
        e.preventDefault();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId === 'audio-main') {
          updateConfig({ audio_enabled: false, audio_file: '', selectedClipId: null });
          e.preventDefault();
          return;
        }
        if (selectedId !== null) {
          if (e.shiftKey) {
            useSubtitleStore.getState().deleteAndRippleSubtitle(selectedId);
          } else {
            useSubtitleStore.getState().deleteSegment(selectedId);
          }
          e.preventDefault();
        }
        // Also handle new clip model delete
        const { selectedClipId: tsClipId } = timelineStore;
        if (tsClipId && !selectedClipId?.startsWith('sub-') && selectedClipId !== 'audio-main') {
          if (e.shiftKey) {
            timelineStore.rippleDelete(tsClipId);
          } else {
            timelineStore.removeClip(tsClipId);
          }
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, selectedClipId, selectedId, segments]);

  // ─── Zoom handlers ───
  const handleZoomIn = () => updateConfig({ timelineZoom: Math.min(10, timelineZoom + 0.5) });
  const handleZoomOut = () => updateConfig({ timelineZoom: Math.max(minZoom, timelineZoom - 0.5) });
  const handleFitToView = () => updateConfig({ timelineZoom: minZoom > 0 ? minZoom : 1 });

  // ─── Ctrl+Wheel zoom ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const currentZoom = useProjectStore.getState().timelineZoom;
        updateConfig({ timelineZoom: Math.max(minZoom, Math.min(10, currentZoom + (currentZoom * delta * 2))) });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [updateConfig]);

  // ─── Audio Add-to-Timeline (custom event from AudioLibrary) ───
  useEffect(() => {
    const handleAudioAdd = (e: Event) => {
      const { filePath } = (e as CustomEvent).detail;
      if (filePath) {
        const dur = 200; // Default — sẽ được AudioTrack cập nhật khi load metadata
        timelineStore.appendClipToTrack('bgm', { type: 'audio', sourceFile: filePath, sourceStart: 0, sourceDuration: dur, timelineDuration: dur });
      }
    };
    window.addEventListener('add-audio-to-timeline', handleAudioAdd);
    return () => window.removeEventListener('add-audio-to-timeline', handleAudioAdd);
  }, []);

  // ─── Media Bin Drag-Drop (D-10, D-11) ───
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const { filePath, mediaType, duration } = JSON.parse(data);
      if (mediaType === 'video') {
        timelineStore.appendClipToTrack('main', { type: 'video', sourceFile: filePath, sourceStart: 0, sourceDuration: duration || 0, timelineDuration: duration || 0 });
      } else if (mediaType === 'audio') {
        const dur = duration || 200;
        timelineStore.appendClipToTrack('bgm', { type: 'audio', sourceFile: filePath, sourceStart: 0, sourceDuration: dur, timelineDuration: dur });
        // Sync config cho backward compat (Properties panel)
        updateConfig({ audio_enabled: true, audio_file: filePath, audio_clip_duration: dur });
      }
    } catch { /* invalid JSON */ }
  };

  // ─── Clip interaction handlers ───
  const handleClipSelect = (clipId: string) => {
    timelineStore.selectClip(clipId);
    const clip = timelineStore.clips[clipId];
    if (clip?.type === 'subtitle') {
      // Backward compat: sync with old selectedClipId format
      const subId = clipId.startsWith('sub-') ? parseInt(clipId.replace('sub-', ''), 10) : null;
      updateConfig({ selectedClipId: clipId });
      if (subId !== null) {
        useSubtitleStore.getState().selectSegment(subId);
        window.dispatchEvent(new CustomEvent('focus-subtitle-panel', { detail: subId }));
      }
    } else if (clip?.trackId === 'main') {
      updateConfig({ selectedClipId: 'vid-main' });
    } else if (clip?.trackId === 'bgm') {
      updateConfig({ selectedClipId: 'audio-main' });
    }
  };

  const handleClipDragStart = (clipId: string, _e: React.PointerEvent) => {
    const clip = timelineStore.clips[clipId];
    if (clip && clip.type !== 'subtitle') {
      setDraggingClipId(clipId);
    }
  };

  const handleClipResizeStart = (clipId: string, side: 'left' | 'right', _e: React.PointerEvent) => {
    const clip = timelineStore.clips[clipId];
    if (clip && clip.type !== 'subtitle') {
      setResizingClip({ clipId, side });
    }
  };

  // ─── Render ───
  return (
    <div className="tl" style={{ flexShrink: 0, height: '100%', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', userSelect: 'none' }}>
      
      <TimelineToolbar
        onSplit={() => { if (selectedClipId?.startsWith('sub-') && selectedId !== null) useSubtitleStore.getState().splitSegment(selectedId, currentTime); }}
        onSplitLeft={() => {
          if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
            const seg = segments.find(s => s.id === selectedId);
            if (seg && currentTime > seg.start && currentTime < seg.end) useSubtitleStore.getState().trimSegment(selectedId, currentTime, seg.end);
          } else { config.splitLeft(currentTime, activeDuration); }
        }}
        onSplitRight={() => {
          if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
            const seg = segments.find(s => s.id === selectedId);
            if (seg && currentTime > seg.start && currentTime < seg.end) useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
          } else { config.splitRight(currentTime, activeDuration); }
        }}
        onResetDuration={() => updateConfig({ vid_clip_duration: videoDuration })}
        onDelete={() => {
          if (selectedClipId === 'audio-main') updateConfig({ audio_enabled: false, audio_file: '', selectedClipId: null });
          else if (selectedId !== null) useSubtitleStore.getState().deleteSegment(selectedId);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={handleFitToView}
        zoom={timelineZoom}
        minZoom={minZoom}
        onZoomChange={(z) => updateConfig({ timelineZoom: z })}
        canSplit={!!selectedClipId}
        canDelete={selectedClipId === 'audio-main' || selectedId !== null}
        canResetDuration={!!videoDuration}
      />

      <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
        
        {/* Track headers column */}
        <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', zIndex: 20 }}>
          <div style={{ height: 26, borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }} />
          {trackOrder.map(trackId => {
            const track = timelineStore.tracks[trackId];
            if (!track) return null;
            return (
              <TrackHeader
                key={trackId}
                track={track}
                onToggleMute={() => timelineStore.toggleTrackMute(trackId)}
                onToggleLock={() => timelineStore.toggleTrackLock(trackId)}
                onToggleVisibility={() => timelineStore.toggleTrackVisibility(trackId)}
              />
            );
          })}
        </div>

        {/* Scrollable track content */}
        <div
          className="tlbody"
          ref={containerRef}
          onPointerDown={(e) => {
            const tlbody = containerRef.current;
            if (!tlbody) return;
            const rect = tlbody.getBoundingClientRect();
            const pointerX = e.clientX - rect.left + tlbody.scrollLeft;
            const newTime = Math.max(0, (pointerX - TIMELINE_OFFSET_X) / pixelsPerSecond);
            const { time: snappedTime } = getSnapMetadata(newTime);
            const video = document.querySelector('video');
            if (video) video.currentTime = snappedTime + timelineOffset; // Map timeline pos → video time
            setCurrentTime(snappedTime);
            if (playheadRef.current) playheadRef.current.style.transform = `translateX(${snappedTime * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
            updateConfig({ selectedClipId: null });
            useSubtitleStore.getState().selectSegment(null);
            timelineStore.selectClip(null);
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg-primary)', display: 'block' }}
        >
          <div style={{ width: timelineWidthPx, height: 1, pointerEvents: 'none' }} />

          <div style={{ position: 'sticky', left: 0, top: 0, width: viewportWidth || '100%', height: '100%', pointerEvents: 'none', display: 'block' }}>
            <TimelineRuler width={viewportWidth} pixelsPerSecond={pixelsPerSecond} scrollLeft={scrollLeft} viewportWidth={viewportWidth} />
            
            <div className="tllist" style={{ paddingTop: 26, height: '100%', pointerEvents: 'auto', position: 'relative' }}>
              
              {/* Snap indicator */}
              {activeSnapTime !== null && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: activeSnapTime * pixelsPerSecond + TIMELINE_OFFSET_X - scrollLeft, width: '1px', background: '#22c55e', zIndex: 50, pointerEvents: 'none' }} />
              )}

              {/* New Overlay Drop Zone (chỉ hiện khi đang kéo video clip) */}
              {draggingClipId && timelineStore.clips[draggingClipId]?.type === 'video' && (
                <div
                  style={{
                    height: 20,
                    background: highlightTrackId === '__new_overlay__' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.04)',
                    borderBottom: '1px dashed rgba(167, 139, 250, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'var(--text-muted)', transition: 'background 0.15s ease',
                  }}
                >
                  {highlightTrackId === '__new_overlay__' ? '+ Thả để tạo Overlay Track' : ''}
                </div>
              )}

              {/* Dynamic Track rows */}
              {trackOrder.map(trackId => {
                const track = timelineStore.tracks[trackId];
                if (!track) return null;
                return (
                  <TrackRow
                    key={trackId}
                    track={track}
                    clips={timelineStore.getTrackClips(trackId)}
                    pixelsPerSecond={pixelsPerSecond}
                    scrollLeft={scrollLeft}
                    viewportWidth={viewportWidth}
                    timelineWidth={timelineWidthPx}
                    selectedClipId={timelineStore.selectedClipId}
                    isHighlighted={highlightTrackId === trackId}
                    onClipSelect={handleClipSelect}
                    onClipDragStart={handleClipDragStart}
                    onClipResizeStart={handleClipResizeStart}
                  />
                );
              })}

              {/* Insert indicator (vạch xanh) */}
              {insertIndicator && (
                <div
                  style={{
                    position: 'absolute',
                    left: insertIndicator.timePosition * pixelsPerSecond + TIMELINE_OFFSET_X - scrollLeft,
                    top: 26, bottom: 0,
                    width: 2,
                    background: '#22c55e',
                    zIndex: 150,
                    pointerEvents: 'none',
                    animation: 'pulse-insert 1s ease-in-out infinite',
                  }}
                />
              )}

              {/* Ghost preview (hình mờ khi đang kéo) */}
              {ghostState && draggingClipId && (
                <div
                  style={{
                    position: 'absolute',
                    left: ghostState.x,
                    top: ghostState.trackY - 20,
                    width: ghostState.width,
                    height: 40,
                    background: highlightTrackId ? 'var(--accent-subtle)' : 'rgba(239,68,68,0.1)',
                    opacity: 0.45,
                    border: `2px dashed ${highlightTrackId ? 'var(--accent)' : '#ef4444'}`,
                    borderRadius: 6,
                    pointerEvents: 'none',
                    zIndex: 200,
                    transition: 'left 0.03s linear, top 0.03s linear',
                  }}
                />
              )}

              {/* Playhead */}
              <div
                className="playhead-fixed"
                ref={playheadRef}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingPlayhead(true);
                  AudioMixer.muteAll(true);
                  AudioMixer.cancelTTS();
                }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, marginLeft: -7, zIndex: 100, pointerEvents: 'auto', cursor: 'ew-resize', display: 'flex', justifyContent: 'center', transform: `translateX(${TIMELINE_OFFSET_X - scrollLeft}px)`, transition: isDraggingPlayhead ? 'none' : 'transform 0.05s linear' }}
              >
                <div style={{ width: 1, height: '100%', background: '#e11d48', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: -4, width: 0, height: 0, borderLeft: '4.5px solid transparent', borderRight: '4.5px solid transparent', borderTop: '7px solid #e11d48' }} />
                  <div style={{ position: 'absolute', top: 7, left: -4, width: 9, height: 2, background: '#e11d48' }} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
