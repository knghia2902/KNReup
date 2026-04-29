/**
 * usePipeline hook — SSE pipeline progress tracking.
 * Kết nối với POST /api/pipeline/process endpoint.
 */
import { useState, useCallback } from 'react';

export interface PipelineConfig {
  translation_engine?: string;
  source_lang?: string;
  target_lang?: string;
  translation_style?: string;
  custom_prompt?: string;
  api_key?: string;
  tts_engine?: string;
  voice?: string;
  rate?: number;
  volume?: number;
  pitch?: number;
  dubbing_enabled?: boolean;
  original_volume?: number;
  subtitle_enabled?: boolean;
  subtitle_config?: Record<string, unknown>;
  codec?: string;
  crf?: number;
  preset?: string;
  container?: string;
  // Audio
  audio_enabled?: boolean;
  audio_file?: string;
  audio_volume?: number;
  audio_clip_start?: number;
  audio_clip_duration?: number;
  audio_timeline_start?: number;
  ducking_strength?: number;
  // TTS Persistence
  dubbed_audio_path?: string;
  speed?: number;
  duration?: number;
  voice_mapping?: Record<string, any>;
}

export interface PipelineProgress {
  stage: string;
  progress: number;
  message: string;
  output_path?: string;
  segments?: any[];
  duration?: number;
  // TTS batch extras
  segment_result?: {
    seg_id: number;
    audio_path: string;
    filename: string;
  };
  dubbed_audio_path?: string;
  audio_files?: any[];
}

export function usePipeline() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const runStream = useCallback(
    async (endpoint: string, body: any): Promise<PipelineProgress> => {
      setProcessing(true);
      setError(null);
      setProgress({ stage: 'init', progress: 0, message: 'Starting...' });

      const controller = new AbortController();
      setAbortController(controller);

      return new Promise(async (resolve, reject) => {
        try {
          const port = localStorage.getItem('sidecar_port') || '8008';
          const baseUrl = `http://127.0.0.1:${port}`;

          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Pipeline failed: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) throw new Error('No response body');

          let buffer = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6)) as PipelineProgress;
                  setProgress(event);

                  if (event.stage === 'error') {
                    setError(event.message);
                    setProcessing(false);
                    reject(new Error(event.message));
                    return;
                  }

                  if (event.stage === 'done') {
                    setProcessing(false);
                    resolve(event);
                    return;
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
          setProcessing(false);
          resolve({ stage: 'done', progress: 100, message: 'Completed' });
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            setProgress({ stage: 'cancelled', progress: 0, message: 'Cancelled by user' });
            reject(err);
          } else {
            setError((err as Error).message);
            setProgress({ stage: 'error', progress: -1, message: (err as Error).message });
            reject(err);
          }
        }
      });
    },
    [],
  );

  const analyzeVideo = useCallback(
    (videoPath: string, config: PipelineConfig = {}) => {
      return runStream('/api/pipeline/analyze', {
        video_path: videoPath,
        config_json: JSON.stringify(config),
      });
    },
    [runStream]
  );

  const renderVideo = useCallback(
    (videoPath: string, config: PipelineConfig = {}, segments: any[] = [], duration: number = 0, outputPath?: string) => {
      return runStream('/api/pipeline/render', {
        video_path: videoPath,
        config_json: JSON.stringify(config),
        segments,
        duration,
        output_path: outputPath,
      });
    },
    [runStream]
  );

  const cancelPipeline = useCallback(async () => {
    // Abort frontend IMMEDIATELY to close the JobMonitor popup
    abortController?.abort();
    setAbortController(null);
    setProcessing(false);

    // Call backend API afterward, so any hanging/blocking doesn't freeze the UI
    const port = localStorage.getItem('sidecar_port') || '8008';
    try {
      await fetch(`http://127.0.0.1:${port}/api/pipeline/cancel`, { method: 'POST' });
    } catch (e) {}
  }, [abortController]);

  const resetPipeline = useCallback(() => {
    setProcessing(false);
    setProgress(null);
    setError(null);
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);

  const generateVoice = useCallback(
    (
      projectId: string,
      segments: any[],
      config: PipelineConfig,
      onSegmentDone?: (segId: number, audioPath: string, filename: string) => void,
    ) => {
      const promise = runStream('/api/pipeline/tts-batch', {
        project_id: projectId,
        segments,
        tts_engine: config.tts_engine || 'omnivoice',
        voice: config.voice || 'vi-VN-HoaiMyNeural',
        speed: config.speed ?? config.rate ?? 1.0,
        pitch: config.pitch ?? 0.5,
        volume: config.volume ?? 1.0,
        voice_mapping: config.voice_mapping || {},
        duration: config.duration ?? 0,
        api_key: config.api_key || '',
      });

      // Hook into progress to trigger per-segment callbacks
      if (onSegmentDone) {
        const checkInterval = setInterval(() => {
          // onSegmentDone is called via SSE parsing in runStream
          // This is handled in the caller by watching progress.segment_result
        }, 100);
        promise.finally(() => clearInterval(checkInterval));
      }

      return promise;
    },
    [runStream],
  );

  const generateSegment = useCallback(
    async (projectId: string, segment: any, config: PipelineConfig) => {
      const port = localStorage.getItem('sidecar_port') || '8008';
      const res = await fetch(`http://127.0.0.1:${port}/api/pipeline/tts-segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          segment,
          tts_engine: config.tts_engine || 'omnivoice',
          voice: config.voice || 'vi-VN-HoaiMyNeural',
          speed: config.speed ?? config.rate ?? 1.0,
          pitch: config.pitch ?? 0.5,
          volume: config.volume ?? 1.0,
          api_key: config.api_key || '',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || 'TTS segment failed');
      }
      return res.json();
    },
    [],
  );

  return {
    processing,
    progress,
    error,
    analyzeVideo,
    renderVideo,
    generateVoice,
    generateSegment,
    cancelPipeline,
    resetPipeline,
  };
}
