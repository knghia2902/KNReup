import React, { useEffect, useCallback } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { useVoiceStudioStore } from '../../stores/useVoiceStudioStore';
import { sidecar } from '../../lib/sidecar';
import { 
  Microphone, MagicWand, SpeakerHifi, 
  Waveform, Sparkle, Trash, Play, Pause 
} from '@phosphor-icons/react';

// Import sub-components
import { CloneTab } from './voicestudio/CloneTab';
import { DesignTab } from './voicestudio/DesignTab';
// TTSTab will be imported here in the next wave
// import { TTSTab } from './voicestudio/TTSTab'; 

import './VoiceStudioWindow.css';

export function VoiceStudioWindow() {
  const { connected } = useSidecar();
  useTheme(); // Initializes theme for this window
  
  const { 
    activeTab, 
    setActiveTab, 
    history, 
    fetchHistory, 
    deleteHistory 
  } = useVoiceStudioStore();

  useEffect(() => {
    if (connected) {
      // In Wave 3, this will use Sidecar URL from store. For now, fetch history.
      const baseUrl = sidecar.getBaseUrl();
      fetchHistory(baseUrl);
    }
  }, [connected, fetchHistory]);

  const handleDeleteHistory = (id: string) => {
    deleteHistory(sidecar.getBaseUrl(), id);
  };

  return (
    <div className="vc-layout-wrapper" data-tauri-drag-region>
      <div className="vc-container">
        
        {/* Top Section */}
        <section className="vc-top-section">
          <div className="vc-hero-header">
            <div className="vc-top-row">
              <Waveform size={42} weight="duotone" color="var(--vc-accent)" />
              <h1>Voice Studio</h1>
              <div className={`vc-status-pill ${connected ? 'connected' : ''}`}>
                <div className="vc-status-dot"></div>
                {connected ? 'Engine Ready' : 'Offline'}
              </div>
            </div>
            <p>Trình duyệt studio âm thanh toàn diện: Clone giọng, Tạo giọng AI, và Tổng hợp Text-to-Speech đa nền tảng.</p>
          </div>

          {/* Horizontal Tab Selector */}
          <div className="vc-tab-selector">
            <button 
              className={`vc-tab-btn ${activeTab === 'tts' ? 'active' : ''}`}
              onClick={() => setActiveTab('tts')}
            >
              <SpeakerHifi size={18} weight="fill" />
              Text-to-Speech
            </button>
            <button 
              className={`vc-tab-btn ${activeTab === 'clone' ? 'active' : ''}`}
              onClick={() => setActiveTab('clone')}
            >
              <Microphone size={18} weight="fill" />
              Voice Clone
            </button>
            <button 
              className={`vc-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              <MagicWand size={18} weight="fill" />
              Voice Design
            </button>
          </div>
        </section>

        {/* Main Interface Content Grid */}
        <div className="vc-main-grid">
          
          {/* Left Column: Creation Forms per Tab */}
          <div className="vc-options-panel">
            {activeTab === 'tts' && (
              <div className="vc-card">
                <h2 className="vc-card-title">Tổng hợp Text-to-Speech</h2>
                <div className="vc-empty-placeholder" style={{ padding: '40px' }}>
                  <SpeakerHifi size={48} weight="duotone" className="vc-ep-icon" />
                  <p>Content for TTS to be implemented in Wave 3</p>
                </div>
              </div>
            )}
            {activeTab === 'clone' && <CloneTab connected={connected} />}
            {activeTab === 'design' && <DesignTab connected={connected} />}
          </div>

          {/* Right Column: Unified History/Library (Placeholder for History Panel) */}
          <div className="vc-library-panel">
            <div className="vc-card" style={{ height: '100%' }}>
              <h2 className="vc-card-title" style={{ marginBottom: '8px' }}>
                History / Profiles
                <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--vc-slate)', fontWeight: 500 }}>
                  {history.length} items
                </span>
              </h2>

              {history.length === 0 ? (
                <div className="vc-empty-placeholder" style={{ flex: 1, border: 'none', background: 'transparent' }}>
                  <Sparkle size={40} weight="duotone" className="vc-ep-icon" />
                  <p style={{ margin: 0 }}>Chưa có nội dung nào trong lịch sử.</p>
                </div>
              ) : (
                <div className="vc-profile-list">
                  {history.map(item => (
                    <div key={item.id} className="vc-profile-item">
                      <div className="vc-profile-info">
                        <div className="vc-profile-title" title={item.filename}>{item.filename}</div>
                        <div className="vc-profile-meta">
                          {new Date(item.created_at).toLocaleString()} · {item.engine}
                        </div>
                      </div>
                      <div className="vc-profile-actions">
                        <button 
                          className="vc-icon-btn danger"
                          onClick={() => handleDeleteHistory(item.id)}
                        >
                          <Trash size={16} weight="fill" />
                        </button>
                        {/* Play logic to be abstracted into HistoryPanel in Wave 3 */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}