/**
 * useProjectPersist — Auto save/load project segments + config qua backend API.
 * Hook này quản lý persistence dữ liệu project giữa các phiên làm việc.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSubtitleStore } from '../stores/useSubtitleStore';
import { useProjectStore } from '../stores/useProjectStore';

const DEBOUNCE_MS = 3000; // Auto-save debounce

function getSidecarUrl(): string {
  const port = localStorage.getItem('sidecar_port') || '8008';
  return `http://127.0.0.1:${port}`;
}

async function saveProjectData(projectId: string, data: { segments: any[]; config: Record<string, any>; video_path?: string }) {
  try {
    const res = await fetch(`${getSidecarUrl()}/api/projects/${projectId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.warn('[ProjectPersist] Save failed:', res.status);
  } catch (err) {
    console.warn('[ProjectPersist] Save error:', err);
  }
}

async function loadProjectData(projectId: string): Promise<{
  segments: any[];
  config: Record<string, any>;
  tts_paths: Record<string, string>;
  has_dubbed: boolean;
  video_path: string;
} | null> {
  try {
    const res = await fetch(`${getSidecarUrl()}/api/projects/${projectId}/load`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useProjectPersist(projectId: string | null) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef<string | null>(null);

  // ── Load on mount / project change ──
  useEffect(() => {
    if (!projectId || loadedRef.current === projectId) return;

    loadProjectData(projectId).then((data) => {
      if (!data) return;

      // Restore segments if available
      if (data.segments && data.segments.length > 0) {
        const subtitleStore = useSubtitleStore.getState();
        const existingSegs = subtitleStore.segments;

        // Only restore if current store is empty (don't overwrite fresh analyze)
        if (existingSegs.length === 0) {
          subtitleStore.setSegments(data.segments);
        }

        // Map TTS paths to existing segments
        if (data.tts_paths && Object.keys(data.tts_paths).length > 0) {
          const currentSegs = useSubtitleStore.getState().segments;
          const updatedSegs = currentSegs.map((s) => {
            const ttsFile = data.tts_paths[String(s.id)];
            if (ttsFile) {
              return {
                ...s,
                tts_audio_path: ttsFile,
                tts_status: 'generated' as const,
              };
            }
            return s;
          });
          useSubtitleStore.getState().setSegments(updatedSegs);
        }
      }

      // Restore dubbed_audio_path to project config
      if (data.has_dubbed || data.config?.dubbed_audio_path) {
        useProjectStore.getState().updateConfig({
          dubbed_audio_path: data.config?.dubbed_audio_path || '',
          tts_generated_at: data.config?.tts_generated_at || 0,
        });
      }

      loadedRef.current = projectId;
      console.log('[ProjectPersist] Loaded project data for', projectId);
    });
  }, [projectId]);

  // ── Debounced auto-save ──
  const triggerSave = useCallback(() => {
    if (!projectId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const segments = useSubtitleStore.getState().segments;
      const config = useProjectStore.getState();

      // Don't save empty state
      if (segments.length === 0) return;

      saveProjectData(projectId, {
        segments,
        config: {
          dubbed_audio_path: config.dubbed_audio_path,
          tts_generated_at: config.tts_generated_at,
          dubbing_enabled: config.dubbing_enabled,
          tts_engine: config.tts_engine,
          voice: config.voice,
          speed: config.speed,
          pitch: config.pitch,
          volume: config.volume,
        },
      });
    }, DEBOUNCE_MS);
  }, [projectId]);

  // ── Subscribe to subtitle store changes ──
  useEffect(() => {
    if (!projectId) return;

    let prevLen = useSubtitleStore.getState().segments.length;
    const unsubSub = useSubtitleStore.subscribe((state) => {
      const newLen = state.segments.length;
      if (newLen !== prevLen || newLen > 0) {
        prevLen = newLen;
        triggerSave();
      }
    });

    return () => {
      unsubSub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, triggerSave]);

  // ── Manual save function ──
  const saveNow = useCallback(() => {
    if (!projectId) return;
    const segments = useSubtitleStore.getState().segments;
    const config = useProjectStore.getState();

    saveProjectData(projectId, {
      segments,
      config: {
        dubbed_audio_path: config.dubbed_audio_path,
        tts_generated_at: config.tts_generated_at,
        dubbing_enabled: config.dubbing_enabled,
        tts_engine: config.tts_engine,
        voice: config.voice,
        speed: config.speed,
        pitch: config.pitch,
        volume: config.volume,
      },
    });
  }, [projectId]);

  return { saveNow, triggerSave };
}
