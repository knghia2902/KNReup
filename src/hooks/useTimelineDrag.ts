import { useState, useCallback } from 'react';
import { useTimelineStore } from '../stores/useTimelineStore';

/**
 * Quản lý tất cả drag interaction states cho Timeline.
 * Hook này chỉ quản lý state — logic xử lý pointer events 
 * nằm trong Timeline.tsx useEffect.
 */
interface DragState {
  isDraggingPlayhead: boolean;
  draggingClipId: string | null;
  resizingClip: { clipId: string; side: 'left' | 'right' } | null;
  activeSnapTime: number | null;
}

export function useTimelineDrag() {
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [resizingClip, setResizingClip] = useState<{ clipId: string; side: 'left' | 'right' } | null>(null);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);

  const startPlayheadDrag = useCallback(() => {
    setIsDraggingPlayhead(true);
  }, []);

  const startClipDrag = useCallback((clipId: string) => {
    setDraggingClipId(clipId);
  }, []);

  const startClipResize = useCallback((clipId: string, side: 'left' | 'right') => {
    setResizingClip({ clipId, side });
  }, []);

  const stopAll = useCallback(() => {
    setIsDraggingPlayhead(false);
    setDraggingClipId(null);
    setResizingClip(null);
    setActiveSnapTime(null);
  }, []);

  /**
   * Thu thập snap points từ TẤT CẢ clips trên mọi track.
   * Snap points = start + end của mỗi clip + 0.
   */
  const getSnapPoints = useCallback((): number[] => {
    const allClips = Object.values(useTimelineStore.getState().clips);
    const snapPoints = [0];
    allClips.forEach(clip => {
      snapPoints.push(clip.timelineStart);
      snapPoints.push(clip.timelineStart + clip.timelineDuration);
    });
    return snapPoints;
  }, []);

  /**
   * Snap thời gian vào điểm gần nhất nếu trong threshold.
   */
  const snapTime = useCallback((time: number, thresholdSeconds: number): { snapped: boolean; time: number } => {
    const snapPoints = getSnapPoints();
    let closestTime = time;
    let snapped = false;
    let minDiff = thresholdSeconds;

    snapPoints.forEach(p => {
      const diff = Math.abs(time - p);
      if (diff < minDiff) {
        minDiff = diff;
        closestTime = p;
        snapped = true;
      }
    });

    return { snapped, time: closestTime };
  }, [getSnapPoints]);

  const isDragging = isDraggingPlayhead || !!draggingClipId || !!resizingClip;

  return {
    // State
    isDraggingPlayhead,
    draggingClipId,
    resizingClip,
    activeSnapTime,
    isDragging,

    // Setters
    setIsDraggingPlayhead,
    setDraggingClipId,
    setResizingClip,
    setActiveSnapTime,

    // Actions
    startPlayheadDrag,
    startClipDrag,
    startClipResize,
    stopAll,

    // Snap
    getSnapPoints,
    snapTime,
  };
}
