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
  videoDuration: number;
  videoDimensions: {w: number, h: number} | null;
  selectedId: number | null;
  setActiveFile: (path: string | null) => void;
  setVideoDuration: (duration: number) => void;
  setVideoDimensions: (dims: {w: number, h: number} | null) => void;
  setSegments: (segments: SubtitleSegment[], targetPath?: string) => void;
  selectSegment: (id: number | null) => void;
  updateSegment: (id: number, partial: Partial<SubtitleSegment>) => void;
  splitSegment: (id: number, splitTime: number) => void;
  autoSplitLongSegments: () => void;
  mergeSegments: (id1: number, id2: number) => void;
  trimSegment: (id: number, newStart: number, newEnd: number) => void;
  deleteSegment: (id: number) => void;
  deleteAndRippleSubtitle: (id: number) => void;
  clearAll: () => void;
}

export const useSubtitleStore = create<SubtitleStore>((set) => ({
  fileSegments: {},
  activeFile: null,
  segments: [],
  videoDuration: 30, // Default fallback
  videoDimensions: null,
  selectedId: null,

  setActiveFile: (path) => set((state) => ({
    activeFile: path,
    segments: path && state.fileSegments[path] ? state.fileSegments[path] : [],
    selectedId: null
  })),

  setVideoDuration: (duration) => set({ videoDuration: duration }),
  setVideoDimensions: (dims) => set({ videoDimensions: dims }),

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
      
      const duration = seg.end - seg.start;
      if (duration <= 0) return state;
      const ratio = (splitTime - seg.start) / duration;
      
      const splitText = (text: string) => {
         if (!text) return ["", ""];
         const pos = Math.floor(text.length * ratio);
         return [text.substring(0, pos), text.substring(pos)];
      };

      const [src1, src2] = splitText(seg.source_text);
      const [trans1, trans2] = splitText(seg.translated_text);

      const maxId = Math.max(...state.segments.map((s) => s.id), 0);
      const seg1: SubtitleSegment = { ...seg, end: splitTime, source_text: src1.trim(), translated_text: trans1.trim() };
      const seg2: SubtitleSegment = {
        ...seg,
        id: maxId + 1,
        start: splitTime,
        source_text: src2.trim(),
        translated_text: trans2.trim(),
        tts_status: 'pending',
      };
      
      const newSegs = [...state.segments];
      newSegs.splice(idx, 1, seg1, seg2);
      return { 
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs } 
      };
    }),

  autoSplitLongSegments: () =>
    set((state) => {
      if (!state.activeFile) return state;
      const newSegs: SubtitleSegment[] = [];
      let nextId = Math.max(...state.segments.map(s => s.id), 0) + 1;

      state.segments.forEach(seg => {
        const text = seg.translated_text || seg.source_text || '';
        const words = text.split(' ');

        if (words.length > 8 && (text.includes('.') || text.includes(',') || text.includes('?') || text.includes('!'))) {
           const midPoint = Math.floor(text.length / 2);
           let splitIndex = -1;
           
           for (let offset = 0; offset < midPoint; offset++) {
              if (['.', ',', '?', '!'].includes(text[midPoint + offset])) {
                 splitIndex = midPoint + offset + 1;
                 break;
              }
              if (['.', ',', '?', '!'].includes(text[midPoint - offset])) {
                 splitIndex = midPoint - offset + 1;
                 break;
              }
           }

           if (splitIndex !== -1 && splitIndex > 5 && splitIndex < text.length - 5) {
              const ratio = splitIndex / text.length;
              const splitTime = seg.start + (seg.end - seg.start) * ratio;

              let trans1 = text.substring(0, splitIndex).trim();
              if (trans1.endsWith(',')) trans1 = trans1.slice(0, -1);
              let trans2 = text.substring(splitIndex).trim();
              if (trans2.endsWith(',')) trans2 = trans2.slice(0, -1);

              const srcRatioPos = Math.floor(seg.source_text.length * ratio);
              let src1 = seg.source_text.substring(0, srcRatioPos).trim();
              if (src1.endsWith(',')) src1 = src1.slice(0, -1);
              let src2 = seg.source_text.substring(srcRatioPos).trim();
              if (src2.endsWith(',')) src2 = src2.slice(0, -1);

              newSegs.push({ ...seg, end: splitTime, source_text: src1, translated_text: trans1 });
              newSegs.push({
                 ...seg,
                 id: nextId++,
                 start: splitTime,
                 source_text: src2,
                 translated_text: trans2,
                 tts_status: 'pending'
              });
              return;
           }
        }
        newSegs.push(seg);
      });

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
        source_text: s1.source_text + '\n' + s2.source_text,
        translated_text: s1.translated_text + '\n' + s2.translated_text,
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

  trimSegment: (id, newStart, newEnd) =>
    set((state) => {
      if (!state.activeFile) return state;
      const newSegs = state.segments.map((s) =>
        s.id === id ? { ...s, start: newStart, end: newEnd } : s
      );
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

  deleteAndRippleSubtitle: (id) =>
    set((state) => {
      if (!state.activeFile) return state;
      const targetIdx = state.segments.findIndex(s => s.id === id);
      if (targetIdx === -1) return state;
      const targetSeg = state.segments[targetIdx];
      const duration = targetSeg.end - targetSeg.start;
      
      const newSegs = state.segments.filter(s => s.id !== id).map(s => {
        if (s.start > targetSeg.start) {
          return { ...s, start: s.start - duration, end: s.end - duration };
        }
        return s;
      });
      
      return {
        segments: newSegs,
        fileSegments: { ...state.fileSegments, [state.activeFile]: newSegs },
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  clearAll: () => set({ segments: [], selectedId: null }),
}));
