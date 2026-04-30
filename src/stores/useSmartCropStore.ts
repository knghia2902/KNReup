/**
 * useSmartCropStore — Persist Smart Crop session + crop history.
 *
 * - `session`: current working state (input, output, settings)
 * - `history`: map of inputPath → outputPath for instant recall
 *
 * When user selects a file that was previously cropped,
 * the output shows immediately without re-processing.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CropHistoryEntry {
  outputPath: string;
  alpha: number;
  deadZone: number;
  detectEvery: number;
  fallbackCenter: boolean;
  mode: string;       // GPU or CPU
  timestamp: number;
}

export interface SmartCropSession {
  inputPath: string | null;
  outputPath: string | null;
  alpha: number;
  deadZone: number;
  detectEvery: number;
  fallbackCenter: boolean;
  lastStage: 'idle' | 'done' | 'error';
  lastMessage: string;
  lastMode: string;
  timestamp: number;
  // Manual crop mode fields
  mode: 'auto' | 'manual';
  manualStage: 'idle' | 'analyzing' | 'review' | 'rendering' | 'done';
  trackingJsonPath: string | null;
  outWidth: number;
  outHeight: number;
}

interface SmartCropState {
  session: SmartCropSession;
  /** inputPath → CropHistoryEntry (persisted crop results) */
  history: Record<string, CropHistoryEntry>;

  saveSession: (update: Partial<SmartCropSession>) => void;
  clearSession: () => void;

  /** Record a completed crop into history */
  addToHistory: (inputPath: string, entry: CropHistoryEntry) => void;
  /** Look up a previous crop result by input path */
  getFromHistory: (inputPath: string) => CropHistoryEntry | null;
  /** Remove a single entry from history */
  removeFromHistory: (inputPath: string) => void;
  /** Clear all history */
  clearHistory: () => void;

  /** Mode toggle */
  setMode: (mode: 'auto' | 'manual') => void;
  /** Manual stage machine */
  setManualStage: (stage: SmartCropSession['manualStage']) => void;
}

const DEFAULT_SESSION: SmartCropSession = {
  inputPath: null,
  outputPath: null,
  alpha: 0.08,
  deadZone: 0.03,
  detectEvery: 3,
  fallbackCenter: true,
  lastStage: 'idle',
  lastMessage: '',
  lastMode: 'GPU',
  timestamp: 0,
  mode: 'auto',
  manualStage: 'idle',
  trackingJsonPath: null,
  outWidth: 1080,
  outHeight: 1920,
};

export const useSmartCropStore = create<SmartCropState>()(
  persist(
    (set, get) => ({
      session: { ...DEFAULT_SESSION },
      history: {},

      saveSession: (update) =>
        set((state) => ({
          session: { ...state.session, ...update, timestamp: Date.now() },
        })),

      clearSession: () =>
        set({ session: { ...DEFAULT_SESSION } }),

      addToHistory: (inputPath, entry) =>
        set((state) => {
          const newHistory = { ...state.history, [inputPath]: entry };
          // Keep max 50 entries (prune oldest if exceeded)
          const keys = Object.keys(newHistory);
          if (keys.length > 50) {
            const sorted = keys.sort(
              (a, b) => (newHistory[a]?.timestamp ?? 0) - (newHistory[b]?.timestamp ?? 0)
            );
            // Remove oldest entries
            for (let i = 0; i < keys.length - 50; i++) {
              delete newHistory[sorted[i]];
            }
          }
          return { history: newHistory };
        }),

      getFromHistory: (inputPath) => {
        return get().history[inputPath] ?? null;
      },

      removeFromHistory: (inputPath) =>
        set((state) => {
          const newHistory = { ...state.history };
          delete newHistory[inputPath];
          return { history: newHistory };
        }),

      clearHistory: () => set({ history: {} }),

      setMode: (mode) =>
        set((state) => ({
          session: { ...state.session, mode, manualStage: 'idle', timestamp: Date.now() },
        })),

      setManualStage: (stage) =>
        set((state) => ({
          session: { ...state.session, manualStage: stage, timestamp: Date.now() },
        })),
    }),
    { name: 'knreup-smart-crop' }
  )
);
