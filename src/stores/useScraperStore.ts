import { create } from 'zustand';

export type PipelineStatus = 'idle' | 'scraping' | 'scripting' | 'tts' | 'rendering' | 'done' | 'error';

interface ScraperState {
  url: string;
  status: PipelineStatus;
  progress: number;
  message: string;
  videoUrl: string | null;
  sessionId: string | null;
  
  setUrl: (url: string) => void;
  setStatus: (status: PipelineStatus, message?: string) => void;
  setProgress: (progress: number) => void;
  setVideoUrl: (url: string) => void;
  setSessionId: (id: string) => void;
  
  startPipeline: (url: string) => Promise<void>;
  reset: () => void;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
  url: '',
  status: 'idle',
  progress: 0,
  message: '',
  videoUrl: null,
  sessionId: null,

  setUrl: (url) => set({ url }),
  setStatus: (status, message = '') => set({ status, message }),
  setProgress: (progress) => set({ progress }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setSessionId: (sessionId) => set({ sessionId }),
  reset: () => set({ status: 'idle', progress: 0, message: '', videoUrl: null, sessionId: null }),

  startPipeline: async (targetUrl: string) => {
    set({ url: targetUrl, status: 'scraping', progress: 5, message: 'Đang trích xuất nội dung từ URL...', videoUrl: null, sessionId: null });

    try {
      // 1. Generate Script
      const scriptRes = await fetch('http://127.0.0.1:8008/api/video-gen/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      if (!scriptRes.ok) {
        throw new Error('Lỗi khi tạo kịch bản từ bài viết.');
      }
      
      const scriptData = await scriptRes.json();
      const sessionId = scriptData.session_id;
      set({ sessionId, status: 'scripting', progress: 20, message: 'Đã tạo xong kịch bản. Đang bắt đầu quá trình render...' });

      // 2. Start Render Pipeline (SSE)
      const renderRes = await fetch('http://127.0.0.1:8008/api/video-gen/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          script: scriptData.script
        })
      });

      if (!renderRes.body) {
        throw new Error('Không thể kết nối đến stream render.');
      }

      const reader = renderRes.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'done') {
              set({ status: 'done', progress: 100, message: 'Hoàn tất!', videoUrl: data.videoUrl });
              return;
            } else if (data.status === 'error') {
              throw new Error(data.message || 'Lỗi trong quá trình render');
            } else {
              // Update state based on progress
              if (data.status === 'tts') {
                set({ status: 'tts', progress: data.progress, message: data.message });
              } else if (data.status === 'rendering' || data.status === 'audio_mix' || data.status === 'compositing') {
                set({ status: 'rendering', progress: data.progress, message: data.message });
              }
            }
          } catch (e) {
            // Ignore parse error for incomplete chunks
          }
        }
      }
      
    } catch (error: any) {
      console.error("Pipeline failed:", error);
      set({ status: 'error', progress: 0, message: error.message || 'Có lỗi xảy ra.' });
    }
  }
}));
