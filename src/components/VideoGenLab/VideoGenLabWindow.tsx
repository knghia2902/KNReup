import React, { useEffect } from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { LabConfigPanel } from './LabConfigPanel';
import { LabOutputPanel } from './LabOutputPanel';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MagnifyingGlass, Flask, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/video-gen-lab.css';

export function VideoGenLabWindow() {
  const store = useVideoGenLabStore();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    store.fetchOllamaModels();
    store.fetchHistory();
    getCurrentWindow().setTitle('KNReup Video Gen').catch(console.warn);
  }, [store.fetchOllamaModels, store.fetchHistory]);

  return (
    <div className="vgl-layout-wrapper">
      <div className="vgl-container">
        
        {/* Top Hero Section */}
        <section className="vgl-top-section">
          <div className="vgl-hero-header">
              <h1>
                <Flask size={40} weight="duotone" color="var(--vgl-accent)" />
                Video Gen
              </h1>
            <p>Tạo video tự động từ URL bài báo. Nhập link bên dưới để bắt đầu.</p>
          </div>

          <div className="vgl-hero-search">
            <div className="vgl-search-box">
              <MagnifyingGlass size={24} className="vgl-search-icon" weight="bold" />
              <input
                type="text"
                className="vgl-search-input"
                placeholder="Dán URL bài báo (VnExpress, Dân Trí, Tuổi Trẻ...)"
                value={store.url}
                onChange={(e) => store.setUrl(e.target.value)}
                disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
              />
              <button 
                className={`vgl-analyze-btn ${store.pipelineStatus === 'running' ? 'running' : ''}`}
                onClick={() => {
                  if (store.pipelineStatus === 'idle' || store.pipelineStatus === 'error' || store.pipelineStatus === 'complete') {
                    store.startPipeline();
                  } else if (store.pipelineStatus === 'paused') {
                    store.continuePipeline();
                  }
                }}
                disabled={!store.url || !store.ollamaOnline}
              >
                {store.pipelineStatus === 'idle' && 'GENERATE'}
                {store.pipelineStatus === 'running' && 'CANCEL'}
                {store.pipelineStatus === 'paused' && 'CONTINUE'}
                {store.pipelineStatus === 'error' && 'RETRY'}
                {store.pipelineStatus === 'complete' && 'NEW GEN'}
              </button>
            </div>
            {store.errorMessage && (
              <div className="vgl-error-message" style={{ color: 'var(--vgl-danger)', fontSize: '0.9rem', paddingLeft: '12px' }}>
                {store.errorMessage}
              </div>
            )}

          </div>
        </section>

        {/* Main Grid: Left Config, Right Output */}
        <div className="vgl-main-grid">
          <div className="vgl-form-panel">
            <LabConfigPanel />
          </div>

          <div>
            <LabOutputPanel />
          </div>
        </div>

      </div>
    </div>
  );
}
