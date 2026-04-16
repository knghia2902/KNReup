import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectConfig {
  // Language & Translation
  language: string;
  translation_engine: string;
  gemini_api_key: string;
  deepl_api_key: string;
  deepseek_api_key: string;
  openai_api_key: string;
  openai_base_url: string;
  openai_model: string;
  ollama_url: string;
  ollama_model: string;
  translation_style: string;
  custom_prompt: string;
  // Subtitle Style
  subtitle_enabled: boolean;
  subtitle_x: number;
  subtitle_y: number;
  subtitle_w: number;
  subtitle_h: number;
  subtitle_font_size: number;
  subtitle_font: string;
  subtitle_color: string;
  subtitle_outline_color: string;
  asr_enabled: boolean;
  ocr_enabled: boolean;
  ocr_x: number;
  ocr_y: number;
  ocr_w: number;
  ocr_h: number;
  // TTS
  dubbing_enabled: boolean;
  tts_engine: string;
  voice: string;
  speed: number;
  volume: number;
  pitch: number;
  original_volume: number;
  // Output
  container: 'mp4' | 'mkv';
  codec: 'h264' | 'h265' | 'vp9';
  crf: number;
  preset: string;
  resolution: string;
  audio_mix_mode: string;
  // Video Ratio
  video_ratio: 'original' | '16:9' | '9:16';
  // Advanced Effects
  blur_enabled: boolean;
  blur_x: number;
  blur_y: number;
  blur_w: number;
  blur_h: number;
  watermark_enabled: boolean;
  watermark_text: string;
  watermark_image: string;
  watermark_x: number;
  watermark_y: number;
  watermark_opacity: number;
  watermark_fontsize: number;
  // Image Logo (tách riêng)
  image_logo_enabled: boolean;
  image_logo_file: string;
  image_logo_x: number;
  image_logo_y: number;
  image_logo_w: number;
  image_logo_h: number;
  image_logo_opacity: number;
  crop_enabled: boolean;
  bgm_enabled: boolean;
  bgm_file: string;
  bgm_volume: number;
  ducking_strength: number;
  // Timeline State
  timelineZoom: number;
  timelineScrollX: number;
}

interface ProjectStore extends ProjectConfig {
  fileConfigs: Record<string, Partial<ProjectConfig>>;
  activeFile: string | null;

  setActiveFile: (path: string | null) => void;
  updateConfig: (partial: Partial<ProjectConfig>) => void;
  resetConfig: () => void;
  applyPreset: (preset: Partial<ProjectConfig>) => void;
}

