import { useEffect, useState } from 'react';
import { PlayCircle, Spinner } from '@phosphor-icons/react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES } from '../TemplatePreview/templateData';
import { TEMPLATE_SET_LIST, getTemplateSet } from '../TemplatePreview/sets';
import { LabHistoryList } from './LabHistoryList';

export function LabConfigPanel() {
  const store = useVideoGenLabStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVoice = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const response = await fetch('http://127.0.0.1:8008/api/video-gen/lab/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: store.selectedVoice,
          speed: store.voiceSpeed
        })
      });
      if (!response.ok) throw new Error('Failed to fetch audio');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.play();
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    store.fetchVoices();
  }, []);

  return (
    <>
      <div className="vgl-content-card">
        {/* Mode Selection */}
        <div className="vgl-field">
          <label className="vgl-field-label">Chế độ chạy (Mode)</label>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--vgl-bg)', padding: '6px', borderRadius: '1.25rem', border: '1px solid var(--vgl-border)' }}>
            <button
              onClick={() => store.setMode('auto')}
              style={{
                flex: 1, padding: '10px', borderRadius: '1rem', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: store.mode === 'auto' ? 'var(--vgl-accent)' : 'transparent',
                color: store.mode === 'auto' ? '#fff' : 'var(--vgl-text)'
              }}
              disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
            >
              Auto (Tự động)
            </button>
            <button
              onClick={() => store.setMode('manual')}
              style={{
                flex: 1, padding: '10px', borderRadius: '1rem', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: store.mode === 'manual' ? 'var(--vgl-accent)' : 'transparent',
                color: store.mode === 'manual' ? '#fff' : 'var(--vgl-text)'
              }}
              disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
            >
              Manual (Duyệt kịch bản)
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="vgl-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="vgl-field-label">Ollama Model</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <div className={`vgl-status-dot ${store.ollamaOnline ? 'active' : 'error'}`} />
              <span style={{ color: store.ollamaOnline ? 'var(--vgl-success)' : 'var(--vgl-danger)' }}>
                {store.ollamaOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <select
            className="vgl-select"
            value={store.selectedModel}
            onChange={(e) => store.setSelectedModel(e.target.value)}
            disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused' || !store.ollamaOnline}
          >
            {store.ollamaModels.length === 0 ? (
              <option value="">No models found</option>
            ) : (
              store.ollamaModels.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))
            )}
          </select>
        </div>



        {/* Template Set Selection */}
        <div className="vgl-field">
            <label className="vgl-field-label">Template Set</label>
            <select
                className="vgl-select"
                value={store.selectedTemplateSet}
                onChange={(e) => store.setSelectedTemplateSet(e.target.value)}
                disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
            >
                {TEMPLATE_SET_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name} — {s.description}
                    </option>
                ))}
            </select>
        </div>

        {/* Theme Selection */}
        <div className="vgl-field">
          <label className="vgl-field-label">Theme Palette</label>
          <select
            className="vgl-select"
            value={store.selectedTheme}
            onChange={(e) => store.setSelectedTheme(e.target.value)}
            disabled={store.pipelineStatus === 'running'}
          >
            {Object.keys(THEME_PALETTES).map((key) => (
              <option key={key} value={key}>{THEME_PALETTES[key].name}</option>
            ))}
          </select>
        </div>

        <div className="vgl-field">
          <label className="vgl-field-label">Preview Scene</label>
          <select
            className="vgl-select"
            value={store.selectedTemplate || 0}
            onChange={(e) => store.setSelectedTemplate(Number(e.target.value))}
            disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
          >
            {getTemplateSet(store.selectedTemplateSet).templates.map((tpl, idx) => (
              <option key={tpl.id} value={idx}>{tpl.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Voice Selection */}
          <div className="vgl-field">
            <label className="vgl-field-label">Voice Profile</label>
            <select
              className="vgl-select"
              value={store.selectedVoice}
              onChange={(e) => store.setSelectedVoice(e.target.value)}
              disabled={store.pipelineStatus === 'running'}
            >
              {Object.keys(store.availableVoices).length === 0 ? (
                <>
                  <optgroup label="Tiếng Việt">
                    <option value="vi-VN-HoaiMyNeural">Hoài My (Nữ)</option>
                    <option value="vi-VN-NamMinhNeural">Nam Minh (Nam)</option>
                  </optgroup>
                  <optgroup label="English">
                    <option value="en-US-JennyMultilingualNeural">Jenny (Female)</option>
                  </optgroup>
                </>
              ) : (
                Object.entries(store.availableVoices).map(([group, voices]) => (
                  <optgroup key={group} label={group}>
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>

          {/* Language Selection */}
          <div className="vgl-field">
            <label className="vgl-field-label">Language</label>
            <select
              className="vgl-select"
              value={store.selectedLanguage}
              onChange={(e) => store.setSelectedLanguage(e.target.value)}
              disabled={store.pipelineStatus === 'running' || store.pipelineStatus === 'paused'}
            >
              <option value="Vietnamese">Tiếng Việt</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>

        {/* Voice Speed */}
        <div className="vgl-field" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="vgl-field-label" style={{ marginBottom: 0 }}>Voice Speed</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>{store.voiceSpeed.toFixed(1)}x</span>
              <button 
                onClick={handlePlayVoice}
                disabled={isPlaying || store.pipelineStatus === 'running'}
                style={{
                  background: 'none', border: 'none', cursor: isPlaying ? 'default' : 'pointer',
                  color: isPlaying ? 'var(--vgl-accent)' : 'var(--vgl-text)',
                  padding: 0, display: 'flex', alignItems: 'center',
                  opacity: (isPlaying || store.pipelineStatus === 'running') ? 0.5 : 1
                }}
                title="Nghe thử giọng đọc"
              >
                {isPlaying ? (
                  <Spinner size={20} className="vgl-spin" />
                ) : (
                  <PlayCircle size={20} weight="fill" />
                )}
              </button>
            </div>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            value={store.voiceSpeed}
            onChange={(e) => store.setVoiceSpeed(parseFloat(e.target.value))}
            disabled={store.pipelineStatus === 'running'}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="vgl-content-card">
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 -8px 0', color: 'var(--vgl-text)' }}>History</h3>
        <LabHistoryList />
      </div>
    </>
  );
}
