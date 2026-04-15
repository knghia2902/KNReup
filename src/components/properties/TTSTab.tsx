import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';

export function TTSTab() {
  const config = useProjectStore();

  return (
    <>
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>VOICE ENGINE</span>
          </div>
          <ToggleControl 
            label="" 
            checked={config.dubbing_enabled} 
            onChange={(v) => config.updateConfig({ dubbing_enabled: v })}
          />
        </div>
        
        {config.dubbing_enabled && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '6px'
            }}>
              <div 
                style={{
                  padding: '8px', border: '1px solid var(--border)', borderRadius: '6px',
                  background: config.tts_engine === 'edge_tts' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  borderColor: config.tts_engine === 'edge_tts' ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
                onClick={() => config.updateConfig({ tts_engine: 'edge_tts' })}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>Edge TTS</div>
                <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 500 }}>Online · Free</div>
              </div>
              <div 
                style={{
                  padding: '8px', border: '1px solid var(--border)', borderRadius: '6px',
                  background: config.tts_engine === 'piper' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  borderColor: config.tts_engine === 'piper' ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
                onClick={() => config.updateConfig({ tts_engine: 'piper' })}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>Piper TTS</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Offline · Local</div>
              </div>
            </div>

            <div className="pr" style={{ marginTop: '4px' }}>
              <div className="plbl">Voice</div>
              <div className="pc">
                <select 
                  className="psel" 
                  value={config.voice}
                  onChange={(e) => {
                    const val = e.target.value;
                    const engine = val.includes('Neural') ? 'edge_tts' : 'piper';
                    config.updateConfig({ voice: val, tts_engine: engine });
                  }}
                >
                  <optgroup label="Edge TTS - Vietnamese">
                    <option value="vi-VN-HoaiMyNeural">Hoài My (Female)</option>
                    <option value="vi-VN-NamMinhNeural">Nam Minh (Male)</option>
                  </optgroup>
                  <optgroup label="Piper TTS - Offline">
                    <option value="vi-VN-x-medium">Vietnamese (Medium)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {config.dubbing_enabled && (
        <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
          <div className="pshd">
            <span>MODULATION</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <SliderControl 
              label="Speed" 
              value={config.speed} 
              min={0.5} max={2.0} step={0.1} unit="x" 
              onChange={(v) => config.updateConfig({ speed: v })}
            />
            <SliderControl 
              label="Volume" 
              value={Math.round(config.volume * 100)} 
              min={0} max={200} step={5} unit="%" 
              onChange={(v) => config.updateConfig({ volume: v / 100 })}
            />
            <SliderControl 
              label="Pitch" 
              value={config.pitch} 
              min={0.5} max={2.0} step={0.1} unit="x" 
              onChange={(v) => config.updateConfig({ pitch: v })}
            />
            
            <div style={{ marginTop: '12px', padding: '0 12px' }}>
              <button 
                className="btn" 
                style={{ 
                  width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', 
                  alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--accent)', 
                  color: 'var(--accent)'
                }}
                onClick={async () => {
                  try {
                    const port = localStorage.getItem('sidecar_port') || '8008';
                    const text = "Xin chào, đây là giọng đọc thử nghiệm.";
                    const res = await fetch(`http://127.0.0.1:${port}/api/pipeline/tts-demo`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text: text, engine: config.tts_engine, voice: config.voice,
                        rate: config.speed, volume: config.volume, pitch: config.pitch
                      })
                    });
                    if (!res.ok) throw new Error("TTS Demo failed");
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    new Audio(url).play();
                  } catch (e) {
                    alert("Voice Preview failed.");
                  }
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                  <path d="M8 2 C4 2 1 5 1 9 C1 13 4 16 8 16 C12 16 15 13 15 9 M3 9h2 M11 9h2" strokeLinecap="round"/>
                </svg>
                Preview Voice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
