/**
 * KNReup — Main Application
 * Phase 2: Added pipeline processing (upload → transcribe → translate → TTS → merge)
 */
import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { useSidecar } from './hooks/useSidecar';
import { usePipeline } from './hooks/usePipeline';
import { NLELayout, type AppModule, type SidebarFocus } from './components/layout/NLELayout';
import { DependencyChecker } from './components/setup/DependencyChecker';
import { UploadPanel } from './components/editor/UploadPanel';
import { ProcessingOverlay } from './components/editor/ProcessingOverlay';
import './styles/design-system.css';

function App() {
  const { connected, health, systemCheck, error, loading, retrySystemCheck } = useSidecar();
  const { processing, progress, error: pipelineError, startPipeline, cancelPipeline } = usePipeline();
  const [showSetup, setShowSetup] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('editor');
  const [sidebarFocus, setSidebarFocus] = useState<SidebarFocus>('preview');

  const handleSetupComplete = useCallback(() => setShowSetup(false), []);

  const handleFileSelected = useCallback(
    (file: File) => {
      // Start pipeline with default config
      startPipeline(file, {
        translation_engine: 'deepseek',
        target_lang: 'vi',
        tts_engine: 'edge_tts',
        voice: 'vi-VN-HoaiMyNeural',
      });
    },
    [startPipeline],
  );

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

      {processing && progress && (
        <ProcessingOverlay progress={progress} onCancel={cancelPipeline} />
      )}

      <NLELayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        activeSidebarFocus={sidebarFocus}
        onSidebarFocusChange={setSidebarFocus}
        mediaBin={
          <UploadPanel onFileSelected={handleFileSelected} disabled={processing} />
        }
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
    </>
  );
}

export default App;
