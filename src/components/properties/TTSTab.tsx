import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';

export function TTSTab() {
  const config = useProjectStore();

  return (
    <>
      <div className="ps">
        <div className="pshd">Dubbing System</div>
        <ToggleControl 
          label="Status" 
          checked={config.dubbing_enabled} 
          onChange={(v) => config.updateConfig({ dubbing_enabled: v })}
        />
        
        <div className="egrid">
          <div 
            className={`ecard ${config.tts_engine === 'edge_tts' ? 'active' : ''}`}
            onClick={() => config.updateConfig({ tts_engine: 'edge_tts' })}
          >
            <span className="ecard-name">Edge TTS</span>
            <span className="ecard-st ok">Online · Free</span>
          </div>
          <div 
            className={`ecard ${config.tts_engine === 'piper' ? 'active' : ''}`}
            onClick={() => config.updateConfig({ tts_engine: 'piper' })}
          >
            <span className="ecard-name">Piper TTS</span>
            <span className="ecard-st">Offline · Local</span>
          </div>
          <div className="ecard">
            <span className="ecard-name">ElevenLabs</span>
            <span className="ecard-st warn">API Key Req</span>
          </div>
          <div className="ecard">
            <span className="ecard-name">OpenAI</span>
            <span className="ecard-st">Paid · Slow</span>
          </div>
        </div>
      </div>

      <div className="ps">
        <div className="pshd">Voice Setting</div>
        <div className="pr">
          <div className="plbl">Actor</div>
          <div className="pc">
            <select 
              className="psel" 
              value={config.voice}
              onChange={(e) => config.updateConfig({ voice: e.target.value })}
            >
              <optgroup label="Edge TTS - Female">
                <option value="vi-VN-HoaiMyNeural">Hoài My</option>
                <option value="vi-VN-BichNgocNeural">Bích Ngọc</option>
              </optgroup>
              <optgroup label="Edge TTS - Male">
                <option value="vi-VN-NamMinhNeural">Nam Minh</option>
              </optgroup>
              <optgroup label="Piper TTS - Local">
                <option value="vi-VN-x-medium">Vietnamese Medium</option>
              </optgroup>
            </select>
          </div>
        </div>
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
        
        <div style={{ marginTop: 12 }}>
          <button 
            className="btn sm" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}
            onClick={async () => {
              if (!config.activeFile) return alert("Select a video first to preview Audio FX");
              try {
                const res = await fetch(`http://localhost:8000/api/pipeline/preview-audio`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audio_path: config.activeFile,
                    speed: config.speed,
                    pitch: config.pitch
                  })
                });
                if (!res.ok) throw new Error("Preview failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
              } catch (e) {
                alert("Audio FX Preview failed.");
                console.error(e);
              }
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
              <polygon points="5,3 13,8 5,13" fill="currentColor"/>
            </svg>
            Preview Audio FX
          </button>
        </div>
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <div className="pshd">Fallback Chain</div>
        <div className="fchain">
          <span className="fcn">1</span>
          <span className="fcname">Edge TTS</span>
          <span className={`fcbadge ${config.tts_engine === 'edge_tts' ? 'ok' : ''}`}>
            {config.tts_engine === 'edge_tts' ? 'Active' : 'Backup'}
          </span>
        </div>
        <div className="fchain">
          <span className="fcn">2</span>
          <span className="fcname">Piper (vi-VN-x-medium)</span>
          <span className={`fcbadge ${config.tts_engine === 'piper' ? 'ok' : ''}`}>
            {config.tts_engine === 'piper' ? 'Active' : 'Ready'}
          </span>
        </div>
      </div>
    </>
  );
}
