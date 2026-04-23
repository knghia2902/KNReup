import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  filename: string;
  file_path: string;
  text: string;
  engine: string;
  config: Record<string, any>;
  created_at: string;
  type: 'tts';
}

export interface VoiceStudioState {
  history: HistoryItem[];
  loading: boolean;
  activeTab: 'tts';
  
  // Actions
  setActiveTab: (tab: 'tts') => void;
  fetchHistory: (sidecarUrl: string) => Promise<void>;
  generateTTS: (sidecarUrl: string, text: string, engine: string, config: any) => Promise<void>;
  deleteHistory: (sidecarUrl: string, id: string) => Promise<void>;
}

export const useVoiceStudioStore = create<VoiceStudioState>((set, get) => ({
  history: [],
  loading: false,
  activeTab: 'tts',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchHistory: async (sidecarUrl: string) => {
    try {
      const response = await fetch(`${sidecarUrl}/api/voice-studio/history`);
      if (response.ok) {
        const data = await response.json();
        set({ history: data.items || [] });
      } else if (response.status === 404) {
        // Handle migration gracefully if route not found
        // Wait, the route is actually /api/voice-studio/history
      }
    } catch (e) {
      console.error('Failed to fetch voice studio history', e);
    }
  },

  generateTTS: async (sidecarUrl: string, text: string, engine: string, config: any) => {
    set({ loading: true });
    try {
      const payload = {
        text,
        engine,
        config,
        type: 'tts',
        ...config // spread other config like speed, pitch into root if expected
      };

      const res = await fetch(`${sidecarUrl}/api/voice-studio/generate-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        // Refresh history
        await get().fetchHistory(sidecarUrl);
      } else {
        const err = await res.json();
        console.error('TTS Generation failed:', err);
      }
    } catch (e) {
      console.error('TTS generation request failed', e);
    } finally {
      set({ loading: false });
    }
  },

  deleteHistory: async (sidecarUrl: string, id: string) => {
    try {
      const res = await fetch(`${sidecarUrl}/api/voice-studio/history/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        set(state => ({
          history: state.history.filter(item => item.id !== id)
        }));
      }
    } catch (e) {
      console.error('Failed to delete history item', e);
    }
  }
}));
