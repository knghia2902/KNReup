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
import { TTSTab } from './voicestudio/TTSTab'; 
import { HistoryPanel } from './voicestudio/HistoryPanel';

import './VoiceStudioWindow.css';

export function VoiceStudioWindow() {
  const { connected } = useSidecar();
  useTheme(); // Initializes theme for this window
  
  const { 
    activeTab, 
    setActiveTab, 
    fetchHistory, 
  } = useVoiceStudioStore();

  useEffect(() => {
    if (connected) {
      // In Wave 3, this will use Sidecar URL from store. For now, fetch history.
      const baseUrl = sidecar.getBaseUrl();
      fetchHistory(baseUrl);
    }
  }, [connected, fetchHistory]);

  // Cleanup function removed


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
            {activeTab === 'tts' && <TTSTab connected={connected} />}
            {activeTab === 'clone' && <CloneTab connected={connected} />}
            {activeTab === 'design' && <DesignTab connected={connected} />}
          </div>

          {/* Right Column: Unified History/Library */}
          <div className="vc-library-panel">
            <HistoryPanel />
          </div>

        </div>
      </div>
    </div>
  );
}