/**
 * KNReup — Main Application Component
 * Kết nối sidecar, hiển thị dependency checker, rồi NLE layout.
 */
import { useState, useCallback } from 'react';
import { useSidecar } from './hooks/useSidecar';
import { NLELayout, type AppModule, type SidebarFocus } from './components/layout/NLELayout';
import { DependencyChecker } from './components/setup/DependencyChecker';
import './styles/design-system.css';

function App() {
  const { connected, health, systemCheck, error, loading, retrySystemCheck } = useSidecar();

  // App state
  const [showSetup, setShowSetup] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('editor');
  const [sidebarFocus, setSidebarFocus] = useState<SidebarFocus>('preview');

  const handleSetupComplete = useCallback(() => {
    setShowSetup(false);
  }, []);

  return (
    <>
      {/* Dependency Checker popup — hiện khi first-run */}
      {showSetup && (
        <DependencyChecker
          systemCheck={systemCheck}
          loading={loading}
          error={error}
          onComplete={handleSetupComplete}
          onRetry={retrySystemCheck}
        />
      )}

      {/* NLE Layout chính */}
      <NLELayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        activeSidebarFocus={sidebarFocus}
        onSidebarFocusChange={setSidebarFocus}
        statusContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span className="status-text">
              {connected
                ? `✅ Backend connected — ${systemCheck?.gpu.gpu_available ? 'GPU' : 'CPU'} mode`
                : error
                  ? `❌ ${error}`
                  : '⏳ Connecting...'
              }
            </span>
            {health && (
              <span className="status-text" style={{ marginLeft: 'auto' }}>
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
