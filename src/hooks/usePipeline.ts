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
}

export interface PipelineProgress {
  stage: string;
  progress: number;
  message: string;
  output_path?: string;
}

export function usePipeline() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const startPipeline = useCallback(
    async (file: File, config: PipelineConfig = {}) => {
      setProcessing(true);
      setError(null);
      setProgress({ stage: 'upload', progress: 0, message: 'Uploading...' });

      const controller = new AbortController();
      setAbortController(controller);

      try {
        // Build FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('config_json', JSON.stringify(config));

        // Detect sidecar port
        const port = localStorage.getItem('sidecar_port') || '8008';
        const baseUrl = `http://127.0.0.1:${port}`;

        // POST to SSE endpoint
        const response = await fetch(`${baseUrl}/api/pipeline/process`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Pipeline failed: ${response.status}`);
        }

        // Parse SSE stream
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
                  return;
                }

                if (event.stage === 'done') {
                  setProcessing(false);
                  return;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        setProcessing(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setProgress({ stage: 'cancelled', progress: 0, message: 'Cancelled by user' });
        } else {
          setError((err as Error).message);
        }
        setProcessing(false);
      }
    },
    [],
  );

  const cancelPipeline = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setProcessing(false);
  }, [abortController]);

  return {
    processing,
    progress,
    error,
    startPipeline,
    cancelPipeline,
  };
}
