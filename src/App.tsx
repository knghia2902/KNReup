/**
 * KNReup — Main Application
 * Phase 3: Added VideoPreview, Zustand stores, Properties panel
 */
import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { useSidecar } from './hooks/useSidecar';
import { usePipeline } from './hooks/usePipeline';
import { convertFileSrc } from '@tauri-apps/api/core';
import { NLELayout, type AppModule, type SidebarFocus } from './components/layout/NLELayout';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { TimelinePlaceholder } from './components/layout/TimelinePlaceholder';
import { DependencyChecker } from './components/setup/DependencyChecker';
import { UploadPanel } from './components/editor/UploadPanel';
import { JobMonitor } from './components/editor/JobMonitor';
import { VideoPreview } from './components/editor/VideoPreview';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { useProjectStore } from './stores/useProjectStore';
import { useSubtitleStore } from './stores/useSubtitleStore';
import './styles/design-system.css';

function App() {
  const { connected, health, systemCheck, error, loading, retrySystemCheck } = useSidecar();
  const { processing, progress, error: pipelineError, startPipeline, cancelPipeline, resetPipeline } = usePipeline();
  const [showSetup, setShowSetup] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('editor');
  const [sidebarFocus, setSidebarFocus] = useState<SidebarFocus>('preview');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [filePaths, setFilePaths] = useState<string[]>([]);

  // Zustand stores
  const projectConfig = useProjectStore();
  const { segments } = useSubtitleStore();

  const handleSetupComplete = useCallback(() => setShowSetup(false), []);

  const handleFileSelected = useCallback(
    (selectedPath: string) => {
      setFilePaths(prev => prev.includes(selectedPath) ? prev : [...prev, selectedPath]);
      setVideoSrc(convertFileSrc(selectedPath));
    },
    [],
  );

  const handleRender = useCallback(() => {
    if (filePaths.length === 0) return;
    const activeFile = filePaths[filePaths.length - 1];
    startPipeline(activeFile, {
      translation_engine: 'argos',
      target_lang: projectConfig.language === 'auto' ? 'vi' : projectConfig.language,
      tts_engine: projectConfig.tts_engine,
      voice: projectConfig.voice,
    });
  }, [filePaths, startPipeline, projectConfig.language, projectConfig.tts_engine, projectConfig.voice]);

  // Drag & drop video handler
  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    /* Bỏ dùng HTML5 DataTransfer cho file cứng trên desktop 
       Mọi thứ xử lý trực tiếp bởi Tauri drop trong UploadPanel/App global */
  }, []);

  const subtitleConfig = {
    enabled: projectConfig.subtitle_enabled,
    position: projectConfig.subtitle_position,
    font_size: projectConfig.subtitle_font_size,
    font: projectConfig.subtitle_font,
    color: projectConfig.subtitle_color,
    outline_color: projectConfig.subtitle_outline_color,
  };

  return (
    <>
      {showSetup && (
        <DependencyChecker
          systemCheck={systemCheck}
          loading={loading}
          error={error}
          onComplete={handleSetupComplete}
          onRetry={retrySystemCheck}
        />
      )}

      {(processing || error || (progress && progress.stage === 'done')) && progress && (
        <JobMonitor progress={progress} onCancel={cancelPipeline} onDismiss={resetPipeline} />
      )}

      <Titlebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="app">
        <Sidebar activeFocus={sidebarFocus} onFocusChange={setSidebarFocus} />
        <NLELayout
          activeModule={activeModule}
          mediaBin={
            <UploadPanel onFileSelected={handleFileSelected} disabled={processing} filePaths={filePaths} />
          }
          videoPreview={
            <VideoPreview
              videoSrc={videoSrc}
              segments={segments}
              subtitleConfig={subtitleConfig}
              videoRatio={projectConfig.video_ratio as 'original' | '16:9' | '9:16'}
            />
          }
          properties={<PropertiesPanel sidebarFocus={sidebarFocus} onRender={handleRender} />}
          timeline={<TimelinePlaceholder filePaths={filePaths} />}
          onVideoDrop={handleVideoDrop}
          statusContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {connected ? (
                <CheckCircle size={12} weight="fill" style={{ color: 'var(--success)' }} />
              ) : error ? (
                <XCircle size={12} weight="fill" style={{ color: 'var(--danger)' }} />
              ) : (
                <CircleNotch size={12} className="dep-spin" style={{ color: 'var(--accent)' }} />
              )}
              <span className="status-mono">
                {connected
                  ? `Backend connected / ${systemCheck?.gpu.gpu_available ? 'GPU' : 'CPU'}`
                  : error || 'Connecting...'}
              </span>
              {pipelineError && (
                <span className="status-mono" style={{ color: 'var(--danger)' }}>
                  Pipeline: {pipelineError}
                </span>
              )}
              {health && (
                <span className="status-mono" style={{ marginLeft: 'auto' }}>
                  v{health.version}
                </span>
              )}
            </div>
          }
        />
      </div>
    </>
  );
}

export default App;
