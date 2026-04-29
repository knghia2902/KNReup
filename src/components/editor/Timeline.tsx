import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useTimelineStore } from '../../stores/useTimelineStore';
import { TimelineToolbar } from './TimelineToolbar';
import { TrackHeader } from './TrackHeader';
import { TrackRow } from './TrackRow';
import { AudioMixer } from '../../lib/audioMixer';
import { getTrackOrder, isOverlayTrack } from '../../types/timeline';
import { projectToVideoClip, projectToAudioClip, segmentsToSubtitleClips, segmentsToTTSClips } from '../../utils/timelineMigration';
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
  const wasPlayingBeforeDragRef = useRef(false); // Pause video during drag, resume on mouseup
  const lastDraggedTimeRef = useRef<number | null>(null); // Last position during playhead drag
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [resizingClip, setResizingClip] = useState<{ clipId: string; side: 'left' | 'right'; origStart: number; origEnd: number } | null>(null);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);
  const [highlightTrackId, setHighlightTrackId] = useState<string | null>(null);

  const dragTimeRef = useRef<{ time: number } | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const lastMouseYRef = useRef<number>(0); // Track mouse Y for cross-track drop detection
  const resizeDataRef = useRef<{ start: number; duration: number } | null>(null);

  // Dynamic track order (overlay tracks between SUB and MAIN)
  const overlayIds = timelineStore.overlayTrackIds || [];
  const trackOrder = useMemo(() => getTrackOrder(overlayIds), [overlayIds]);

  const pixelsPerSecond = Math.max(0.0001, 50 * timelineZoom);
  const currentVideoPath = activeFile || (filePaths.length > 0 ? filePaths[0] : null);
  const maxSubTime = segments.length > 0 ? segments[segments.length - 1].end : 0;
  // activeDuration = end of the last clip on main track (covers all split clips)
  const mainTrackEnd = useMemo(() => {
    const mainClips = timelineStore.getTrackClips('main');
    if (mainClips.length === 0) return config.vid_clip_duration || videoDuration || 0;
    return Math.max(...mainClips.map(c => c.timelineStart + c.timelineDuration));
  }, [timelineStore.clips, config.vid_clip_duration, videoDuration]);
  const activeDuration = mainTrackEnd || videoDuration || 0;

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

  const currentVideoPathRef = useRef<string | null>(null);

  useEffect(() => {
    // If video file changed, we must re-seed the timeline
    const isNewVideo = currentVideoPath !== currentVideoPathRef.current;
    if (isNewVideo) {
      currentVideoPathRef.current = currentVideoPath || null;
    }

    const clips: (import('../../types/timeline').Clip | SubtitleClip)[] = [];

    // Video → Main Track
    // Only seed from config if it's a new video OR if the store is empty of main clips
    const existingMainClips = timelineStore.getTrackClips('main');
    
    if (isNewVideo || existingMainClips.length === 0) {
      if (currentVideoPath && (config.vid_clip_duration || videoDuration) > 0) {
        const vidClip = projectToVideoClip(config, currentVideoPath, config.vid_clip_duration || videoDuration);
        vidClip.timelineStart = 0;
        vidClip.sourceStart = config.vid_clip_start || 0;
        clips.push(vidClip);
      }
    } else {
      // Preserve ALL existing video clips (main and splits)
      existingMainClips.forEach(c => clips.push(c));
    }

    // BGM → BGM Track (create from config if none exists, preserve existing)
    const existingBgmClips = timelineStore.getTrackClips('bgm');
    if (existingBgmClips.length > 0) {
      existingBgmClips.forEach(c => clips.push(c));
    } else if (config.audio_enabled && config.audio_file) {
      const audioClip = projectToAudioClip(config);
      if (audioClip) clips.push(audioClip);
    }

    // Subtitles → SUB Track
    const subClips = segmentsToSubtitleClips(segments);
    clips.push(...subClips);

    // TTS → TTS Track
    const ttsClips = segmentsToTTSClips(segments);
    clips.push(...ttsClips);

    timelineStore.setClips(clips);
    timelineStore.compactTrack('main');
  }, [currentVideoPath, config.vid_clip_duration, config.vid_clip_start, segments, timelineOffset]);

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
  const virtualTimeRef = useRef<{ active: boolean; startWall: number; startTime: number }>({ active: false, startWall: 0, startTime: 0 });
  const virtualCompletedRef = useRef(false); // Prevent re-triggering after reaching totalEnd
  const pausedVirtualTimeRef = useRef<number | null>(null); // Seek position past video end (paused)

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = -1;
    const video = document.querySelector('video');

    const onPlay = () => {
      virtualCompletedRef.current = false;
      virtualTimeRef.current.active = false;
      // NOTE: Do NOT clear pausedVirtualTimeRef here.
      // It is consumed explicitly by onPlayRequested.
      // Clearing it here would lose the stored seek position
      // when user seeks past video end then presses Play.
    };

    // Explicitly handle 'ended' to start virtual playhead mode
    const onEnded = () => {
      if (virtualCompletedRef.current) return;
      const totalEnd = timelineStore.getTotalDuration();
      console.log('[Timeline] Video ended, totalEnd=', totalEnd, 'videoDuration=', video?.duration);
      if (video && totalEnd > video.duration + 0.5) {
        // If user seeked to a position past video end, start from there
        const startFrom = pausedVirtualTimeRef.current !== null ? pausedVirtualTimeRef.current : video.duration;
        pausedVirtualTimeRef.current = null;
        console.log('[Timeline] Starting virtual playhead from', startFrom, 'to', totalEnd);
        virtualTimeRef.current = { active: true, startWall: performance.now(), startTime: startFrom };
        window.dispatchEvent(new CustomEvent('virtual-playhead-started'));
      }
    };

    // Stop virtual playhead on manual pause
    const onStopVirtual = () => {
      if (virtualTimeRef.current.active) {
        console.log('[Timeline] Stopping virtual playhead (user pause)');
        // Save current virtual position for potential resume
        const currentVirtualTime = virtualTimeRef.current.startTime + (performance.now() - virtualTimeRef.current.startWall) / 1000;
        pausedVirtualTimeRef.current = currentVirtualTime;
        virtualTimeRef.current.active = false;
        const bgm = document.querySelector('audio[data-bgm]');
        if (bgm && !(bgm as HTMLAudioElement).paused) (bgm as HTMLAudioElement).pause();
        // Notify VideoControls to show Play button
        window.dispatchEvent(new CustomEvent('virtual-playhead-ended'));
      }
    };

    // Seek back into video range → stop virtual mode
    const onSeeked = () => {
      if (video && !video.ended) {
        virtualTimeRef.current.active = false;
        virtualCompletedRef.current = false;
        pausedVirtualTimeRef.current = null;
      }
    };

    // Play requested — centralized handler for ALL play actions
    const onPlayRequested = () => {
      const totalEnd = timelineStore.getTotalDuration();
      
      if (pausedVirtualTimeRef.current !== null) {
        // We have a stored position (from seeking past video end)
        const storedTime = pausedVirtualTimeRef.current;
        
        if (video && storedTime <= video.duration) {
          // Stored position is within video range — resume normal playback
          console.log('[Timeline] Play from stored position (within video):', storedTime.toFixed(2));
          pausedVirtualTimeRef.current = null;
          virtualCompletedRef.current = false;
          virtualTimeRef.current.active = false;
          video.currentTime = Math.max(0, Math.min(storedTime, video.duration - 0.01));
          video.play();
          setVideoEnded_force(false);
        } else if (storedTime < totalEnd) {
          // Stored position is past video but within timeline — start virtual playhead
          console.log('[Timeline] Resume virtual from pausedVirtualTime=', storedTime.toFixed(2));
          pausedVirtualTimeRef.current = null;
          virtualCompletedRef.current = false;
          virtualTimeRef.current = { active: true, startWall: performance.now(), startTime: storedTime };
          // Ensure video is paused and shows black screen
          if (video && !video.paused) video.pause();
          setVideoEnded_force(true);
          window.dispatchEvent(new CustomEvent('virtual-playhead-started'));
          // Resume BGM from stored position
          const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
          if (bgm && bgm.readyState > 0) {
            const bgmOffset = storedTime - (config.audio_timeline_start || 0);
            if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
              bgm.currentTime = bgmOffset;
              bgm.play().catch(e => console.warn('[BGM] virtual resume failed:', e));
            }
          }
        } else {
          // Past total end — restart from 0
          console.log('[Timeline] Past total end, restart from beginning');
          pausedVirtualTimeRef.current = null;
          virtualCompletedRef.current = false;
          virtualTimeRef.current.active = false;
          if (video) {
            const firstClip = timelineStore.getTrackClips('main')[0];
            video.currentTime = firstClip?.sourceStart || 0;
            video.play();
          }
          setVideoEnded_force(false);
        }
      } else if (video && !video.ended && video.paused) {
        // No stored position, video paused within range — simple resume
        // Make sure native video is strictly aligned with our current timeline playhead (lastTime)
        const mainClips = timelineStore.getTrackClips('main');
        const activeClip = mainClips.find(c => lastTime >= c.timelineStart && lastTime < c.timelineStart + c.timelineDuration);
        
        if (activeClip) {
          const offsetInClip = lastTime - activeClip.timelineStart;
          const sourceTime = activeClip.sourceStart + Math.max(0, offsetInClip);
          // If video drifted or user dragged playhead without setting currentTime properly, snap it now
          if (Math.abs(video.currentTime - sourceTime) > 0.1) {
            video.currentTime = sourceTime;
          }
        } else if (mainClips.length > 0) {
           // Fallback to first clip if playhead is before everything
           if (lastTime < mainClips[0].timelineStart) {
             video.currentTime = mainClips[0].sourceStart;
           }
        }
        
        console.log('[Timeline] Simple resume from', video.currentTime.toFixed(2));
        video.play();
        setVideoEnded_force(false);
      } else if (video) {
        // Video ended or other state — restart from 0
        console.log('[Timeline] Restart from beginning');
        pausedVirtualTimeRef.current = null;
        virtualCompletedRef.current = false;
        virtualTimeRef.current.active = false;
        const firstClip = timelineStore.getTrackClips('main')[0];
        video.currentTime = firstClip?.sourceStart || 0;
        video.play();
        setVideoEnded_force(false);
      }
    };
    // Helper to clear black screen
    const setVideoEnded_force = (val: boolean) => {
      window.dispatchEvent(new CustomEvent(val ? 'force-video-ended' : 'force-video-playing'));
    };

    if (video) {
      video.addEventListener('play', onPlay);
      video.addEventListener('ended', onEnded);
      video.addEventListener('seeked', onSeeked);
    }
    window.addEventListener('stop-virtual-playhead', onStopVirtual);
    window.addEventListener('play-requested', onPlayRequested);

    const updatePlayhead = () => {
      if (playheadRef.current && !isDraggingPlayhead) {
        const v = document.querySelector('video');
        if (v) {
          const totalEnd = timelineStore.getTotalDuration();
          let time: number;

          if (virtualTimeRef.current.active) {
            // Virtual playhead: advance using wall clock
            time = virtualTimeRef.current.startTime + (performance.now() - virtualTimeRef.current.startWall) / 1000;

            // Sync BGM during virtual playhead mode
            const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
            if (bgm && bgm.readyState > 0) {
              const bgmOffset = time - (config.audio_timeline_start || 0);
              const bgmDur = bgm.duration && isFinite(bgm.duration) ? bgm.duration : 9999;
              if (bgmOffset >= 0 && bgmOffset < bgmDur) {
                if (bgm.paused) bgm.play().catch(() => {});
                if (Math.abs(bgm.currentTime - bgmOffset) > 0.5) bgm.currentTime = bgmOffset;
              } else if (!bgm.paused) {
                bgm.pause();
              }
            }

            if (time >= totalEnd) {
              time = totalEnd;
              virtualTimeRef.current.active = false;
              virtualCompletedRef.current = true;
              pausedVirtualTimeRef.current = totalEnd;
              if (v && !v.paused) v.pause();
              const bgmEl = document.querySelector('audio[data-bgm]');
              if (bgmEl && !(bgmEl as HTMLAudioElement).paused) (bgmEl as HTMLAudioElement).pause();
              window.dispatchEvent(new CustomEvent('virtual-playhead-ended'));
            }
          } else if (pausedVirtualTimeRef.current !== null) {
            // Paused at a position past video end
            time = pausedVirtualTimeRef.current;
          } else {
            // Normal mode: timeline drives video, but video playback drives timeline time
            const mainClips = timelineStore.getTrackClips('main');
            
            // Find the clip that corresponds to the CURRENT timeline position (lastTime)
            const activeClip = mainClips.find(c => 
              lastTime >= c.timelineStart && lastTime < c.timelineStart + c.timelineDuration
            );

            if (activeClip) {
              const clipSourceEnd = activeClip.sourceStart + activeClip.timelineDuration;
              if (v.currentTime >= clipSourceEnd) {
                // The native video played past the end of the current timeline clip!
                // We MUST jump over the gap to the next clip on the timeline.
                const nextClip = mainClips.find(c => c.timelineStart >= activeClip.timelineStart + activeClip.timelineDuration - 0.05);
                
                if (nextClip) {
                  v.currentTime = nextClip.sourceStart;
                  time = nextClip.timelineStart;
                } else {
                  // No next clip found, but we reached the end of the last clip
                  time = activeClip.timelineStart + activeClip.timelineDuration;
                }
              } else {
                // Video is playing within the active clip. Translate source time to timeline time.
                // Enforce it doesn't go backwards if user seeks fast
                const expectedTime = activeClip.timelineStart + Math.max(0, v.currentTime - activeClip.sourceStart);
                time = expectedTime;
              }
            } else {
              // Fallback if playhead is somehow completely out of bounds of any clip
              const fallbackClip = mainClips.find(c => v.currentTime >= c.sourceStart && v.currentTime < c.sourceStart + c.timelineDuration);
              if (fallbackClip) {
                time = fallbackClip.timelineStart + (v.currentTime - fallbackClip.sourceStart);
              } else {
                const mainTrackEnd = mainClips.length > 0 
                  ? Math.max(...mainClips.map(c => c.timelineStart + c.timelineDuration))
                  : 0;
                  
                if (lastTime >= mainTrackEnd) {
                   if (v && !v.paused) v.pause();
                   virtualTimeRef.current = { active: true, startWall: performance.now(), startTime: lastTime };
                   window.dispatchEvent(new CustomEvent('virtual-playhead-started'));
                   window.dispatchEvent(new CustomEvent('force-video-ended'));
                   time = lastTime;
                } else {
                   time = v.currentTime - timelineOffset;
                }
              }
            }
          }

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
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('stop-virtual-playhead', onStopVirtual);
      window.removeEventListener('play-requested', onPlayRequested);
      if (video) {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('seeked', onSeeked);
      }
    };
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



  // ─── Pointer drag events (playhead + clip drag + resize) ───
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const tlbody = containerRef.current;
      if (!tlbody) return;
      const rect = tlbody.getBoundingClientRect();
      const x = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
      const mouseY = e.clientY - rect.top + tlbody.scrollTop;
      lastMouseYRef.current = mouseY;
      const newTime = Math.max(0, x / pixelsPerSecond);
      const { snapped, time: t } = getSnapMetadata(newTime);
      setActiveSnapTime(snapped ? t : null);

      if (isDraggingPlayhead) {
        virtualTimeRef.current.active = false;
        virtualCompletedRef.current = false;
        lastDraggedTimeRef.current = t;
        setCurrentTime(t);
        if (playheadRef.current) playheadRef.current.style.transform = `translateX(${t * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
        const video = document.querySelector('video');
        if (video) {
          if (t + timelineOffset > video.duration) {
            // Past video end — store as paused virtual position, sync BGM
            pausedVirtualTimeRef.current = t;
            // Pause video and show black screen
            if (!video.paused) video.pause();
            window.dispatchEvent(new CustomEvent('force-video-ended'));
            const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
            if (bgm && bgm.readyState > 0) {
              if (!bgm.paused) bgm.pause();
              const bgmOffset = t - (config.audio_timeline_start || 0);
              if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                bgm.currentTime = bgmOffset;
              }
            }
          } else {
            pausedVirtualTimeRef.current = null;
            const mainClips = timelineStore.getTrackClips('main');
            const activeClip = mainClips.find(c => t >= c.timelineStart && t < c.timelineStart + c.timelineDuration);
            
            if (activeClip) {
              const offsetInClip = t - activeClip.timelineStart;
              const sourceTime = activeClip.sourceStart + offsetInClip;
              video.currentTime = Math.max(0, Math.min(sourceTime, video.duration - 0.01));
            } else {
              // Fallback if out of bounds (should not normally happen with magnetic track)
              const clampedT = Math.min(t + timelineOffset, video.duration - 0.01);
              video.currentTime = Math.max(0, clampedT);
            }
            
            // Sync BGM to dragged position
            const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
            if (bgm && bgm.readyState > 0) {
              const bgmOffset = t - (config.audio_timeline_start || 0);
              if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                bgm.currentTime = bgmOffset;
              }
            }
          }
        }
        AudioMixer.cancelTTS();
      }



      if (draggingClipId) {
        const clip = timelineStore.clips[draggingClipId];
        if (clip) {
          // Pure DOM drag — zero React overhead
          const adjustedTime = Math.max(0, t - dragOffsetRef.current);
          dragTimeRef.current = { time: adjustedTime };

          // Move clip element directly via DOM (no store update, no re-render)
          const clipEl = containerRef.current?.querySelector(`[data-clip-id="${draggingClipId}"]`) as HTMLElement | null;
          if (clipEl) {
            clipEl.style.left = `${adjustedTime * pixelsPerSecond}px`;
          }
        }
      }

      if (resizingClip) {
        const clip = timelineStore.clips[resizingClip.clipId];
        if (!clip) return;
        const dt = t;

        if (clip.trackId === 'main') {
          // Find collision bounds from adjacent split clips
          const mainClipIds = (useTimelineStore.getState().trackClips['main'] || []).filter((id: string) => id !== resizingClip.clipId);
          const neighbors = mainClipIds.map((id: string) => timelineStore.clips[id]).filter(Boolean);

          const origStart = resizingClip.origStart;
          const origEnd = resizingClip.origEnd;
          let newStart = origStart;
          let newDur = origEnd - origStart;

          if (resizingClip.side === 'left') {
            newStart = Math.max(0, dt);
            // Don't extend left past previous clip's end
            for (const n of neighbors) {
              const nEnd = n.timelineStart + n.timelineDuration;
              if (nEnd <= origEnd && newStart < nEnd) newStart = nEnd;
            }
            newDur = Math.max(0.1, origEnd - newStart);
          } else {
            let maxEnd = videoDuration; // Absolute max
            // Don't extend right past next clip's start
            for (const n of neighbors) {
              if (n.timelineStart >= origStart && n.timelineStart < maxEnd) maxEnd = n.timelineStart;
            }
            newDur = Math.max(0.1, Math.min(maxEnd - origStart, dt - origStart));
          }
          resizeDataRef.current = { start: newStart, duration: newDur };
          timelineStore.updateClip(resizingClip.clipId, { timelineStart: newStart, timelineDuration: newDur });
        } else if (clip.trackId === 'bgm') {
          const { audio_timeline_start, audio_clip_duration } = useProjectStore.getState();
          const dur = audio_clip_duration || 200;
          let newStart = audio_timeline_start;
          let newDur = dur;
          if (resizingClip.side === 'left') {
            const safe_t = Math.max(0, dt);
            newDur = Math.max(0.1, dur - (safe_t - audio_timeline_start));
            newStart = safe_t;
          } else {
            newDur = Math.max(0.1, dt - audio_timeline_start);
          }
          resizeDataRef.current = { start: newStart, duration: newDur };
          timelineStore.updateClip(resizingClip.clipId, { timelineStart: newStart, timelineDuration: newDur });
        } else if (clip.type === 'subtitle') {
          // Subtitle resize: use original bounds stored at resize start
          const origEnd = resizingClip.origEnd;
          const origStart = resizingClip.origStart;
          let newStart = origStart;
          let newDur = origEnd - origStart;
          if (resizingClip.side === 'left') {
            newStart = Math.max(0, Math.min(dt, origEnd - 0.1));
            newDur = origEnd - newStart;
          } else {
            newDur = Math.max(0.1, dt - origStart);
          }
          resizeDataRef.current = { start: newStart, duration: newDur };
          timelineStore.updateClip(resizingClip.clipId, { timelineStart: newStart, timelineDuration: newDur });
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingPlayhead) {
        AudioMixer.resume();
      }

      // Finalize drag — sync to config stores
      if (draggingClipId) {
        const clip = timelineStore.clips[draggingClipId];
        if (clip && dragTimeRef.current) {
          const t = dragTimeRef.current.time;

          // Commit final position to store (was DOM-only during drag)
          timelineStore.updateClip(draggingClipId, { timelineStart: t });

          // Enforce collision on drop — push out of overlaps
          const trackClipIds = (useTimelineStore.getState().trackClips[clip.trackId] || []).filter((id: string) => id !== draggingClipId);
          const clipDur = clip.timelineDuration;
          let finalTime = t;
          for (const otherId of trackClipIds) {
            const o = timelineStore.clips[otherId];
            if (!o) continue;
            const oEnd = o.timelineStart + o.timelineDuration;
            if (finalTime < oEnd && finalTime + clipDur > o.timelineStart) {
              const overlapLeft = oEnd - finalTime;
              const overlapRight = finalTime + clipDur - o.timelineStart;
              finalTime = overlapLeft < overlapRight ? oEnd : Math.max(0, o.timelineStart - clipDur);
            }
          }
          if (finalTime !== t) {
            timelineStore.updateClip(draggingClipId, { timelineStart: finalTime });
          }

          // Cross-track drop detection (deferred from pointermove for perf)
          const targetTrackId = getTrackAtY(lastMouseYRef.current);
          if (targetTrackId && targetTrackId !== clip.trackId) {
            if (targetTrackId === '__new_overlay__') {
              const newTrackId = timelineStore.createOverlayTrack();
              timelineStore.moveClipToTrack(draggingClipId, newTrackId);
            } else {
              const validDrop = canDropOnTrack(clip.type as ClipType, clip.trackId, targetTrackId);
              if (validDrop) {
                timelineStore.moveClipToTrack(draggingClipId, targetTrackId);
              }
            }
          }

          // Always compact main track to prevent gaps if a clip was pulled out or rearranged
          timelineStore.compactTrack('main');

          // Sync config stores
          if (clip.trackId === 'bgm') updateConfig({ audio_timeline_start: t });

          // Subtitle drag: sync position back to useSubtitleStore
          if (clip.type === 'subtitle' && draggingClipId.startsWith('sub-')) {
            const subId = parseInt(draggingClipId.replace('sub-', ''), 10);
            const duration = clip.timelineDuration;
            useSubtitleStore.getState().trimSegment(subId, t, t + duration);
          }

          // Cleanup empty overlay tracks
          if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
          cleanupTimerRef.current = window.setTimeout(() => timelineStore.cleanupEmptyOverlayTracks(), 500);
        }
      }

      // Finalize resize — commit deferred config values
      if (resizingClip && resizeDataRef.current) {
        const clip = timelineStore.clips[resizingClip.clipId];
        const { start, duration } = resizeDataRef.current;
        if (resizingClip.clipId === 'vid-main-clip') {
          updateConfig({ vid_clip_start: start, vid_clip_duration: duration });
        } else if (resizingClip.clipId === 'bgm-main-clip') {
          updateConfig({ audio_timeline_start: start, audio_clip_duration: duration });
        } else if (clip?.trackId === 'bgm') {
          // bgm-split clips: no config update, just visual
        } else if (clip?.type === 'subtitle' && resizingClip.clipId.startsWith('sub-')) {
          const subId = parseInt(resizingClip.clipId.replace('sub-', ''), 10);
          useSubtitleStore.getState().trimSegment(subId, start, start + duration);
        }
      }

      if (draggingClipId) {
        // Fix: The raw DOM drag might leave the element with a stale inline style.
        // We force the element to jump to the final, compacted state computed by the store.
        const clipEl = containerRef.current?.querySelector(`[data-clip-id="${draggingClipId}"]`) as HTMLElement | null;
        if (clipEl) {
          const finalClip = useTimelineStore.getState().clips[draggingClipId];
          if (finalClip) {
            clipEl.style.left = `${finalClip.timelineStart * pixelsPerSecond}px`;
          } else {
            clipEl.style.left = ''; // Fallback if clip was somehow deleted
          }
        }
      }

      resizeDataRef.current = null;
      dragTimeRef.current = null;
      setIsDraggingPlayhead(false);
      setDraggingClipId(null);
      setResizingClip(null);
      setActiveSnapTime(null);
      setHighlightTrackId(null);
      // Resume playback if video was playing before drag
      const video = document.querySelector('video');
      if (lastDraggedTimeRef.current !== null && video) {
        const draggedTime = lastDraggedTimeRef.current;
        const mainClips = timelineStore.getTrackClips('main');
        const mainTrackEnd = mainClips.length > 0 ? Math.max(...mainClips.map(c => c.timelineStart + c.timelineDuration)) : 0;

        if (wasPlayingBeforeDragRef.current) {
          if (draggedTime < mainTrackEnd) {
            // Dragged within video range → resume video play
            // Note: video.currentTime is already set correctly by handlePointerMove
            video.play().catch(() => {});
            window.dispatchEvent(new CustomEvent('force-video-playing'));
          } else {
            // Dragged past video end → start virtual playhead (CapCut-style)
            pausedVirtualTimeRef.current = null;
            virtualTimeRef.current = { active: true, startWall: performance.now(), startTime: draggedTime };
            window.dispatchEvent(new CustomEvent('virtual-playhead-started'));
            // Resume BGM from dragged position
            const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
            if (bgm && bgm.readyState > 0) {
              const bgmOffset = draggedTime - (config.audio_timeline_start || 0);
              if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                bgm.currentTime = bgmOffset;
                bgm.play().catch(e => console.warn('[BGM] drag-resume failed:', e));
              }
            }
          }
        }
        // If it was paused, we do nothing because handlePointerMove already set the correct video.currentTime
      }
      lastDraggedTimeRef.current = null;
      wasPlayingBeforeDragRef.current = false;
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
  }, [isDraggingPlayhead, draggingClipId, resizingClip, pixelsPerSecond, highlightTrackId]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      
      const activeClipId = timelineStore.selectedClipId || selectedClipId;
      const clip = activeClipId ? timelineStore.clips[activeClipId] : null;
      
      if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
        // Split at playhead — divide selected clip into two pieces
        if (activeClipId?.startsWith('sub-') && selectedId !== null) {
          useSubtitleStore.getState().splitSegment(selectedId, currentTime);
        } else if (clip && (clip.type === 'video' || clip.type === 'audio')) {
          if (currentTime > clip.timelineStart && currentTime < clip.timelineStart + clip.timelineDuration) {
            const splitPoint = currentTime - clip.timelineStart;
            const leftDur = splitPoint;
            const rightDur = clip.timelineDuration - splitPoint;
            timelineStore.updateClip(clip.id, { timelineDuration: leftDur, sourceDuration: leftDur });
            
            if (clip.id === 'vid-main-clip') updateConfig({ vid_clip_duration: leftDur });
            if (clip.id === 'bgm-main-clip') updateConfig({ audio_clip_duration: leftDur });
            
            timelineStore.addClip({
              id: `${clip.type}-split-${Date.now()}`, trackId: clip.trackId, type: clip.type,
              sourceFile: clip.sourceFile, sourceStart: clip.sourceStart + splitPoint,
              sourceDuration: rightDur, timelineStart: currentTime, timelineDuration: rightDur,
            });
          }
        }
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'q') {
        // Trim left (keep right portion)
        if (activeClipId?.startsWith('sub-') && selectedId !== null) {
          const seg = segments.find(s => s.id === selectedId);
          if (seg && currentTime > seg.start && currentTime < seg.end) {
            useSubtitleStore.getState().trimSegment(selectedId, currentTime, seg.end);
          }
        } else if (clip && (clip.type === 'video' || clip.type === 'audio')) {
          if (currentTime > clip.timelineStart && currentTime < clip.timelineStart + clip.timelineDuration) {
            const cutAmount = currentTime - clip.timelineStart;
            timelineStore.updateClip(clip.id, {
              sourceStart: clip.sourceStart + cutAmount,
              timelineDuration: clip.timelineDuration - cutAmount,
              sourceDuration: clip.sourceDuration - cutAmount,
              timelineStart: currentTime,
            });
            timelineStore.compactTrack(clip.trackId);
          }
        }
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'w') {
        // Trim right (keep left portion)
        if (activeClipId?.startsWith('sub-') && selectedId !== null) {
          const seg = segments.find(s => s.id === selectedId);
          if (seg && currentTime > seg.start && currentTime < seg.end) {
            useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
          }
        } else if (clip && (clip.type === 'video' || clip.type === 'audio')) {
          if (currentTime > clip.timelineStart && currentTime < clip.timelineStart + clip.timelineDuration) {
            const newDur = currentTime - clip.timelineStart;
            timelineStore.updateClip(clip.id, {
              timelineDuration: newDur,
              sourceDuration: newDur,
            });
            timelineStore.compactTrack(clip.trackId);
          }
        }
        e.preventDefault();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeClipId?.startsWith('sub-') && selectedId !== null) {
          if (e.shiftKey) {
            useSubtitleStore.getState().deleteAndRippleSubtitle(selectedId);
          } else {
            useSubtitleStore.getState().deleteSegment(selectedId);
          }
          e.preventDefault();
          return;
        }
        
        if (clip) {
          if (clip.trackId === 'main') {
            timelineStore.deleteAndCompactTrack(clip.id, 'main');
          } else if (e.shiftKey) {
            timelineStore.rippleDelete(clip.id);
          } else {
            timelineStore.removeClip(clip.id);
          }
          
          // If BGM track is now empty, clear it from config so it doesn't auto-respawn on reload
          if (clip.trackId === 'bgm') {
            const remainingBgm = timelineStore.getTrackClips('bgm');
            if (remainingBgm.length === 0) {
              updateConfig({ audio_enabled: false, audio_file: '' });
            }
          }
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, selectedClipId, timelineStore.selectedClipId, selectedId, segments, timelineStore.clips]);

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
        // Remove existing BGM clips first
        const oldBgm = timelineStore.getTrackClips('bgm');
        oldBgm.forEach(c => timelineStore.removeClip(c.id));
        // Create new BGM clip with stable ID
        const dur = 200; // Placeholder — will be updated by bgm-duration-loaded event
        timelineStore.addClip({
          id: 'bgm-main-clip',
          trackId: 'bgm',
          type: 'audio',
          sourceFile: filePath,
          sourceStart: 0,
          sourceDuration: dur,
          timelineStart: 0,
          timelineDuration: dur,
        });
        // Sync config for BGM playback (reset clip duration to 0 = full duration)
        updateConfig({ audio_enabled: true, audio_file: filePath, audio_clip_duration: 0, audio_timeline_start: 0, audio_clip_start: 0 });
      }
    };
    window.addEventListener('add-audio-to-timeline', handleAudioAdd);
    return () => window.removeEventListener('add-audio-to-timeline', handleAudioAdd);
  }, []);

  // ─── BGM Duration Auto-Sync: listen for audio metadata from VideoPreview ───
  useEffect(() => {
    const onBgmDurationLoaded = (e: Event) => {
      const realDur = (e as CustomEvent).detail?.duration;
      if (!realDur || !isFinite(realDur) || realDur <= 0) return;

      console.log('[Timeline] BGM duration event received:', realDur.toFixed(1));

      // Find ANY clip on the BGM track (ID may be random UUID or stable)
      const bgmClips = timelineStore.getTrackClips('bgm');
      const mainBgm = bgmClips[0]; // First (and usually only) BGM clip
      if (mainBgm && Math.abs(mainBgm.timelineDuration - realDur) > 0.5) {
        console.log('[Timeline] BGM clip duration sync:', mainBgm.id, mainBgm.timelineDuration, '→', realDur);
        timelineStore.updateClip(mainBgm.id, { 
          timelineDuration: realDur, 
          sourceDuration: realDur 
        });
      }

      // Reset stale config if significantly shorter than real audio
      const clipDurConfig = config.audio_clip_duration;
      if (clipDurConfig && clipDurConfig > 0 && clipDurConfig < realDur - 1) {
        console.log('[Timeline] Resetting stale audio_clip_duration:', clipDurConfig, '→ 0');
        updateConfig({ audio_clip_duration: 0 });
      }
    };

    window.addEventListener('bgm-duration-loaded', onBgmDurationLoaded);
    return () => window.removeEventListener('bgm-duration-loaded', onBgmDurationLoaded);
  }, [config.audio_clip_duration]);

  // ─── Media Bin Drag-Drop (D-10, D-11) ───
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const { filePath, mediaType, duration } = JSON.parse(data);
      if (mediaType === 'audio') {
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

  const handleClipDragStart = (clipId: string, e: React.PointerEvent) => {
    const clip = timelineStore.clips[clipId];
    if (!clip) return;
    // Main track: locked when subtitles exist (to maintain sync)
    if (clip.trackId === 'main' && segments.length > 0) return;
    // Compute offset: where within the clip the user clicked
    // MUST use containerRef.current (same element as pointermove) for consistent coords
    const tlbody = containerRef.current;
    if (tlbody) {
      const rect = tlbody.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + tlbody.scrollLeft - TIMELINE_OFFSET_X;
      const mouseTime = Math.max(0, mouseX / pixelsPerSecond);
      dragOffsetRef.current = mouseTime - clip.timelineStart;
    }
    setDraggingClipId(clipId);
  };

  const handleClipResizeStart = (clipId: string, side: 'left' | 'right', _e: React.PointerEvent) => {
    const clip = timelineStore.clips[clipId];
    if (clip) {
      // Store original bounds so left-resize doesn't drift
      setResizingClip({
        clipId,
        side,
        origStart: clip.timelineStart,
        origEnd: clip.timelineStart + clip.timelineDuration,
      });
    }
  };

  // ─── Render ───
  return (
    <div className="tl" style={{ flexShrink: 0, height: '100%', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', userSelect: 'none' }}>
      
      <TimelineToolbar
        onSplit={() => {
          if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
            useSubtitleStore.getState().splitSegment(selectedId, currentTime);
          } else if (selectedClipId === 'vid-main' || selectedClipId?.startsWith('vid-split-')) {
            // Video split: find main track clip at playhead
            const mainClips = timelineStore.getTrackClips('main');
            const clip = mainClips.find(c => currentTime > c.timelineStart && currentTime < c.timelineStart + c.timelineDuration);
            if (clip) {
              const splitPoint = currentTime - clip.timelineStart;
              const leftDur = splitPoint;
              const rightDur = clip.timelineDuration - splitPoint;
              timelineStore.updateClip(clip.id, { timelineDuration: leftDur, sourceDuration: leftDur });
              if (clip.id === 'vid-main-clip') updateConfig({ vid_clip_duration: leftDur });
              timelineStore.addClip({
                id: `vid-split-${Date.now()}`, trackId: 'main', type: 'video',
                sourceFile: clip.sourceFile, sourceStart: clip.sourceStart + splitPoint,
                sourceDuration: rightDur, timelineStart: currentTime, timelineDuration: rightDur,
              });
            }
          } else if (selectedClipId === 'audio-main' || selectedClipId?.startsWith('bgm-split-')) {
            // Audio split: find bgm track clip at playhead
            const bgmClips = timelineStore.getTrackClips('bgm');
            const clip = bgmClips.find(c => currentTime > c.timelineStart && currentTime < c.timelineStart + c.timelineDuration);
            if (clip) {
              const splitPoint = currentTime - clip.timelineStart;
              const leftDur = splitPoint;
              const rightDur = clip.timelineDuration - splitPoint;
              timelineStore.updateClip(clip.id, { timelineDuration: leftDur, sourceDuration: leftDur });
              if (clip.id === 'bgm-main-clip') updateConfig({ audio_clip_duration: leftDur });
              timelineStore.addClip({
                id: `bgm-split-${Date.now()}`, trackId: 'bgm', type: 'audio',
                sourceFile: clip.sourceFile, sourceStart: clip.sourceStart + splitPoint,
                sourceDuration: rightDur, timelineStart: currentTime, timelineDuration: rightDur,
              });
            }
          }
        }}
        onSplitLeft={() => {
          if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
            const seg = segments.find(s => s.id === selectedId);
            if (seg && currentTime > seg.start && currentTime < seg.end) useSubtitleStore.getState().trimSegment(selectedId, currentTime, seg.end);
          } else if (selectedClipId === 'audio-main') {
            const { audio_timeline_start, audio_clip_duration } = useProjectStore.getState();
            const audioEnd = audio_timeline_start + (audio_clip_duration || 200);
            if (currentTime > audio_timeline_start && currentTime < audioEnd) {
              const newDur = audioEnd - currentTime;
              updateConfig({ audio_timeline_start: currentTime, audio_clip_duration: newDur });
              const bgmClipId = (useTimelineStore.getState().trackClips['bgm'] || [])[0];
              if (bgmClipId) timelineStore.updateClip(bgmClipId, { timelineStart: currentTime, timelineDuration: newDur });
            }
          } else { config.splitLeft(currentTime, activeDuration); }
        }}
        onSplitRight={() => {
          if (selectedClipId?.startsWith('sub-') && selectedId !== null) {
            const seg = segments.find(s => s.id === selectedId);
            if (seg && currentTime > seg.start && currentTime < seg.end) useSubtitleStore.getState().trimSegment(selectedId, seg.start, currentTime);
          } else if (selectedClipId === 'audio-main') {
            const { audio_timeline_start, audio_clip_duration } = useProjectStore.getState();
            const audioEnd = audio_timeline_start + (audio_clip_duration || 200);
            if (currentTime > audio_timeline_start && currentTime < audioEnd) {
              const newDur = currentTime - audio_timeline_start;
              updateConfig({ audio_clip_duration: newDur });
              const bgmClipId = (useTimelineStore.getState().trackClips['bgm'] || [])[0];
              if (bgmClipId) timelineStore.updateClip(bgmClipId, { timelineDuration: newDur });
            }
          } else { config.splitRight(currentTime, activeDuration); }
        }}
        onDelete={() => {
          const clip = selectedClipId ? timelineStore.clips[selectedClipId] : null;
          if (clip) {
            if (clip.trackId === 'main') timelineStore.deleteAndCompactTrack(clip.id, 'main');
            else timelineStore.removeClip(clip.id);
            
            // Clear BGM config if track is now empty
            if (clip.trackId === 'bgm') {
              const remainingBgm = timelineStore.getTrackClips('bgm');
              if (remainingBgm.length === 0) {
                updateConfig({ audio_enabled: false, audio_file: '' });
              }
            }
          } else if (selectedId !== null) {
            useSubtitleStore.getState().deleteSegment(selectedId);
          }
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={handleFitToView}
        zoom={timelineZoom}
        minZoom={minZoom}
        onZoomChange={(z) => updateConfig({ timelineZoom: z })}
        canSplit={!!selectedClipId || selectedId !== null}
        canDelete={!!selectedClipId || selectedId !== null}
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
            // CapCut-style: remember if playback was active before seek
            const wasPlaying = (video && !video.paused && !video.ended) || virtualTimeRef.current.active;

            // Stop virtual mode inline (don't dispatch stop-virtual-playhead event)
            if (virtualTimeRef.current.active) {
              virtualTimeRef.current.active = false;
            }
            virtualCompletedRef.current = false;

            if (video) {
              // Find which main track clip covers this timeline position
              const mainClips = timelineStore.getTrackClips('main');
              const activeClip = mainClips.find(c => 
                snappedTime >= c.timelineStart && snappedTime < c.timelineStart + c.timelineDuration
              );
              const mainTrackEnd = mainClips.length > 0 
                ? Math.max(...mainClips.map(c => c.timelineStart + c.timelineDuration))
                : video.duration;

              if (!activeClip || snappedTime >= mainTrackEnd) {
                // Clicked PAST all video clips → virtual playhead territory
                if (wasPlaying) {
                  (window as any).__virtualSeekActive = true;
                }
                if (!video.paused) video.pause();
                window.dispatchEvent(new CustomEvent('force-video-ended'));

                if (wasPlaying) {
                  pausedVirtualTimeRef.current = null;
                  virtualTimeRef.current = { active: true, startWall: performance.now(), startTime: snappedTime };
                  window.dispatchEvent(new CustomEvent('virtual-playhead-started'));
                  const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
                  if (bgm && bgm.readyState > 0) {
                    const bgmOffset = snappedTime - (config.audio_timeline_start || 0);
                    if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                      bgm.currentTime = bgmOffset;
                      bgm.play().catch(e => console.warn('[BGM] seek-resume failed:', e));
                    }
                  }
                  // Flag will be cleared by onPause handler (async)
                } else {
                  pausedVirtualTimeRef.current = snappedTime;
                  const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
                  if (bgm && bgm.readyState > 0) {
                    if (!bgm.paused) bgm.pause();
                    const bgmOffset = snappedTime - (config.audio_timeline_start || 0);
                    if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                      bgm.currentTime = bgmOffset;
                    }
                  }
                }
              } else {
                // Clicked within a video clip — translate to source time
                pausedVirtualTimeRef.current = null;
                const offsetInClip = snappedTime - activeClip.timelineStart;
                const sourceTime = activeClip.sourceStart + offsetInClip;
                video.currentTime = Math.max(0, Math.min(sourceTime, video.duration - 0.01));
                window.dispatchEvent(new CustomEvent('force-video-playing'));
                const bgm = document.querySelector('audio[data-bgm]') as HTMLAudioElement | null;
                if (bgm && bgm.readyState > 0) {
                  const bgmOffset = snappedTime - (config.audio_timeline_start || 0);
                  if (bgmOffset >= 0 && bgmOffset < bgm.duration) {
                    bgm.currentTime = bgmOffset;
                  }
                }
                if (wasPlaying && video.paused) {
                  video.play().catch(() => {});
                  if (bgm && bgm.readyState > 0 && bgm.paused) {
                    bgm.play().catch(e => console.warn('[BGM] seek-resume failed:', e));
                  }
                }
              }
            }
            setCurrentTime(snappedTime);
            if (playheadRef.current) playheadRef.current.style.transform = `translateX(${snappedTime * pixelsPerSecond + TIMELINE_OFFSET_X - tlbody.scrollLeft}px)`;
            updateConfig({ selectedClipId: null });
            useSubtitleStore.getState().selectSegment(null);
            timelineStore.selectClip(null);
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
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
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 26,
                    background: highlightTrackId === '__new_overlay__' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(167, 139, 250, 0.1)',
                    borderBottom: '1px dashed rgba(167, 139, 250, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: '#fff',
                    fontWeight: 600,
                    zIndex: 200,
                  }}
                >
                  Drop here to create new Overlay Track
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
                    pixelsPerSecond={pixelsPerSecond}
                    scrollLeft={scrollLeft}
                    viewportWidth={viewportWidth}
                    timelineWidth={timelineWidthPx}
                    selectedClipId={timelineStore.selectedClipId}
                    isHighlighted={highlightTrackId === trackId}
                    onClipSelect={handleClipSelect}
                    onClipDragStart={handleClipDragStart}
                    onClipResizeStart={handleClipResizeStart}
                    isLocked={segments.length > 0}
                  />
                );
              })}

              {/* Removed: Ghost preview + Insert indicator — CapCut moves clips directly */}

              {/* Playhead */}
              <div
                className="playhead-fixed"
                ref={playheadRef}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingPlayhead(true);
                  // Pause video during drag to prevent snap-back
                  const v = document.querySelector('video');
                  if (v && !v.paused && !v.ended) {
                    wasPlayingBeforeDragRef.current = true;
                    v.pause();
                  } else {
                    wasPlayingBeforeDragRef.current = false;
                  }
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
