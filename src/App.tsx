/**
 * KNReup — Main Application
 * Phase 3: Added VideoPreview, Zustand stores, Properties panel
 */
import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { useSidecar } from './hooks/useSidecar';
import { useQueueStore } from './stores/queueStore';
import { usePipeline } from './hooks/usePipeline';
import { listen } from '@tauri-apps/api/event';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { NLELayout, type AppModule } from './components/layout/NLELayout';
import { getVideoSrc } from './utils/url';
import { Titlebar } from './components/layout/Titlebar';
import { Timeline } from './components/editor/Timeline';
import { UploadPanel } from './components/editor/UploadPanel';
import { JobMonitor } from './components/editor/JobMonitor';
import { CategoryBar, type AssetCategory } from './components/editor/CategoryBar';
import { AssetPlaceholder } from './components/editor/AssetPlaceholder';
import { AudioLibrary } from './components/editor/AudioLibrary';
import { VideoPreview } from './components/editor/VideoPreview';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { SettingsTab } from './components/properties/SettingsTab';
import { useProjectStore } from './stores/useProjectStore';
import { useSubtitleStore } from './stores/useSubtitleStore';
import { useLauncherStore } from './stores/useLauncherStore';
import './styles/design-system.css';

function App() {
  const { connected, health } = useSidecar();
  const { processing, progress, error: pipelineError, analyzeVideo, renderVideo, cancelPipeline, resetPipeline } = usePipeline();
  
  // Get route params
  const params = (() => {
    try {
      return new URLSearchParams(window.location.search);
    } catch { return new URLSearchParams(); }
  })();
  const projectId = params.get('id');
  const activeModule: AppModule = (() => {
    const mod = params.get('module');
    if (mod && ['editor', 'downloader', 'monitor', 'settings'].includes(mod)) return mod as AppModule;
    return 'editor';
  })();
  
  const [filePaths, setFilePaths] = useState<string[]>(() => {
    if (!projectId) return [];
    return useLauncherStore.getState().getProjectById(projectId)?.filePaths || [];
  });
  const [activeFile, setActiveFile] = useState<string | null>(() => {
    const state = useProjectStore.getState();
    const pFiles = projectId ? useLauncherStore.getState().getProjectById(projectId)?.filePaths || [] : [];
    if (state.activeFile && pFiles.includes(state.activeFile)) return state.activeFile;
    return pFiles.length > 0 ? pFiles[0] : null;
  });
  const [videoSrc, setVideoSrc] = useState<string | null>(() => {
    const state = useProjectStore.getState();
    const pFiles = projectId ? useLauncherStore.getState().getProjectById(projectId)?.filePaths || [] : [];
    const target = (state.activeFile && pFiles.includes(state.activeFile)) ? state.activeFile : (pFiles.length > 0 ? pFiles[0] : null);
    return target ? getVideoSrc(target) : null;
  });
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('media');

  // Zustand stores
  const projectConfig = useProjectStore();

  const handleFileSelected = useCallback(
    async (selectedPath: string) => {
      setFilePaths(prev => {
        if (prev.includes(selectedPath)) return prev;
        const newPaths = [...prev, selectedPath];
        if (projectId) useLauncherStore.getState().updateProject(projectId, { filePaths: newPaths });
        return newPaths;
      });
      setActiveFile(selectedPath);
      useSubtitleStore.getState().setActiveFile(selectedPath);
      useProjectStore.getState().setActiveFile(selectedPath);
      setVideoSrc(getVideoSrc(selectedPath));

      // Auto-fit to view when a new video is added
      setTimeout(() => {
        const video = document.querySelector('video');
        const tlbody = document.querySelector('.tlbody');
        if (video && tlbody && video.duration > 0) {
           const viewportWidth = tlbody.clientWidth;
           const fitZoom = viewportWidth / (video.duration * 50);
           useProjectStore.getState().updateConfig({ timelineZoom: Math.max(0.0001, Math.min(1.0, fitZoom * 0.95)) });
        }
      }, 500);
    },
    [projectId]
  );

  const handleFileSwitch = useCallback((path: string) => {
    setActiveFile(path);
    useSubtitleStore.getState().setActiveFile(path);
    useProjectStore.getState().setActiveFile(path);
    setVideoSrc(getVideoSrc(path));
  }, []);

  const handleFileRemove = useCallback(
    (removePath: string) => {
      let nextActive: string | null = null;
      setFilePaths(prev => {
        const newPaths = prev.filter(p => p !== removePath);
        if (projectId) useLauncherStore.getState().updateProject(projectId, { filePaths: newPaths });
        
        if (activeFile === removePath) {
          nextActive = newPaths.length > 0 ? newPaths[newPaths.length - 1] : null;
          setActiveFile(nextActive);
          useSubtitleStore.getState().setActiveFile(nextActive);
          useProjectStore.getState().setActiveFile(nextActive);
          setVideoSrc(nextActive ? getVideoSrc(nextActive) : null);
        }
        return newPaths;
      });
      useProjectStore.getState().removeFileData(removePath);
    },
    [activeFile, projectId]
  );

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
        
        // Wrap in timeout to prevent "Cannot update a component while rendering another"
        // as this runs right after usePipeline's state update
        setTimeout(() => {
          useSubtitleStore.getState().setSegments(mappedSegments, activeFile);
        }, 0);
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
        filters: [{ name: 'Video', extensions: [projectConfig.container] }]
      });

      if (savePath) {
        useQueueStore.getState().addJob({
          videoPath: activeFile,
          outputPath: savePath,
          segments: useSubtitleStore.getState().segments,
          duration: useSubtitleStore.getState().videoDuration,
          videoDimensions: useSubtitleStore.getState().videoDimensions || undefined,
          config: {
            ...projectConfig,
            original_volume: projectConfig.audio_mix_mode === 'replace' ? 0 : projectConfig.original_volume,
            subtitle_config: {
              font: projectConfig.subtitle_font,
              font_size: projectConfig.subtitle_font_size,
              color: projectConfig.subtitle_color,
              outline_color: projectConfig.subtitle_outline_color,
              video_ratio: projectConfig.video_ratio,
              subtitle_x: projectConfig.subtitle_x,
              subtitle_y: projectConfig.subtitle_y,
              subtitle_w: projectConfig.subtitle_w,
              subtitle_h: projectConfig.subtitle_h,
              subtitle_enabled: projectConfig.subtitle_enabled,
            }
          },
        });
      }
    } catch (err) {
      console.error("Save dialog failed:", err);
    }
  }, [activeFile, projectConfig]);

  // Queue processor loop
  const jobs = useQueueStore(state => state.jobs);

  useEffect(() => {
    const isIdle = !processing && (!progress || progress.stage === 'done' || progress.stage === 'error' || progress.stage === 'cancelled');
    if (isIdle) {
      const currentJobs = useQueueStore.getState().jobs;
      const nextJob = currentJobs.find(j => j.status === 'pending');
      const hasProcessing = currentJobs.some(j => j.status === 'processing');

      if (nextJob && !hasProcessing) {
        if (progress) resetPipeline();
        useQueueStore.getState().updateJobStatus(nextJob.id, 'processing');
        
        import('./utils/subtitleLayout').then(({ calculateSubtitleLayout }) => {
          const layoutSegments = calculateSubtitleLayout(
            nextJob.segments, 
            nextJob.config, 
            nextJob.videoDimensions || {w: 1920, h: 1080}
          );
          
          renderVideo(
            nextJob.videoPath,
            nextJob.config,
            layoutSegments,
            nextJob.duration || 0,
            nextJob.outputPath
          ).then(() => {
            useQueueStore.getState().updateJobStatus(nextJob.id, 'completed');
          }).catch(() => {
            useQueueStore.getState().updateJobStatus(nextJob.id, 'failed');
          });
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

    const setupListeners = async () => {
      if (typeof window !== 'undefined' && !(window as any).__TAURI_INTERNALS__) return;
      try {
        unlistenFile = await listen('tauri://file-drop', (event) => {
          const paths = event.payload as string[];
          if (paths && paths.length > 0) handleFileSelected(paths[0]);
        });
        unlistenDrag = await listen('tauri://drag-drop', (event) => {
          const payload = event.payload as any;
          if (payload && payload.paths && payload.paths.length > 0) handleFileSelected(payload.paths[0]);
        });
      } catch (err) {
        console.error("Failed to setup Tauri listeners:", err);
      }
    };
    setupListeners();
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
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {(processing || (progress && progress.stage === 'done')) && progress && (
        <JobMonitor progress={progress} onCancel={cancelPipeline} onDismiss={resetPipeline} />
      )}

      <Titlebar />
      <div className="app">
        <NLELayout
          activeModule={activeModule}
          mediaBin={
            <>
              <CategoryBar active={assetCategory} onChange={setAssetCategory} />
              {assetCategory === 'media' ? (
                <UploadPanel 
                  onFileSelected={handleFileSelected} 
                  onFileSwitch={handleFileSwitch}
                  onFileRemoved={handleFileRemove}
                  disabled={processing} 
                  filePaths={filePaths} 
                  activeFile={activeFile}
                />
              ) : assetCategory === 'audio' ? (
                <AudioLibrary />
              ) : (
                <AssetPlaceholder category={assetCategory} />
              )}
            </>
          }
          videoPreview={
            <VideoPreview
              videoSrc={videoSrc}
              videoRatio={projectConfig.video_ratio as 'original' | '16:9' | '9:16'}
            />
          }
          properties={<PropertiesPanel onRender={handleRender} onAnalyze={handleAnalyze} processing={processing} />}
          timeline={<Timeline filePaths={filePaths} />}
          settingsContent={<SettingsTab />}
          onVideoDrop={handleVideoDrop}
          statusContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {connected ? (
                <CheckCircle size={12} weight="fill" style={{ color: 'var(--success)' }} />
              ) : (
                <CircleNotch size={12} className="dep-spin" style={{ color: 'var(--accent)' }} />
              )}
              <span className="status-mono">
                {connected ? 'Backend connected' : 'Connecting...'}
              </span>
              {pipelineError && <span className="status-mono" style={{ color: 'var(--danger)' }}>Pipeline: {pipelineError}</span>}
              {health && <span className="status-mono" style={{ marginLeft: 'auto' }}>v{health.version}</span>}
            </div>
          }
        />
      </div>
    </>
  );
}

export default App;