const DEFAULT_CONFIG: ProjectConfig = {
  language: 'auto',
  translation_engine: 'argos',
  gemini_api_key: '',
  deepl_api_key: '',
  deepseek_api_key: '',
  openai_api_key: 'sk-569e687ef4aae4e1-h1vmyh-217baa1c',
  openai_base_url: 'https://9router.khacnghia.xyz/v1',
  openai_model: 'knghia-v1',
  ollama_url: 'http://localhost:11434',
  ollama_model: 'gemma4:e4b',
  translation_style: 'default',
  custom_prompt: '',
  subtitle_enabled: true,
  subtitle_x: 100,
  subtitle_y: 800,
  subtitle_w: 880,
  subtitle_h: 150,
  subtitle_font_size: 50,
  subtitle_font: 'Be Vietnam Pro',
  subtitle_color: '#FFFF00',
  subtitle_outline_color: '#000000',
  asr_enabled: true,
  ocr_enabled: false,
  ocr_x: 50,
  ocr_y: 50,
  ocr_w: 300,
  ocr_h: 150,
  dubbing_enabled: true,
  tts_engine: 'edge_tts',
  voice: 'vi-VN-HoaiMyNeural',
  speed: 1.0,
  volume: 1.0,
  pitch: 1.0,
  original_volume: 0.1,
  container: 'mp4',
  codec: 'h264',
  crf: 23,
  preset: 'fast',
  resolution: '1080p',
  audio_mix_mode: 'mix',
  video_ratio: 'original',
  blur_enabled: false,
  blur_x: 0,
  blur_y: 0,
  blur_w: 200,
  blur_h: 100,
  watermark_enabled: false,
  watermark_text: '',
  watermark_image: '',
  watermark_x: 50,
  watermark_y: 50,
  watermark_opacity: 0.8,
  watermark_fontsize: 40,
  image_logo_enabled: false,
  image_logo_file: '',
  image_logo_x: 50,
  image_logo_y: 50,
  image_logo_w: 150,
  image_logo_h: 150,
  image_logo_opacity: 0.8,
  crop_enabled: false,
  bgm_enabled: false,
  bgm_file: '',
  bgm_volume: 0.5,
  ducking_strength: 0.2,
  timelineZoom: 1,
  timelineScrollX: 0,
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      fileConfigs: {},
      activeFile: null,

      setActiveFile: (path) => set((state) => {
        if (state.activeFile === path) return {};
        
        const targetConfig = path && state.fileConfigs[path] ? state.fileConfigs[path] : { ...DEFAULT_CONFIG };
        // Giữ nguyên API Key của người dùng không bị đè bởi Default
        delete targetConfig.gemini_api_key;
        delete targetConfig.deepl_api_key;
        delete targetConfig.deepseek_api_key;
        delete targetConfig.openai_api_key;
        delete targetConfig.openai_base_url;
        delete targetConfig.openai_model;
        delete targetConfig.ollama_url;
        delete targetConfig.ollama_model;

        return {
          activeFile: path,
          ...targetConfig
        };
      }),

      updateConfig: (partial) => set((state) => {
        if (!state.activeFile) return partial;

        const currentFileConfig = state.fileConfigs[state.activeFile] || { ...DEFAULT_CONFIG };
        const newFileConfig = { ...currentFileConfig, ...partial };
        
        delete newFileConfig.gemini_api_key;
        delete newFileConfig.deepl_api_key;
        delete newFileConfig.deepseek_api_key;
        delete newFileConfig.openai_api_key;
        delete newFileConfig.openai_base_url;
        delete newFileConfig.openai_model;
        delete newFileConfig.ollama_url;
        delete newFileConfig.ollama_model;

        return {
          ...partial,
          fileConfigs: {
            ...state.fileConfigs,
            [state.activeFile]: newFileConfig
          }
        };
      }),

      resetConfig: () => set((state) => {
        if (!state.activeFile) return DEFAULT_CONFIG;
        const resetData: Partial<ProjectConfig> = { ...DEFAULT_CONFIG };
        delete resetData.gemini_api_key;
        delete resetData.deepl_api_key;
        delete resetData.deepseek_api_key;
        delete resetData.openai_api_key;
        delete resetData.openai_base_url;
        delete resetData.openai_model;
        delete resetData.ollama_url;
        delete resetData.ollama_model;

        return {
          ...resetData,
          fileConfigs: {
            ...state.fileConfigs,
            [state.activeFile]: resetData
          }
        };
      }),

      applyPreset: (preset) => set((state) => {
        if (!state.activeFile) return preset;
        const currentFileConfig = state.fileConfigs[state.activeFile] || { ...DEFAULT_CONFIG };
        const newFileConfig = { ...currentFileConfig, ...preset };
        
        delete newFileConfig.gemini_api_key;
        delete newFileConfig.deepl_api_key;
        delete newFileConfig.deepseek_api_key;
        delete newFileConfig.openai_api_key;
        delete newFileConfig.openai_base_url;
        delete newFileConfig.openai_model;
        delete newFileConfig.ollama_url;
        delete newFileConfig.ollama_model;

        return {
          ...preset,
          fileConfigs: {
            ...state.fileConfigs,
            [state.activeFile]: newFileConfig
          }
        };
      }),
    }),
    { name: 'knreup-project-config' }
  )
);
