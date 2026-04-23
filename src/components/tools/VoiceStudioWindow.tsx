import { useEffect } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { useVoiceStudioStore } from '../../stores/useVoiceStudioStore';
import { sidecar } from '../../lib/sidecar';
import { Waveform } from '@phosphor-icons/react';

// Import sub-components

import { TTSTab } from './voicestudio/TTSTab'; 
import { HistoryPanel } from './voicestudio/HistoryPanel';

import './VoiceStudioWindow.css';

export function VoiceStudioWindow() {
  const { connected } = useSidecar();
  useTheme(); // Initializes theme for this window
  
  const { 
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


        </section>

        {/* Main Interface Content Grid */}
        <div className="vc-main-grid">
          
          {/* Left Column: Creation Forms per Tab */}
          <div className="vc-options-panel">
            <TTSTab connected={connected} />
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