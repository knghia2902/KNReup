/**
 * KNReup — Main Application
 * taste-skill: DESIGN_VARIANCE=5, MOTION_INTENSITY=4, VISUAL_DENSITY=8
 */
import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { useSidecar } from './hooks/useSidecar';
import { NLELayout, type AppModule, type SidebarFocus } from './components/layout/NLELayout';
import { DependencyChecker } from './components/setup/DependencyChecker';
import './styles/design-system.css';

function App() {
  const { connected, health, systemCheck, error, loading, retrySystemCheck } = useSidecar();
  const [showSetup, setShowSetup] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('editor');
  const [sidebarFocus, setSidebarFocus] = useState<SidebarFocus>('preview');

  const handleSetupComplete = useCallback(() => setShowSetup(false), []);

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

      <NLELayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        activeSidebarFocus={sidebarFocus}
        onSidebarFocusChange={setSidebarFocus}
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
