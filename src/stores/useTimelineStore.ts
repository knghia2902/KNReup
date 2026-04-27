import { create } from 'zustand';
import { Clip, SubtitleClip, TrackId, TrackMeta, TimelineState } from '../types/timeline';

const DEFAULT_TRACKS: Record<TrackId, TrackMeta> = {
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
};

interface TimelineActions {
  // Clip CRUD
  addClip: (clip: Clip | SubtitleClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, partial: Partial<Clip>) => void;
  selectClip: (clipId: string | null) => void;

  // Track operations
  updateTrack: (trackId: TrackId, partial: Partial<TrackMeta>) => void;
  toggleTrackMute: (trackId: TrackId) => void;
  toggleTrackLock: (trackId: TrackId) => void;
  toggleTrackVisibility: (trackId: TrackId) => void;

  // Multi-clip operations
  appendClipToTrack: (trackId: TrackId, clip: Omit<Clip, 'id' | 'trackId' | 'timelineStart'>) => void;
  rippleDelete: (clipId: string) => void;

  // Timeline config
  setZoom: (zoom: number) => void;
  setScrollX: (x: number) => void;
  setSnap: (enabled: boolean, threshold?: number) => void;

  // Bulk operations
  setClips: (clips: (Clip | SubtitleClip)[]) => void;
  getTrackClips: (trackId: TrackId) => (Clip | SubtitleClip)[];
  getTrackDuration: (trackId: TrackId) => number;
  getTotalDuration: () => number;

  // Reset
  reset: () => void;
}

export type TimelineStore = TimelineState & TimelineActions;

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  ...INITIAL_STATE,

  // === Clip CRUD ===

  addClip: (clip) => set((state) => {
    const trackId = clip.trackId as TrackId;
    const newClips = { ...state.clips, [clip.id]: clip };
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

    const trackId = clip.trackId as TrackId;
    const newClips = { ...state.clips };
    delete newClips[clipId];

    return {
      clips: newClips,
      trackClips: {
        ...state.trackClips,
        [trackId]: state.trackClips[trackId].filter(id => id !== clipId),
      },
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    };
  }),

  updateClip: (clipId, partial) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;

    const updated = { ...clip, ...partial };
    const newClips = { ...state.clips, [clipId]: updated };

    // Re-sort track nếu timelineStart thay đổi
    const trackId = clip.trackId as TrackId;
    let trackClipIds = state.trackClips[trackId];
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
      [trackId]: { ...state.tracks[trackId], muted: !state.tracks[trackId].muted },
    },
  })),

  toggleTrackLock: (trackId) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], locked: !state.tracks[trackId].locked },
    },
  })),

  toggleTrackVisibility: (trackId) => set((state) => ({
    tracks: {
      ...state.tracks,
      [trackId]: { ...state.tracks[trackId], visible: !state.tracks[trackId].visible },
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

    const trackId = clip.trackId as TrackId;
    const duration = clip.timelineDuration;
    const clipStart = clip.timelineStart;

    // Xóa clip
    const newClips = { ...state.clips };
    delete newClips[clipId];

    // Dịch tất cả clips SAU clip đó lùi lại `duration` trên CÙNG track (D-08)
    const trackClipIds = state.trackClips[trackId].filter(id => id !== clipId);
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

  // === Timeline config ===

  setZoom: (zoom) => set({ zoom }),
  setScrollX: (x) => set({ scrollX: x }),
  setSnap: (enabled, threshold) => set((state) => ({
    snapEnabled: enabled,
    snapThreshold: threshold ?? state.snapThreshold,
  })),

  // === Bulk operations ===

  setClips: (clips) => set(() => {
    const clipRegistry: Record<string, Clip | SubtitleClip> = {};
    const trackClips: Record<TrackId, string[]> = { main: [], sub: [], tts: [], bgm: [] };

    clips.forEach(clip => {
      clipRegistry[clip.id] = clip;
      const trackId = clip.trackId as TrackId;
      if (trackClips[trackId]) {
        trackClips[trackId].push(clip.id);
      }
    });

    // Sort each track by timelineStart
    Object.keys(trackClips).forEach(trackId => {
      trackClips[trackId as TrackId].sort((a, b) => {
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

  reset: () => set({ ...INITIAL_STATE, tracks: { ...DEFAULT_TRACKS } }),
}));
