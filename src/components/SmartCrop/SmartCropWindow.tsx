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
import type { Keyframe } from './CropOverlay';
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
  const { session, saveSession, clearSession, getFromHistory, addToHistory, history, removeFromHistory, clearHistory, setMode, setManualStage } = useSmartCropStore();

  // ─── Derived: sorted history entries ───────────
  const historyEntries = Object.entries(history)
    .map(([inputPath, entry]) => ({ inputPath, ...entry }))
    .sort((a, b) => b.timestamp - a.timestamp);

  // ─── Local State (UI only) ─────────────────────
  const [inputVideoUrl, setInputVideoUrl] = useState<string | null>(null);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [gpuStatus, setGpuStatus] = useState<GpuStatusInfo | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'idle', progress: 0, message: '', mode: 'GPU',
  });

  const inputRef = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLVideoElement>(null);

  // ─── Manual crop state ─────────────────────────
  const [trackingData, setTrackingData] = useState<any>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);

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

  // ─── Manual: Analyze ───────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!session.inputPath) return;
    setManualStage('analyzing');
    setProcessing({ stage: 'init', progress: 0, message: 'Đang phân tích video...', mode: 'GPU' });

    try {
      const baseUrl = sidecar.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/process/smart-crop/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_path: session.inputPath,
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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProcessing({
                stage: data.stage || 'processing',
                progress: data.progress ?? 0,
                message: data.message || '',
                mode: data.mode || 'GPU',
              });

              if (data.stage === 'done' && data.tracking_json_path) {
                saveSession({
                  trackingJsonPath: data.tracking_json_path,
                  lastStage: 'done',
                  lastMessage: 'Analyze hoàn thành',
                  lastMode: data.mode || 'GPU',
                });
                setManualStage('review');
                setProcessing({ stage: 'idle', progress: 0, message: '', mode: data.mode || 'GPU' });
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err: any) {
      setProcessing({ stage: 'error', progress: -1, message: err.message || 'Analyze lỗi', mode: 'CPU' });
      setManualStage('idle');
    }
  }, [session, saveSession, setManualStage]);

  // ─── Manual: Render ────────────────────────────
  const handleRender = useCallback(async () => {
    if (!session.inputPath || !session.outputPath || !session.trackingJsonPath) return;
    setManualStage('rendering');
    setProcessing({ stage: 'init', progress: 0, message: 'Đang render video...', mode: 'GPU' });

    try {
      const baseUrl = sidecar.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/process/smart-crop/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_path: session.inputPath,
          output_path: session.outputPath,
          tracking_json_path: session.trackingJsonPath,
          keyframes: keyframes,
          out_width: session.outWidth,
          out_height: session.outHeight,
          encode_crf: 18,
          encode_preset: 'fast',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProcessing({
                stage: data.stage || 'processing',
                progress: data.progress ?? 0,
                message: data.message || '',
                mode: data.mode || 'GPU',
              });

              if (data.stage === 'done' && data.output) {
                const { convertFileSrc } = await import('@tauri-apps/api/core');
                setOutputVideoUrl(convertFileSrc(data.output));
                saveSession({
                  lastStage: 'done',
                  lastMessage: 'Render hoàn thành',
                  lastMode: data.mode || 'GPU',
                });
                setManualStage('done');
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      setProcessing({ stage: 'error', progress: -1, message: err.message || 'Render lỗi', mode: 'CPU' });
      setManualStage('review');
    }
  }, [session, keyframes, saveSession, setManualStage]);

  // ─── Load tracking data on review stage ────────
  useEffect(() => {
    if (session.manualStage === 'review' && session.trackingJsonPath) {
      (async () => {
        try {
          const { readTextFile } = await import('@tauri-apps/plugin-fs');
          const text = await readTextFile(session.trackingJsonPath!);
          setTrackingData(JSON.parse(text));
        } catch (err) {
          console.error('Failed to load tracking data:', err);
        }
      })();
    }
  }, [session.manualStage, session.trackingJsonPath]);

  // ─── Keyframe handlers ─────────────────────────
  const handleKeyframeAdd = useCallback((kf: Keyframe) => {
    setKeyframes(prev => {
      const filtered = prev.filter(k => k.frame_idx !== kf.frame_idx);
      return [...filtered, kf].sort((a, b) => a.frame_idx - b.frame_idx);
    });
  }, []);

  const handleKeyframeDelete = useCallback((frameIdx: number) => {
    setKeyframes(prev => prev.filter(k => k.frame_idx !== frameIdx));
  }, []);

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

  // ─── Load from history (click history row) ─────
  const handleLoadFromHistory = useCallback(async (inputPath: string) => {
    const entry = getFromHistory(inputPath);
    if (!entry) return;
    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      setInputVideoUrl(convertFileSrc(inputPath));
      setOutputVideoUrl(convertFileSrc(entry.outputPath));
      setProcessing({
        stage: 'done',
        progress: 100,
        message: '✨ Đã crop trước đó — hiện kết quả từ cache',
        mode: entry.mode,
      });
      saveSession({
        inputPath,
        outputPath: entry.outputPath,
        alpha: entry.alpha,
        deadZone: entry.deadZone,
        detectEvery: entry.detectEvery,
        fallbackCenter: entry.fallbackCenter,
        lastStage: 'done',
        lastMessage: '✨ Đã crop trước đó',
        lastMode: entry.mode,
      });
    } catch {
      // Not in Tauri
    }
  }, [getFromHistory, saveSession]);

  // ─── Delete history entry ──────────────────────
  const [deleteHistoryPath, setDeleteHistoryPath] = useState<string | null>(null);
  const handleConfirmDeleteHistory = useCallback(() => {
    if (deleteHistoryPath) {
      removeFromHistory(deleteHistoryPath);
      setDeleteHistoryPath(null);
    }
  }, [deleteHistoryPath, removeFromHistory]);

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
        {/* Mode Toggle */}
        {session.inputPath && (
          <div className="sc-mode-toggle">
            <button
              className={`sc-mode-btn ${session.mode === 'auto' ? 'active' : ''}`}
              onClick={() => setMode('auto')}
              disabled={isProcessing}
            >
              Auto
            </button>
            <button
              className={`sc-mode-btn ${session.mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
              disabled={isProcessing}
            >
              Manual
            </button>
          </div>
        )}
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

        {/* ─── Crop History (idle screen only) ─── */}
        {!session.inputPath && historyEntries.length > 0 && (
          <div className="sc-history sc-animate-in">
            <div className="sc-history-header">
              <h3>📋 Lịch sử Crop</h3>
              <button className="sc-btn" style={{ padding: '3px 10px', fontSize: 10 }} onClick={clearHistory}>
                Xóa tất cả
              </button>
            </div>
            <div className="sc-history-table">
              <div className="sc-history-head">
                <div>Video gốc</div>
                <div>Thời gian</div>
                <div>Mode</div>
                <div>Thao tác</div>
              </div>
              {historyEntries.map((entry) => {
                const fileName = entry.inputPath.split(/[\\/]/).pop() || entry.inputPath;
                const timeStr = new Date(entry.timestamp).toLocaleString('vi-VN', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div
                    key={entry.inputPath}
                    className="sc-history-row"
                    onClick={() => handleLoadFromHistory(entry.inputPath)}
                    title={`Click để mở lại: ${entry.inputPath}`}
                  >
                    <div className="sc-history-cell name">🎬 {fileName}</div>
                    <div className="sc-history-cell">{timeStr}</div>
                    <div className="sc-history-cell">
                      <span className={`sc-gpu-badge ${entry.mode === 'GPU' ? 'gpu' : 'cpu'}`}>
                        {entry.mode}
                      </span>
                    </div>
                    <div className="sc-history-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="sc-btn"
                        style={{ padding: '3px 8px', fontSize: 10 }}
                        onClick={() => setDeleteHistoryPath(entry.inputPath)}
                        title="Xóa khỏi lịch sử"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
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
            trackingData={trackingData}
            keyframes={keyframes}
            onKeyframeAdd={handleKeyframeAdd}
            onKeyframeDelete={handleKeyframeDelete}
            showOverlay={session.mode === 'manual' && session.manualStage === 'review'}
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
            mode={session.mode}
            manualStage={session.manualStage}
            onAnalyze={handleAnalyze}
            onRender={handleRender}
            onReanalyze={() => setManualStage('idle')}
            outWidth={session.outWidth}
            outHeight={session.outHeight}
            onResolutionChange={(w, h) => saveSession({ outWidth: w, outHeight: h })}
          />
        )}
      </div>

      {/* ─── Delete History Confirmation Modal ─── */}
      {deleteHistoryPath && (
        <div className="sc-modal-overlay">
          <div className="sc-modal-content">
            <h3>Xóa khỏi lịch sử?</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              File: <strong>{deleteHistoryPath.split(/[\\/]/).pop()}</strong><br />
              Chỉ xóa khỏi lịch sử, không xóa file thực.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="sc-btn" onClick={() => setDeleteHistoryPath(null)}>Hủy</button>
              <button className="sc-btn" style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} onClick={handleConfirmDeleteHistory}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
