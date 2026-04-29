/**
 * SmartCropWindow — Standalone AI face-tracking auto-crop tool.
 * Phase 26: Converts 16:9 → 9:16 using YOLOv8 face detection + EMA smoothing.
 * Session persisted via Zustand store — survives window close/reopen.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { sidecar } from '../../lib/sidecar';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { useSmartCropStore } from '../../stores/useSmartCropStore';
import { SmartCropLayout } from './SmartCropLayout';
import { SmartCropControls } from './SmartCropControls';
import { Sun, Moon } from '@phosphor-icons/react';
import '../../styles/design-system.css';
import '../../styles/smart-crop.css';

interface GpuStatusInfo {
  available: boolean;
  mode: string;
  device: string;
  vram_gb?: number;
}

interface ProcessingState {
  stage: 'idle' | 'init' | 'processing' | 'done' | 'error';
  progress: number;
  message: string;
  mode: string; // "GPU" or "CPU"
}

export function SmartCropWindow() {
  useSidecar();
  const { isDark, toggle } = useTheme();

  // ─── Persisted State (Zustand) ─────────────────
  const { session, saveSession, clearSession, getFromHistory, addToHistory } = useSmartCropStore();

  // ─── Local State (UI only) ─────────────────────
  const [inputVideoUrl, setInputVideoUrl] = useState<string | null>(null);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [gpuStatus, setGpuStatus] = useState<GpuStatusInfo | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'idle', progress: 0, message: '', mode: 'GPU',
  });

  const inputRef = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLVideoElement>(null);

  // ─── Restore session on mount ──────────────────
  useEffect(() => {
    (async () => {
      // Restore video URLs from persisted paths
      if (session.inputPath) {
        try {
          const { convertFileSrc } = await import('@tauri-apps/api/core');
          setInputVideoUrl(convertFileSrc(session.inputPath));

          // If output exists and was previously done, restore it
          if (session.outputPath && session.lastStage === 'done') {
            setOutputVideoUrl(convertFileSrc(session.outputPath));
            setProcessing({
              stage: 'done',
              progress: 100,
              message: session.lastMessage || 'Đã hoàn thành trước đó',
              mode: session.lastMode || 'GPU',
            });
          }
        } catch {
          // Not in Tauri — ignore
        }
      }
    })();
  }, []); // Run once on mount

  // ─── GPU Status Check ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const status = await sidecar.fetch<GpuStatusInfo>('/api/process/smart-crop/gpu-status');
        setGpuStatus(status);
      } catch {
        setGpuStatus({ available: false, mode: 'CPU', device: 'Không xác định' });
      }
    })();
  }, []);

  // ─── File picker ───────────────────────────────
  const handleSelectFile = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        title: 'Chọn video 16:9',
        filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm'] }],
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        setInputVideoUrl(convertFileSrc(selected));

        // Prepare output path
        const ext = selected.lastIndexOf('.');
        const outPath = selected.substring(0, ext) + '_916' + selected.substring(ext);

        // Check crop history — instant recall if already cropped
        const cached = getFromHistory(selected);
        if (cached) {
          setOutputVideoUrl(convertFileSrc(cached.outputPath));
          setProcessing({
            stage: 'done',
            progress: 100,
            message: '✨ Đã crop trước đó — hiện kết quả từ cache',
            mode: cached.mode,
          });
          saveSession({
            inputPath: selected,
            outputPath: cached.outputPath,
            alpha: cached.alpha,
            deadZone: cached.deadZone,
            detectEvery: cached.detectEvery,
            fallbackCenter: cached.fallbackCenter,
            lastStage: 'done',
            lastMessage: '✨ Đã crop trước đó',
            lastMode: cached.mode,
          });
        } else {
          setOutputVideoUrl(null);
          setProcessing({ stage: 'idle', progress: 0, message: '', mode: 'GPU' });
          saveSession({
            inputPath: selected,
            outputPath: outPath,
            lastStage: 'idle',
            lastMessage: '',
          });
        }
      }
    } catch (err) {
      console.error('File picker error:', err);
    }
  }, [saveSession, getFromHistory]);

  // ─── Export / Process ──────────────────────────
  const handleExport = useCallback(async () => {
    if (!session.inputPath || !session.outputPath) return;

    setProcessing({ stage: 'init', progress: 0, message: 'Đang khởi tạo...', mode: 'GPU' });

    try {
      const baseUrl = sidecar.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/process/smart-crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_path: session.inputPath,
          output_path: session.outputPath,
          alpha: session.alpha,
          dead_zone: session.deadZone,
          detect_every: session.detectEvery,
          fallback_center: session.fallbackCenter,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const newState: ProcessingState = {
                stage: data.stage || 'processing',
                progress: data.progress ?? 0,
                message: data.message || '',
                mode: data.mode || 'GPU',
              };
              setProcessing(newState);

              if (data.stage === 'done' && data.output) {
                // Show output video
                const { convertFileSrc } = await import('@tauri-apps/api/core');
                setOutputVideoUrl(convertFileSrc(data.output));
                // Persist completion
                saveSession({
                  lastStage: 'done',
                  lastMessage: data.message || 'Hoàn thành',
                  lastMode: data.mode || 'GPU',
                });
                // Save to crop history for instant recall
                if (session.inputPath) {
                  addToHistory(session.inputPath, {
                    outputPath: data.output,
                    alpha: session.alpha,
                    deadZone: session.deadZone,
                    detectEvery: session.detectEvery,
                    fallbackCenter: session.fallbackCenter,
                    mode: data.mode || 'GPU',
                    timestamp: Date.now(),
                  });
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err: any) {
      setProcessing({
        stage: 'error',
        progress: -1,
        message: err.message || 'Lỗi không xác định',
        mode: 'CPU',
      });
      saveSession({
        lastStage: 'error',
        lastMessage: err.message || 'Lỗi không xác định',
      });
    }
  }, [session, saveSession]);

  // ─── Open in Editor ────────────────────────────
  const handleOpenEditor = useCallback(async () => {
    if (!session.outputPath) return;
    try {
      const { openEditor } = await import('../../utils/windowManager');
      const { useLauncherStore } = await import('../../stores/useLauncherStore');

      const id = `proj-${Date.now()}`;
      const name = session.outputPath.split(/[\\/]/).pop()?.replace(/\.\w+$/, '') || 'Smart Crop';

      useLauncherStore.getState().addProject({
        id,
        name,
        path: session.outputPath,
        createdAt: Date.now(),
        lastModified: Date.now(),
      });

      await openEditor(id);

      // Close Smart Crop window after opening Editor
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch {
        // ignore if not in Tauri
      }
    } catch (err) {
      console.error('Open editor failed:', err);
    }
  }, [session.outputPath]);

  // ─── New File (clear session) ──────────────────
  const handleNewFile = useCallback(() => {
    clearSession();
    setInputVideoUrl(null);
    setOutputVideoUrl(null);
    setProcessing({ stage: 'idle', progress: 0, message: '', mode: 'GPU' });
  }, [clearSession]);

  // ─── Render ────────────────────────────────────
  const isProcessing = processing.stage === 'init' || processing.stage === 'processing';
  const hasOutput = processing.stage === 'done' && !!outputVideoUrl;

  return (
    <div className="sc-layout-wrapper">
      {/* Header */}
      <div className="sc-header" data-tauri-drag-region>
        <span className="sc-header-title">kn<em>reup</em> Smart Crop</span>
        {gpuStatus && (
          <span className={`sc-gpu-badge ${gpuStatus.available ? 'gpu' : 'cpu'}`}>
            {gpuStatus.available ? `GPU · ${gpuStatus.device}` : 'CPU Mode'}
          </span>
        )}
        <div style={{ flex: 1 }} data-tauri-drag-region />
        {/* New File button — only show when a session exists */}
        {session.inputPath && (
          <button
            className="sc-btn"
            onClick={handleNewFile}
            style={{ marginRight: 6, padding: '4px 10px', fontSize: 11 }}
            title="Chọn file mới"
          >
            🔄 Mới
          </button>
        )}
        <button className="theme-toggle" onClick={toggle} title={isDark ? 'Light' : 'Dark'}>
          {isDark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
        </button>
      </div>

      <div className="sc-body">
        {/* Hero */}
        {!session.inputPath && (
          <div className="sc-hero sc-animate-in">
            <h1>Smart Crop 9:16</h1>
            <p>AI theo dõi khuôn mặt — tự động crop video 16:9 sang 9:16</p>
          </div>
        )}

        {/* Dropzone (chỉ hiện khi chưa chọn file) */}
        {!session.inputPath && (
          <div className="sc-dropzone sc-animate-in" onClick={handleSelectFile}>
            <div className="sc-dropzone-icon">🎬</div>
            <div className="sc-dropzone-text">
              Kéo thả video vào đây hoặc <strong>nhấn để chọn file</strong>
            </div>
          </div>
        )}

        {/* Preview */}
        {session.inputPath && (
          <SmartCropLayout
            inputVideoUrl={inputVideoUrl}
            outputVideoUrl={outputVideoUrl}
            inputRef={inputRef}
            outputRef={outputRef}
          />
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="sc-progress sc-animate-in">
            <div className="sc-progress-track">
              <div
                className="sc-progress-fill"
                style={{ width: `${Math.max(0, processing.progress)}%` }}
              />
            </div>
            <span className="sc-progress-label">
              {processing.message || `${processing.progress}%`}
            </span>
          </div>
        )}

        {/* Error */}
        {processing.stage === 'error' && (
          <div className="sc-error sc-animate-in">
            ⚠ {processing.message}
          </div>
        )}

        {/* Controls */}
        {session.inputPath && (
          <SmartCropControls
            alpha={session.alpha}
            deadZone={session.deadZone}
            detectEvery={session.detectEvery}
            fallbackCenter={session.fallbackCenter}
            onAlphaChange={(v) => saveSession({ alpha: v })}
            onDeadZoneChange={(v) => saveSession({ deadZone: v })}
            onDetectEveryChange={(v) => saveSession({ detectEvery: v })}
            onFallbackCenterChange={(v) => saveSession({ fallbackCenter: v })}
            onExport={handleExport}
            onOpenEditor={handleOpenEditor}
            isProcessing={isProcessing}
            hasOutput={hasOutput}
          />
        )}
      </div>
    </div>
  );
}
