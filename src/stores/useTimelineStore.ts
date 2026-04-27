import { create } from 'zustand';
import { Clip, SubtitleClip, TrackMeta, TimelineState, OverlayTrackId, isOverlayTrack } from '../types/timeline';

const DEFAULT_TRACKS: Record<string, TrackMeta> = {
  sub:  { id: 'sub',  label: 'SUB',  color: '#f59e0b', height: 40, locked: false, visible: true, volume: 1.0, muted: false },
  main: { id: 'main', label: 'MAIN', color: 'var(--accent)', height: 60, locked: false, visible: true, volume: 1.0, muted: false },
  tts:  { id: 'tts',  label: 'TTS',  color: '#f59e0b', height: 40, locked: false, visible: true, volume: 1.0, muted: false },
  bgm:  { id: 'bgm',  label: 'BGM',  color: '#22c55e', height: 40, locked: false, visible: true, volume: 0.5, muted: false },
};

const INITIAL_STATE: TimelineState = {
  tracks: { ...DEFAULT_TRACKS },
  clips: {},
  trackClips: { main: [], sub: [], tts: [], bgm: [] },
  selectedClipId: null,
  zoom: 1,
  scrollX: 0,
  snapEnabled: true,
  snapThreshold: 12,
  overlayTrackIds: [],
};

interface TimelineActions {
  // Clip CRUD
  addClip: (clip: Clip | SubtitleClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, partial: Partial<Clip>) => void;
  selectClip: (clipId: string | null) => void;

  // Track operations
  updateTrack: (trackId: string, partial: Partial<TrackMeta>) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;

  // Multi-clip operations
  appendClipToTrack: (trackId: string, clip: Omit<Clip, 'id' | 'trackId' | 'timelineStart'>) => void;
  rippleDelete: (clipId: string) => void;
  rippleInsert: (clipId: string, targetTrackId: string, insertIndex: number) => void;

  // Dynamic track management
  createOverlayTrack: () => OverlayTrackId;
  removeOverlayTrack: (trackId: OverlayTrackId) => void;
  cleanupEmptyOverlayTracks: () => void;
  moveClipToTrack: (clipId: string, targetTrackId: string) => void;

  // Timeline config
  setZoom: (zoom: number) => void;
  setScrollX: (x: number) => void;
  setSnap: (enabled: boolean, threshold?: number) => void;

  // Bulk operations
  setClips: (clips: (Clip | SubtitleClip)[]) => void;
  getTrackClips: (trackId: string) => (Clip | SubtitleClip)[];
  getTrackDuration: (trackId: string) => number;
  getTotalDuration: () => number;

  // Reset
  reset: () => void;
}

