import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES } from '../TemplatePreview/templateData';
import { TEMPLATE_SET_LIST, getTemplateSet } from '../TemplatePreview/sets';
import { LabHistoryList } from './LabHistoryList';

export function LabConfigPanel() {
  const store = useVideoGenLabStore();

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
              <optgroup label="Tiếng Việt">
                <option value="vi-VN-HoaiMyNeural">Hoài My (Nữ)</option>
                <option value="vi-VN-NamMinhNeural">Nam Minh (Nam)</option>
              </optgroup>
              <optgroup label="English">
                <option value="en-US-JennyMultilingualNeural">Jenny (Female)</option>
              </optgroup>
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
      </div>

      <div className="vgl-content-card">
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 -8px 0', color: 'var(--vgl-text)' }}>History</h3>
        <LabHistoryList />
      </div>
    </>
  );
}
