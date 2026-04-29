/**
 * useSmartCropStore — Persist Smart Crop session across window close/reopen.
 * Saves input/output paths, settings, and processing state to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface SmartCropState {
  session: SmartCropSession;
  saveSession: (update: Partial<SmartCropSession>) => void;
  clearSession: () => void;
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
};

export const useSmartCropStore = create<SmartCropState>()(
  persist(
    (set) => ({
      session: { ...DEFAULT_SESSION },

      saveSession: (update) =>
        set((state) => ({
          session: { ...state.session, ...update, timestamp: Date.now() },
        })),

      clearSession: () =>
        set({ session: { ...DEFAULT_SESSION } }),
    }),
    { name: 'knreup-smart-crop' }
  )
);