export type TimelineStore = TimelineState & TimelineActions;

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  ...INITIAL_STATE,

  // === Clip CRUD ===

  addClip: (clip) => set((state) => {
    const trackId = clip.trackId;
    const newClips = { ...state.clips, [clip.id]: clip };

    // Tự tạo trackClips entry nếu chưa có (overlay tracks)
    const currentTrackClips = [...(state.trackClips[trackId] || [])];

    // Giữ sorted by timelineStart
    if (!currentTrackClips.includes(clip.id)) {
      currentTrackClips.push(clip.id);
      currentTrackClips.sort((a, b) => {
        const ca = newClips[a];
        const cb = newClips[b];
        return (ca?.timelineStart || 0) - (cb?.timelineStart || 0);
      });
    }

    return {
      clips: newClips,
      trackClips: { ...state.trackClips, [trackId]: currentTrackClips },
    };
  }),

  removeClip: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const trackId = clip.trackId;
    const newClips = { ...state.clips };
    delete newClips[clipId];

    const newTrackClips = {
      ...state.trackClips,
      [trackId]: (state.trackClips[trackId] || []).filter(id => id !== clipId),
    };

    return {
      clips: newClips,
      trackClips: newTrackClips,
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    };
  }),

  updateClip: (clipId, partial) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const updated = { ...clip, ...partial };
    const newClips = { ...state.clips, [clipId]: updated };

    // Re-sort track nếu timelineStart thay đổi
    const trackId = clip.trackId;
    let trackClipIds = state.trackClips[trackId] || [];
    if (partial.timelineStart !== undefined) {
      trackClipIds = [...trackClipIds].sort((a, b) => {
        const ca = newClips[a];
        const cb = newClips[b];
        return (ca?.timelineStart || 0) - (cb?.timelineStart || 0);
      });
    }

    return {
      clips: newClips,
      trackClips: { ...state.trackClips, [trackId]: trackClipIds },
    };
  }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  // === Track operations ===

  updateTrack: (trackId, partial) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], ...partial },
    },
  })),

  toggleTrackMute: (trackId) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], muted: !state.tracks[trackId]?.muted },
    },
  })),

  toggleTrackLock: (trackId) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], locked: !state.tracks[trackId]?.locked },
    },
  })),

  toggleTrackVisibility: (trackId) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], visible: !state.tracks[trackId]?.visible },
    },
  })),

  // === Multi-clip operations ===

  appendClipToTrack: (trackId, clipData) => {
    const state = get();
    const trackClipIds = state.trackClips[trackId] || [];

    // Tính timelineStart = end time của clip cuối trên track
    let timelineStart = 0;
    if (trackClipIds.length > 0) {
      const lastClipId = trackClipIds[trackClipIds.length - 1];
      const lastClip = state.clips[lastClipId];
      if (lastClip) {
        timelineStart = lastClip.timelineStart + lastClip.timelineDuration;
      }
    }

    const newClip: Clip = {
      ...clipData,
      id: crypto.randomUUID(),
      trackId,
      timelineStart,
    };

    get().addClip(newClip);
  },

  rippleDelete: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const trackId = clip.trackId;
    const duration = clip.timelineDuration;
    const clipStart = clip.timelineStart;

    // Xóa clip
    const newClips = { ...state.clips };
    delete newClips[clipId];

    // Dịch tất cả clips SAU clip đó lùi lại `duration` trên CÙNG track
    const trackClipIds = (state.trackClips[trackId] || []).filter(id => id !== clipId);
    trackClipIds.forEach(id => {
      const c = newClips[id];
      if (c && c.timelineStart > clipStart) {
        newClips[id] = { ...c, timelineStart: c.timelineStart - duration };
      }
    });

    return {
      clips: newClips,
      trackClips: {
        ...state.trackClips,
        [trackId]: trackClipIds,
      },
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    };
  }),

  rippleInsert: (clipId, targetTrackId, insertIndex) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const newClips = { ...state.clips };
    const oldTrackId = clip.trackId;

    // Xóa clip khỏi track cũ
    const oldTrackClips = (state.trackClips[oldTrackId] || []).filter(id => id !== clipId);

    // Tính timelineStart mới = end time của clip trước insertIndex
    const targetTrackClips = [...(state.trackClips[targetTrackId] || [])].filter(id => id !== clipId);
    let newStart = 0;
    if (insertIndex > 0 && targetTrackClips.length > 0) {
      const prevIdx = Math.min(insertIndex - 1, targetTrackClips.length - 1);
      const prevClipId = targetTrackClips[prevIdx];
      const prevClip = newClips[prevClipId];
      if (prevClip) newStart = prevClip.timelineStart + prevClip.timelineDuration;
    }

    // Update clip trackId & position
    const insertedDuration = clip.timelineDuration;
    newClips[clipId] = { ...clip, trackId: targetTrackId, timelineStart: newStart };

    // Dồn tất cả clips SAU insertIndex ra phía sau
    for (let i = insertIndex; i < targetTrackClips.length; i++) {
      const cId = targetTrackClips[i];
      const c = newClips[cId];
      if (c) newClips[cId] = { ...c, timelineStart: c.timelineStart + insertedDuration };
    }

    // Insert clipId vào đúng vị trí
    targetTrackClips.splice(insertIndex, 0, clipId);

    return {
      clips: newClips,
      trackClips: {
        ...state.trackClips,
        [oldTrackId]: oldTrackClips,
        [targetTrackId]: targetTrackClips,
      },
    };
  }),

  // === Dynamic Track Management ===

  createOverlayTrack: () => {
    const state = get();
    // Tìm max overlay number hiện tại
    let maxNum = 0;
    state.overlayTrackIds.forEach(id => {
      const num = parseInt(id.replace('overlay-', ''));
      if (num > maxNum) maxNum = num;
    });
    const newId = `overlay-${maxNum + 1}` as OverlayTrackId;

    set((s) => ({
      tracks: {
        ...s.tracks,
        [newId]: {
          id: newId,
          label: `OVL-${maxNum + 1}`,
          color: '#a78bfa',
          height: 50,
          locked: false,
          visible: true,
          volume: 1.0,
          muted: false,
        },
      },
      trackClips: {
        ...s.trackClips,
        [newId]: [],
      },
      overlayTrackIds: [...s.overlayTrackIds, newId],
    }));

    return newId;
  },

  removeOverlayTrack: (trackId) => set((state) => {
    if (!isOverlayTrack(trackId)) return state;

    const newTracks = { ...state.tracks };
    delete newTracks[trackId];

    const newTrackClips = { ...state.trackClips };
    delete newTrackClips[trackId];

    return {
      tracks: newTracks,
      trackClips: newTrackClips,
      overlayTrackIds: state.overlayTrackIds.filter(id => id !== trackId),
    };
  }),

  cleanupEmptyOverlayTracks: () => set((state) => {
    const toRemove = state.overlayTrackIds.filter(
      id => (state.trackClips[id] || []).length === 0
    );
    if (toRemove.length === 0) return state;

    const newTracks = { ...state.tracks };
    const newTrackClips = { ...state.trackClips };
    toRemove.forEach(id => {
      delete newTracks[id];
      delete newTrackClips[id];
    });

    return {
      tracks: newTracks,
      trackClips: newTrackClips,
      overlayTrackIds: state.overlayTrackIds.filter(id => !toRemove.includes(id)),
    };
  }),

  moveClipToTrack: (clipId, targetTrackId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const oldTrackId = clip.trackId;
    if (oldTrackId === targetTrackId) return state;

    // Xóa clip khỏi track cũ
    const oldTrackClips = (state.trackClips[oldTrackId] || []).filter(id => id !== clipId);

    // Update clip trackId
    const newClips = { ...state.clips };
    newClips[clipId] = { ...clip, trackId: targetTrackId };

    // Thêm vào track mới (giữ sorted by timelineStart)
    const targetClips = [...(state.trackClips[targetTrackId] || []), clipId];
    targetClips.sort((a, b) => {
      const ca = newClips[a];
      const cb = newClips[b];
      return (ca?.timelineStart || 0) - (cb?.timelineStart || 0);
    });

    return {
      clips: newClips,
      trackClips: {
        ...state.trackClips,
        [oldTrackId]: oldTrackClips,
        [targetTrackId]: targetClips,
      },
    };
  }),

  // === Timeline config ===

  setZoom: (zoom) => set({ zoom }),
  setScrollX: (x) => set({ scrollX: x }),
  setSnap: (enabled, threshold) => set((state) => ({
    snapEnabled: enabled,
    snapThreshold: threshold ?? state.snapThreshold,
  })),

  // === Bulk operations ===

  setClips: (clips) => set((state) => {
    const clipRegistry: Record<string, Clip | SubtitleClip> = {};
    const trackClips: Record<string, string[]> = { main: [], sub: [], tts: [], bgm: [] };

    // Thêm overlay tracks đã tồn tại
    state.overlayTrackIds.forEach(id => {
      trackClips[id] = [];
    });

    clips.forEach(clip => {
      clipRegistry[clip.id] = clip;
      const trackId = clip.trackId;
      if (!trackClips[trackId]) {
        trackClips[trackId] = [];
      }
      trackClips[trackId].push(clip.id);
    });

    // Sort each track by timelineStart
    Object.keys(trackClips).forEach(trackId => {
      trackClips[trackId].sort((a, b) => {
        const ca = clipRegistry[a];
        const cb = clipRegistry[b];
        return (ca?.timelineStart || 0) - (cb?.timelineStart || 0);
      });
    });

    return { clips: clipRegistry, trackClips };
  }),

  getTrackClips: (trackId) => {
    const state = get();
    return (state.trackClips[trackId] || [])
      .map(id => state.clips[id])
      .filter(Boolean) as (Clip | SubtitleClip)[];
  },

  getTrackDuration: (trackId) => {
    const state = get();
    const clips = (state.trackClips[trackId] || [])
      .map(id => state.clips[id])
      .filter(Boolean);
    if (clips.length === 0) return 0;
    return Math.max(...clips.map(c => c.timelineStart + c.timelineDuration));
  },

  getTotalDuration: () => {
    const state = get();
    const allClips = Object.values(state.clips);
    if (allClips.length === 0) return 0;
    return Math.max(...allClips.map(c => c.timelineStart + c.timelineDuration));
  },

  // === Reset ===

  reset: () => set({ ...INITIAL_STATE, tracks: { ...DEFAULT_TRACKS }, overlayTrackIds: [] }),
}));
