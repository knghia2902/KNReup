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
    getCurrentWindow().setTitle('KNReup Video Gen Lab').catch(console.warn);
  }, [store.fetchOllamaModels, store.fetchHistory]);

  return (
    <div className="vgl-layout-wrapper">
      <div className="vgl-container">
        
        {/* Top Hero Section */}
        <section className="vgl-top-section">
          <div className="vgl-hero-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h1>
                <Flask size={40} weight="duotone" color="var(--vgl-accent)" />
                Video Gen Lab
              </h1>
              <button className="theme-toggle" onClick={toggle} title={isDark ? 'Light Mode' : 'Dark Mode'}>
                {isDark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
              </button>
            </div>
            <p>End-to-end testing environment for the Auto-Create-Video pipeline. Enter a URL below to begin extraction.</p>
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
            <div className="vgl-status-row">
              <div className={`vgl-status-dot ${
                store.pipelineStatus === 'running' ? 'running' : 
                store.pipelineStatus === 'complete' ? 'active' : 
                store.pipelineStatus === 'error' ? 'error' : ''
              }`} />
              <span className="vgl-status-label">
                STATUS: {store.pipelineStatus.toUpperCase()} {store.currentStepName ? `| ${store.currentStepName}` : ''}
              </span>
            </div>
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
