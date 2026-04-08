/**
 * KNReup — Main Application
 * Phase 3: Added VideoPreview, Zustand stores, Properties panel
 */
import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { useSidecar } from './hooks/useSidecar';
import { useQueueStore } from './stores/queueStore';
import { usePipeline } from './hooks/usePipeline';
import { convertFileSrc } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { NLELayout, type AppModule, type SidebarFocus } from './components/layout/NLELayout';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './components/editor/Timeline';
import { DependencyChecker } from './components/setup/DependencyChecker';
import { UploadPanel } from './components/editor/UploadPanel';
import { JobMonitor } from './components/editor/JobMonitor';
import { VideoPreview } from './components/editor/VideoPreview';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { SettingsTab } from './components/properties/SettingsTab';
import { useProjectStore } from './stores/useProjectStore';
import { useSubtitleStore } from './stores/useSubtitleStore';
import './styles/design-system.css';

function App() {
  const { connected, health, systemCheck, error, loading, retrySystemCheck } = useSidecar();
  const { processing, progress, error: pipelineError, analyzeVideo, renderVideo, cancelPipeline, resetPipeline } = usePipeline();
  const [showSetup, setShowSetup] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('editor');
  const [sidebarFocus, setSidebarFocus] = useState<SidebarFocus>('preview');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Zustand stores
  const projectConfig = useProjectStore();
  const { segments } = useSubtitleStore();

  const handleSetupComplete = useCallback(() => setShowSetup(false), []);

  const handleFileSelected = useCallback(
    async (selectedPath: string) => {
      setFilePaths(prev => prev.includes(selectedPath) ? prev : [...prev, selectedPath]);
      setActiveFile(selectedPath);
      useSubtitleStore.getState().setActiveFile(selectedPath);
      useProjectStore.getState().setActiveFile(selectedPath);
      setVideoSrc(convertFileSrc(selectedPath));
    },
    [],
  );

  const handleFileSwitch = useCallback((path: string) => {
    setActiveFile(path);
    useSubtitleStore.getState().setActiveFile(path);
    useProjectStore.getState().setActiveFile(path);
    setVideoSrc(convertFileSrc(path));
  }, []);

  const handleFileRemove = useCallback((path: string) => {
    setFilePaths(prev => {
      const newPaths = prev.filter(p => p !== path);
      if (activeFile === path) {
        const nextActive = newPaths.length > 0 ? newPaths[0] : null;
        setActiveFile(nextActive);
        useSubtitleStore.getState().setActiveFile(nextActive);
        useProjectStore.getState().setActiveFile(nextActive);
        setVideoSrc(nextActive ? convertFileSrc(nextActive) : null);
      }
      return newPaths;
    });
  }, [activeFile]);

  const handleAnalyze = useCallback(async () => {
    if (!activeFile) return;
    try {
      const result = await analyzeVideo(activeFile, {
        ...projectConfig,
        translation_engine: projectConfig.translation_engine,
        source_lang: projectConfig.language,
        target_lang: 'vi',
        api_key: projectConfig.translation_engine === 'gemini' ? projectConfig.gemini_api_key :
                 projectConfig.translation_engine === 'deepl' ? projectConfig.deepl_api_key :
                 projectConfig.translation_engine === 'deepseek' ? projectConfig.deepseek_api_key :
                 projectConfig.translation_engine === 'ollama' ? projectConfig.ollama_url : '',
      });
      if (result.segments) {
        const mappedSegments = result.segments.map((s: any, idx: number) => ({
          id: s.id ?? idx + 1,
          start: s.start,
          end: s.end,
          source_text: s.text || s.source_text || '',
          translated_text: s.translated || s.translated_text || '',
          confidence: s.confidence || 1.0,
          tts_status: 'pending' as const
        }));
        useSubtitleStore.getState().setSegments(mappedSegments, activeFile);
      }
    } catch (err) {
      console.error("Analyze failed:", err);
    }
  }, [activeFile, analyzeVideo, projectConfig]);

  const handleRender = useCallback(async () => {
    if (!activeFile) return;

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const defaultName = activeFile 
        ? `${activeFile.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '')}_translated.${projectConfig.container}`
        : `output.${projectConfig.container}`;

      const savePath = await save({
        title: "Xác nhận nơi lưu Video",
        defaultPath: defaultName,
        filters: [{
          name: 'Video',
          extensions: [projectConfig.container]
        }]
      });

      if (savePath) {
        useQueueStore.getState().addJob({
          videoPath: activeFile,
          outputPath: savePath,
          segments: useSubtitleStore.getState().segments,
          config: {
            ...projectConfig,
            subtitle_config: {
              font: projectConfig.subtitle_font,
              font_size: projectConfig.subtitle_font_size,
              color: projectConfig.subtitle_color,
              outline_color: projectConfig.subtitle_outline_color,
              position: projectConfig.subtitle_position,
            }
          },
        });
        setSidebarFocus('monitor-mini'); // Assuming 'monitor-mini' is the correct focus for queue
      }
    } catch (err) {
      console.error("Save dialog failed:", err);
    }
  }, [activeFile, projectConfig]);

  // Queue processor loop
  const jobs = useQueueStore(state => state.jobs);

  useEffect(() => {
    // Start next job if pipeline is idle
    const isIdle = !processing && (!progress || progress.stage === 'done' || progress.stage === 'error' || progress.stage === 'cancelled');
    if (isIdle) {
      const currentJobs = useQueueStore.getState().jobs;
      const nextJob = currentJobs.find(j => j.status === 'pending');
      const hasProcessing = currentJobs.some(j => j.status === 'processing');

      if (nextJob && !hasProcessing) {
        if (progress) resetPipeline();
        
        useQueueStore.getState().updateJobStatus(nextJob.id, 'processing');
        renderVideo(
          nextJob.videoPath,
          nextJob.config,
          nextJob.segments,
          0,
          nextJob.outputPath
        ).then(() => {
          useQueueStore.getState().updateJobStatus(nextJob.id, 'completed');
        }).catch(() => {
          useQueueStore.getState().updateJobStatus(nextJob.id, 'failed');
        });
      }
    }
  }, [jobs, processing, progress, renderVideo, resetPipeline]);

  // Sync pipeline progress to active job
  useEffect(() => {
    if (processing && progress) {
      const currentJobs = useQueueStore.getState().jobs;
      const activeJob = currentJobs.find(j => j.status === 'processing');
      if (activeJob) {
        useQueueStore.getState().updateJobProgress(activeJob.id, progress.progress, progress.message);
      }
    }
  }, [progress, processing]);

  // Drag & drop video handler
  useEffect(() => {
    let unlistenFile: (() => void) | undefined;
    let unlistenDrag: (() => void) | undefined;

    listen('tauri://file-drop', (event) => {
      const paths = event.payload as string[];
      if (paths && paths.length > 0) {
        handleFileSelected(paths[0]);
      }
    }).then(f => unlistenFile = f);

    listen('tauri://drag-drop', (event) => {
      const payload = event.payload as any;
      if (payload && payload.paths && payload.paths.length > 0) {
        handleFileSelected(payload.paths[0]);
      }
    }).then(f => unlistenDrag = f);

    return () => {
      if (unlistenFile) unlistenFile();
      if (unlistenDrag) unlistenDrag();
    };
  }, [handleFileSelected]);

  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Keyboard Shortcuts (Ctrl+S Save Project)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const { save } = await import('@tauri-apps/plugin-dialog');
        const savePath = await save({
          title: "Lưu Project",
          defaultPath: "project.kn",
          filters: [{ name: 'KN Project', extensions: ['kn'] }]
        });
        if (savePath) {
          const projectData = {
            config: useProjectStore.getState(),
            subtitles: useSubtitleStore.getState().segments
          };
          await writeTextFile(savePath, JSON.stringify(projectData, null, 2));
          console.log("Saved project to", savePath);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            <UploadPanel 
              onFileSelected={handleFileSelected} 
              onFileSwitch={handleFileSwitch}
              onFileRemoved={handleFileRemove}
              disabled={processing} 
              filePaths={filePaths} 
              activeFile={activeFile}
            />
          }
          videoPreview={
            <VideoPreview
              videoSrc={videoSrc}
              segments={segments}
              subtitleConfig={subtitleConfig}
              videoRatio={projectConfig.video_ratio as 'original' | '16:9' | '9:16'}
              isEditingSub={sidebarFocus === 'subtitle'}
              onPositionChange={(pos) => projectConfig.updateConfig({ subtitle_position: pos })}
            />
          }
          properties={<PropertiesPanel sidebarFocus={sidebarFocus} onRender={handleRender} onAnalyze={handleAnalyze} processing={processing} />}
          timeline={<Timeline filePaths={filePaths} />}
          settingsContent={<SettingsTab />}
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
