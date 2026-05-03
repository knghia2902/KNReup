import { create } from 'zustand';

export interface VideoScriptScene {
    id: string;
    type: 'hook' | 'body' | 'outro';
    voiceText: string;
    templateData: {
        template: 'hook' | 'comparison' | 'stat-hero' | 'feature-list' | 'callout' | 'outro';
        [key: string]: any;
    };
    sfx?: { name: string; volume?: number; startOffsetSec?: number };
}

export interface VideoScript {
    version: string;
    metadata: {
        title: string;
        source: { url: string; domain: string; image: string | null };
        channel: string;
    };
    voice: {
        provider: string;
        voiceId: string;
        speed: number;
    };
    scenes: VideoScriptScene[];
    // Legacy compat fields (may still be set by backend)
    title?: string;
    topic?: string;
}

export interface VideoGeneratorState {
    // Current step in the stepper (1-5)
    currentStep: number;
    setStep: (step: number) => void;

    // URL Input step
    url: string;
    setUrl: (url: string) => void;

    // Script & Scrape status
    isScraping: boolean;
    isGeneratingScript: boolean;
    script: VideoScript | null;
    
    // Settings
    voiceId: string;
    setVoiceId: (id: string) => void;
    template: string;
    setTemplate: (t: string) => void;
    
    // Preview
    previewAudioUrl: string | null;
    isPreviewPlaying: boolean;
    
    // Render State
    isRendering: boolean;
    renderProgress: number;
    renderStatus: string;
    videoUrl: string | null;

    // Session State
    sessionId: string | null;

    // Actions
    generateScript: () => Promise<void>;
    startRender: () => Promise<void>;
    updateScript: (script: VideoScript) => void;
    previewVoice: (text: string) => Promise<void>;
    reset: () => void;
}

export const useVideoGeneratorStore = create<VideoGeneratorState>((set, get) => ({
    currentStep: 1,
    setStep: (step) => set({ currentStep: step }),

    url: '',
    setUrl: (url) => set({ url }),

    isScraping: false,
    isGeneratingScript: false,
    script: null,

    voiceId: 'vi-VN-HoaiMyNeural',
    setVoiceId: (id) => set({ voiceId: id }),
    template: 'hook',
    setTemplate: (t) => set({ template: t }),

    previewAudioUrl: null,
    isPreviewPlaying: false,

    isRendering: false,
    renderProgress: 0,
    renderStatus: '',
    videoUrl: null,

    sessionId: null,

    updateScript: (script) => set({ script }),

    generateScript: async () => {
        const { url } = get();
        if (!url) return;

        set({
            isScraping: true,
            isGeneratingScript: true,
            renderStatus: 'Đang phân tích URL...'
        });

        try {
            const response = await fetch('http://127.0.0.1:8008/api/video-gen/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    llm_engine: 'ollama',
                    mode: 'auto'
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            set({
                isScraping: false,
                isGeneratingScript: false,
                script: data.script,
                sessionId: data.session_id,
                currentStep: 2, // Move to Script Review step
                renderStatus: ''
            });

        } catch (error) {
            set({
                isScraping: false,
                isGeneratingScript: false,
                renderStatus: 'Lỗi: Không thể tạo kịch bản'
            });
            console.error('Script generation error:', error);
        }
    },

    startRender: async () => {
        const { script, sessionId, voiceId, template } = get();
        if (!script || !sessionId) return;

        set({
            isRendering: true,
            renderProgress: 0,
            renderStatus: 'Đang kết nối server...',
            currentStep: 5 // Jump to render step
        });

        try {
            const response = await fetch('http://127.0.0.1:8008/api/video-gen/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    script,
                    template,
                    voice_id: voiceId
                })
            });

            if (!response.body) throw new Error('No readable stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        
                        if (data.status === 'done') {
                            set({
                                isRendering: false,
                                renderProgress: 100,
                                renderStatus: 'Hoàn tất',
                                videoUrl: data.videoUrl
                            });
                        } else if (data.status === 'error') {
                            set({
                                isRendering: false,
                                renderStatus: `Lỗi: ${data.message}`
                            });
                        } else {
                            set({
                                renderProgress: data.progress || 0,
                                renderStatus: data.message || ''
                            });
                        }
                    } catch (e) {
                        console.error('SSE JSON parse error', e);
                    }
                }
            }
        } catch (error) {
            set({
                isRendering: false,
                renderStatus: 'Không thể kết nối đến server'
            });
            console.error('Render error:', error);
        }
    },

    previewVoice: async (text: string) => {
        const { voiceId } = get();
        try {
            set({ isPreviewPlaying: true });
            const resp = await fetch('http://127.0.0.1:8008/api/pipeline/tts-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text.slice(0, 200), voice: voiceId, engine: 'omnivoice', speed: 1.0 })
            });
            if (!resp.ok) throw new Error('TTS failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            set({ previewAudioUrl: url, isPreviewPlaying: false });
        } catch {
            set({ isPreviewPlaying: false });
        }
    },

    reset: () => set({
        currentStep: 1,
        url: '',
        isScraping: false,
        isGeneratingScript: false,
        script: null,
        isRendering: false,
        renderProgress: 0,
        renderStatus: '',
        videoUrl: null,
        sessionId: null,
        previewAudioUrl: null,
        isPreviewPlaying: false
    })
}));
