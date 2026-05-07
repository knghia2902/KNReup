import { create } from 'zustand';

// Types
export type LabMode = 'auto' | 'manual';
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';
export type PipelineStep = 'crawl' | 'script' | 'tts' | 'render' | 'encode';

export interface OllamaModel {
  name: string;
  size?: string;
  modified_at?: string;
}

export interface LabHistoryEntry {
  session_id: string;
  url: string;
  model: string;
  theme: string;
  language: string;
  timestamp: string;
  duration_sec?: number;
  file_size_bytes?: number;
  video_path: string;
}

export interface LabLogEntry {
  timestamp: string;
  step: number;
  stepName: PipelineStep | '';
  status: string;
  message: string;
}

export interface VideoGenLabState {
  // Config
  url: string;
  mode: LabMode;
  selectedModel: string;
  selectedTemplate: number;
  selectedTemplateSet: string;
  selectedTheme: string;
  selectedVoice: string;
  selectedLanguage: string;

  // Available Voices
  availableVoices: Record<string, {id: string, name: string}[]>;

  // Ollama models (auto-detect)
  ollamaModels: OllamaModel[];
  ollamaOnline: boolean;

  // Pipeline state
  pipelineStatus: PipelineStatus;
  currentStep: number;
  totalSteps: number;
  currentStepName: PipelineStep | '';
  stepProgress: number;
  overallProgress: number;

  // Script (for manual mode review)
  script: any | null;
  sessionId: string | null;

  // Output
  videoUrl: string | null;
  videoMetadata: { duration: number; size_bytes: number; resolution: string } | null;

  // Log
  logs: LabLogEntry[];

  // History
  history: LabHistoryEntry[];

  // Error
  errorMessage: string | null;
  errorSuggestion: string | null;

  // Actions
  setUrl: (url: string) => void;
  setMode: (mode: LabMode) => void;
  setSelectedModel: (model: string) => void;
  setSelectedTemplate: (idx: number) => void;
  setSelectedTemplateSet: (setId: string) => void;
  setSelectedTheme: (theme: string) => void;
  setSelectedVoice: (voice: string) => void;
  setSelectedLanguage: (lang: string) => void;
  fetchOllamaModels: () => Promise<void>;
  fetchVoices: () => Promise<void>;
  startPipeline: () => Promise<void>;
  continuePipeline: (modifiedScript?: any) => Promise<void>;
  fetchHistory: () => Promise<void>;
  viewHistoryEntry: (entry: LabHistoryEntry) => void;
  deleteHistoryEntry: (sessionId: string) => Promise<void>;
  reset: () => void;
  addLog: (entry: LabLogEntry) => void;
}

