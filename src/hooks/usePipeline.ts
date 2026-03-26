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
}

export interface PipelineProgress {
  stage: string;
  progress: number;
  message: string;
  output_path?: string;
  segments?: any[];
  duration?: number;
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

  const cancelPipeline = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setProcessing(false);
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

  return {
    processing,
    progress,
    error,
    analyzeVideo,
    renderVideo,
    cancelPipeline,
    resetPipeline,
  };
}
