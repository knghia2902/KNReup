import { create } from 'zustand';

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  source_text: string;
  translated_text: string;
  confidence: number;
  tts_status: 'pending' | 'generated' | 'error';
  tts_audio_path?: string;
}

interface SubtitleStore {
  fileSegments: Record<string, SubtitleSegment[]>;
  activeFile: string | null;
  segments: SubtitleSegment[]; // mirrors fileSegments[activeFile]
  selectedId: number | null;
  // Actions
  setActiveFile: (path: string | null) => void;
  setSegments: (segments: SubtitleSegment[], targetPath?: string) => void;
  selectSegment: (id: number | null) => void;
  updateSegment: (id: number, partial: Partial<SubtitleSegment>) => void;
  splitSegment: (id: number, splitTime: number) => void;
  mergeSegments: (id1: number, id2: number) => void;
  deleteSegment: (id: number) => void;
  clearAll: () => void;
}

export const useSubtitleStore = create<SubtitleStore>((set) => ({
  fileSegments: {},
  activeFile: null,
  segments: [],
  selectedId: null,

  setActiveFile: (path) => set((state) => ({
    activeFile: path,
    segments: path && state.fileSegments[path] ? state.fileSegments[path] : [],
    selectedId: null
  })),

  setSegments: (segs, targetPath) => set((state) => {
    const path = targetPath || state.activeFile;
    if (!path) return state;
    const newFileSegments = { ...state.fileSegments, [path]: segs };
    return {
      fileSegments: newFileSegments,
      segments: state.activeFile === path ? segs : state.segments,
      selectedId: state.activeFile === path ? null : state.selectedId
    };
  }),

  selectSegment: (id) => set({ selectedId: id }),

  updateSegment: (id, partial) =>
    set((state) => {
      if (!state.activeFile) return state;
      const newSegs = state.segments.map((s) =>
        s.id === id
          ? ({
              ...s,
              ...partial,
              tts_status:
                partial.translated_text !== undefined
                  ? 'pending'
                  : s.tts_status,
            } as SubtitleSegment)
          : s
      );
      return {
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs }
      };
    }),

  splitSegment: (id, splitTime) =>
    set((state) => {
      if (!state.activeFile) return state;
      const idx = state.segments.findIndex((s) => s.id === id);
      if (idx === -1) return state;
      const seg = state.segments[idx];
      const maxId = Math.max(...state.segments.map((s) => s.id));
      const seg1: SubtitleSegment = { ...seg, end: splitTime };
      const seg2: SubtitleSegment = {
        ...seg,
        id: maxId + 1,
        start: splitTime,
        tts_status: 'pending',
      };
      const newSegs = [...state.segments];
      newSegs.splice(idx, 1, seg1, seg2);
      return { 
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs } 
      };
    }),

  mergeSegments: (id1, id2) =>
    set((state) => {
      if (!state.activeFile) return state;
      const s1 = state.segments.find((s) => s.id === id1);
      const s2 = state.segments.find((s) => s.id === id2);
      if (!s1 || !s2) return state;
      const merged: SubtitleSegment = {
        ...s1,
        end: Math.max(s1.end, s2.end),
        start: Math.min(s1.start, s2.start),
        source_text: s1.source_text + ' ' + s2.source_text,
        translated_text: s1.translated_text + ' ' + s2.translated_text,
        tts_status: 'pending',
      };
      const newSegs = state.segments
          .filter((s) => s.id !== id2)
          .map((s) => (s.id === id1 ? merged : s));
      return {
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs }
      };
    }),

  deleteSegment: (id) =>
    set((state) => {
      if (!state.activeFile) return state;
      const newSegs = state.segments.filter((s) => s.id !== id);
      return {
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs },
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  clearAll: () => set({ segments: [], selectedId: null }),
}));