export const useVideoGenLabStore = create<VideoGenLabState>((set, get) => ({
  url: '',
  mode: 'manual',
  selectedModel: '',
  selectedTemplate: 0,
  selectedTemplateSet: 'default',
  selectedTheme: 'tech-blue',
  selectedVoice: 'default_female',
  selectedLanguage: 'Vietnamese',

  availableVoices: {},

  ollamaModels: [],
  ollamaOnline: false,

  pipelineStatus: 'idle',
  currentStep: 0,
  totalSteps: 5,
  currentStepName: '',
  stepProgress: 0,
  overallProgress: 0,

  script: null,
  sessionId: null,

  videoUrl: null,
  videoMetadata: null,

  logs: [],
  history: [],

  errorMessage: null,
  errorSuggestion: null,

  setUrl: (url) => set({ url }),
  setMode: (mode) => set({ mode }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedTemplate: (idx) => set({ selectedTemplate: idx }),
  setSelectedTemplateSet: (setId) => set({ selectedTemplateSet: setId }),
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  addLog: (entry) => set((state) => ({ logs: [...state.logs, entry] })),

  fetchOllamaModels: async () => {
    try {
      const res = await fetch('http://127.0.0.1:8008/api/video-gen/lab/models');
      const data = await res.json();
      if (data.online) {
        set({ ollamaOnline: true, ollamaModels: data.models.map((m: any) => ({ name: m.name, size: m.size, modified_at: m.modified_at })) });
        if (data.models.length > 0 && !get().selectedModel) {
          // auto select
          const gemma = data.models.find((m: any) => m.name.includes('gemma4:e2b'));
          set({ selectedModel: gemma ? gemma.name : data.models[0].name });
        }
      } else {
        set({ ollamaOnline: false, ollamaModels: [] });
      }
    } catch (e) {
      console.error(e);
      set({ ollamaOnline: false, ollamaModels: [] });
    }
  },

  fetchVoices: async () => {
    try {
      const res = await fetch('http://127.0.0.1:8008/api/video-gen/lab/voices');
      const data = await res.json();
      if (data.voices) {
        set({ availableVoices: data.voices });
      }
    } catch (e) {
      console.error('Failed to fetch voices:', e);
    }
  },

  startPipeline: async () => {
    const { url, mode, selectedModel, selectedTheme, selectedTemplateSet, selectedVoice, selectedLanguage } = get();
    if (!url) return;

    set({ 
      pipelineStatus: 'running', 
      logs: [], 
      currentStep: 0, 
      stepProgress: 0, 
      overallProgress: 0,
      errorMessage: null,
      errorSuggestion: null,
      script: null,
      sessionId: null,
      videoUrl: null,
      videoMetadata: null
    });

    let receivedDone = false;
    try {
      const response = await fetch('http://127.0.0.1:8008/api/video-gen/lab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          model: selectedModel,
          theme: selectedTheme,
          template_set: selectedTemplateSet,
          voice_id: selectedVoice,
          language: selectedLanguage,
          mode
        })
      });

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              receivedDone = true;
              if (get().pipelineStatus !== 'complete') {
                set({ pipelineStatus: 'complete' });
              }
              get().fetchHistory();
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              const now = new Date().toISOString().split('T')[1].substring(0, 8);
              
              if (data.status === 'done') {
                receivedDone = true;
                set({ 
                  pipelineStatus: 'complete',
                  videoUrl: `http://127.0.0.1:8008${data.videoUrl}`,
                  sessionId: data.session_id,
                  videoMetadata: data.metadata,
                  overallProgress: 100
                });
                get().addLog({ timestamp: now, step: 5, stepName: 'encode', status: 'done', message: 'Pipeline finished' });
                get().fetchHistory();
                continue;
              }

              if (data.status === 'paused') {
                receivedDone = true; // paused = intentional stream end
                set({ 
                  pipelineStatus: 'paused',
                  script: data.script,
                  sessionId: data.session_id,
                  currentStep: data.step,
                  currentStepName: data.stepName
                });
                get().addLog({ timestamp: now, step: data.step, stepName: data.stepName, status: 'paused', message: data.message });
                continue;
              }

              if (data.status === 'error') {
                set({ 
                  pipelineStatus: 'error', 
                  errorMessage: data.message,
                });
                get().addLog({ timestamp: now, step: data.step, stepName: data.stepName, status: 'error', message: data.message });
                continue;
              }

              // Normal progress
              let overall = 0;
              const { step, stepName, progress, message } = data;
              if (step === 1) overall = (progress / 100) * 20; // crawl: 0-20%
              else if (step === 2) overall = 20 + (progress / 100) * 20; // script: 20-40%
              else if (step === 3) overall = 40 + (progress / 100) * 20; // tts: 40-60%
              else if (step === 4) overall = 60 + (progress / 100) * 30; // render: 60-90%
              else if (step === 5) overall = 90 + (progress / 100) * 10; // encode: 90-100%

              set({
                currentStep: step,
                currentStepName: stepName,
                stepProgress: progress,
                overallProgress: overall
              });
              
              get().addLog({ timestamp: now, step, stepName, status: data.status, message });
              
              if (data.data?.script) {
                set({ script: data.data.script });
              }
            } catch (e) {
              console.error('Failed to parse SSE JSON:', dataStr, e);
            }
          }
        }
      }

      // Stream ended without done/paused event — connection dropped
      if (!receivedDone && get().pipelineStatus === 'running') {
        set({ pipelineStatus: 'error', errorMessage: 'Kết nối bị gián đoạn. Vui lòng thử lại.' });
      }
    } catch (e: any) {
      if (!receivedDone) {
        set({ pipelineStatus: 'error', errorMessage: e.message });
      }
    }
  },

  continuePipeline: async (modifiedScript?: any) => {
    const { sessionId, selectedTheme, selectedTemplateSet, selectedVoice } = get();
    if (!sessionId) return;
    
    const scriptToUse = modifiedScript || get().script;

    set({ pipelineStatus: 'running', overallProgress: 40 });

    let receivedDone = false;

    try {
      const response = await fetch(`http://127.0.0.1:8008/api/video-gen/lab/continue/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptToUse,
          theme: selectedTheme,
          template_set: selectedTemplateSet,
          voice_id: selectedVoice,
        })
      });

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              receivedDone = true;
              if (get().pipelineStatus !== 'complete') {
                set({ pipelineStatus: 'complete' });
              }
              get().fetchHistory();
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              const now = new Date().toISOString().split('T')[1].substring(0, 8);
              
              if (data.status === 'done') {
                receivedDone = true;
                set({ 
                  pipelineStatus: 'complete',
                  videoUrl: `http://127.0.0.1:8008${data.videoUrl}`,
                  sessionId: data.session_id || sessionId,
                  videoMetadata: data.metadata,
                  overallProgress: 100
                });
                get().addLog({ timestamp: now, step: 5, stepName: 'encode', status: 'done', message: 'Pipeline finished' });
                get().fetchHistory();
                continue;
              }

              if (data.status === 'error') {
                set({ pipelineStatus: 'error', errorMessage: data.message });
                get().addLog({ timestamp: now, step: data.step, stepName: data.stepName, status: 'error', message: data.message });
                continue;
              }

              // Normal progress
              let overall = 0;
              const { step, stepName, progress, message } = data;
              if (step === 3) overall = 40 + (progress / 100) * 20; // tts: 40-60%
              else if (step === 4) overall = 60 + (progress / 100) * 30; // render: 60-90%
              else if (step === 5) overall = 90 + (progress / 100) * 10; // encode: 90-100%

              set({
                currentStep: step,
                currentStepName: stepName,
                stepProgress: progress,
                overallProgress: overall
              });
              
              get().addLog({ timestamp: now, step, stepName, status: data.status, message });
            } catch (e) {
              console.error('Failed to parse SSE JSON:', dataStr, e);
            }
          }
        }
      }

      // Stream ended without done event — connection may have dropped
      if (!receivedDone && get().pipelineStatus === 'running') {
        set({ pipelineStatus: 'error', errorMessage: 'Kết nối bị gián đoạn. Vui lòng thử lại.' });
      }
    } catch (e: any) {
      if (!receivedDone) {
        set({ pipelineStatus: 'error', errorMessage: e.message });
      }
    }
  },

  fetchHistory: async () => {
    try {
      const res = await fetch('http://127.0.0.1:8008/api/video-gen/lab/history');
      const data = await res.json();
      set({ history: data.history || [] });
    } catch (e) {
      console.error(e);
    }
  },

  viewHistoryEntry: (entry: LabHistoryEntry) => {
    set({
      pipelineStatus: 'complete',
      url: entry.url,
      selectedModel: entry.model,
      selectedTheme: entry.theme,
      selectedLanguage: entry.language,
      sessionId: entry.session_id,
      videoUrl: `http://127.0.0.1:8008/api/video-gen/lab/download/${entry.session_id}`,
      videoMetadata: {
        duration: entry.duration_sec || 0,
        size_bytes: entry.file_size_bytes || 0,
        resolution: '1080x1920'
      },
      overallProgress: 100
    });
  },

  deleteHistoryEntry: async (sessionId: string) => {
    try {
      await fetch(`http://127.0.0.1:8008/api/video-gen/lab/history/${sessionId}`, {
        method: 'DELETE'
      });
      // Filter out locally right away
      set({ history: get().history.filter(e => e.session_id !== sessionId) });
    } catch (e) {
      console.error(e);
    }
  },

  reset: () => {
    set({
      pipelineStatus: 'idle',
      currentStep: 0,
      currentStepName: '',
      stepProgress: 0,
      overallProgress: 0,
      script: null,
      sessionId: null,
      videoUrl: null,
      videoMetadata: null,
      logs: [],
      errorMessage: null,
      errorSuggestion: null
    });
  }

}));
