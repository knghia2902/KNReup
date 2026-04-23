import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { SpeakerHigh, Waveform, SpeakerLow, ArrowSquareOut } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { sidecar } from '../../lib/sidecar';

export function AudioTab() {
  const config = useProjectStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = config.audio_volume;
    }
  }, [config.audio_volume]);

  // Load custom profiles on mount and window focus (for OmniVoice voice dropdown)
  const loadProfiles = () => {
    try {
      sidecar.getProfiles().then(res => {
        if (res.profiles) {
          useProjectStore.setState({ custom_voice_profiles: res.profiles });
        }
      }).catch(e => console.warn("Profiles not available yet:", e.message));
    } catch {
      console.warn("Sidecar not ready, will retry on focus");
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadProfiles, 2000);
    window.addEventListener('focus', loadProfiles);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', loadProfiles);
    };
  }, []);

  const openVoiceStudio = async () => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      new WebviewWindow('voice-studio', {
        url: '/index.html?type=tool&tool=voice-studio',
        title: 'Voice Studio',
        width: 1100, height: 700,
        center: true,
      });
    } catch {
      window.open('/index.html?type=tool&tool=voice-studio', '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)' }}>
      {/* SECTION: ORIGINAL AUDIO */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SpeakerLow size={16} weight="bold" />
            <span>Original Audio</span>
          </div>
        </div>
        <ToggleControl
          label="Keep Original Audio"
          checked={config.audio_mix_mode === 'mix'}
          onChange={(v) => config.updateConfig({ audio_mix_mode: v ? 'mix' : 'replace' })}
        />
        {config.audio_mix_mode === 'mix' && (
          <SliderControl
            label="Volume"
            value={Math.round(config.original_volume * 100)}
            min={0} max={100} unit="%"
            onChange={(v) => config.updateConfig({ original_volume: v / 100 })}
          />
        )}
      </div>

      {/* SECTION: VOICE (TTS) */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SpeakerHigh size={16} weight="bold" />
            <span>Voice Engine</span>
          </div>
          <ToggleControl 
            label="" 
            checked={config.dubbing_enabled} 
            onChange={(v) => config.updateConfig({ dubbing_enabled: v })}
          />
        </div>
        
        {config.dubbing_enabled && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Engine Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {([
                { id: 'edge_tts', name: 'Edge TTS', desc: 'Online · Free' },
                { id: 'omnivoice', name: 'OmniVoice', desc: 'Local · Clone' },
                { id: 'elevenlabs', name: 'ElevenLabs', desc: 'Online · Premium' },
              ] as const).map(eng => (
                <div 
                  key={eng.id}
                  style={{
                    padding: '8px', border: '1px solid var(--border)', borderRadius: '6px',
                    background: config.tts_engine === eng.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                    borderColor: config.tts_engine === eng.id ? 'var(--accent)' : 'var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '4px'
                  }}
                  onClick={() => config.updateConfig({ tts_engine: eng.id })}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{eng.name}</div>
                  <div style={{ fontSize: '9px', color: config.tts_engine === eng.id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>{eng.desc}</div>
                </div>
              ))}
            </div>

            {/* ElevenLabs API Key */}
            {config.tts_engine === 'elevenlabs' && (
              <div className="pr" style={{ marginTop: '4px' }}>
                <div className="plbl">API Key</div>
                <div className="pc">
                  <input 
                    type="password"
                    className="inp"
                    placeholder="sk-..."
                    value={config.elevenlabs_api_key}
                    onChange={(e) => config.updateConfig({ elevenlabs_api_key: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Voice Selector */}
            <div className="pr" style={{ marginTop: '4px' }}>
              <div className="plbl">Voice</div>
              <div className="pc">
                <select 
                  className="psel" 
                  value={config.voice}
                  onChange={(e) => config.updateConfig({ voice: e.target.value })}
                >
                  {config.tts_engine === 'edge_tts' && (
                    <optgroup label="Edge TTS - Vietnamese">
                      <option value="vi-VN-HoaiMyNeural">Hoài My (Female)</option>
                      <option value="vi-VN-NamMinhNeural">Nam Minh (Male)</option>
                    </optgroup>
                  )}
                  {config.tts_engine === 'elevenlabs' && (
                    <optgroup label="ElevenLabs Voices">
                      <option value="Rachel">Rachel</option>
                      <option value="Drew">Drew</option>
                      <option value="Clyde">Clyde</option>
                      <option value="Mimi">Mimi</option>
                    </optgroup>
                  )}
                  {config.tts_engine === 'omnivoice' && (
                    <>
                      <optgroup label="Standard Voices">
                        <option value="default_male">Default Male</option>
                        <option value="default_female">Default Female</option>
                      </optgroup>
                      {(config.custom_voice_profiles || []).length > 0 && (
                        <optgroup label="Custom Cloned Voices">
                          {config.custom_voice_profiles.map(p => {
                            const vName = typeof p === 'string' ? p : p.name;
                            return <option key={vName} value={vName}>🎤 {vName}</option>;
                          })}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Voice Studio link for OmniVoice */}
            {config.tts_engine === 'omnivoice' && (
              <button
                className="btn"
                onClick={openVoiceStudio}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  height: '28px', fontSize: '11px', fontWeight: 600,
                  background: 'transparent', border: '1px dashed var(--accent)',
                  color: 'var(--accent)', borderRadius: '6px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowSquareOut size={14} />
                Mở Voice Studio để tạo / quản lý giọng
              </button>
            )}

            {/* Modulation Controls */}
            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '0 4px' }}>
                <Waveform size={14} color="var(--accent)" />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Modulation</span>
              </div>
              <SliderControl 
                label="TTS Speed" 
                value={config.tts_speed} 
                min={0.5} max={2.0} step={0.1} unit="x" 
                onChange={(v) => config.updateConfig({ tts_speed: v })}
              />
              <SliderControl 
                label="Pitch" 
                value={config.pitch} 
                min={0.5} max={2.0} step={0.1} unit="x" 
                onChange={(v) => config.updateConfig({ pitch: v })}
              />
              <SliderControl 
                label="Master Vol" 
                value={Math.round(config.volume * 100)} 
                min={0} max={200} step={5} unit="%" 
                onChange={(v) => config.updateConfig({ volume: v / 100 })}
              />
              
              <div style={{ marginTop: '12px' }}>
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', 
                    alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--accent)', 
                    color: 'var(--accent)', height: '28px'
                  }}
                  onClick={async () => {
                    try {
                      const text = "Xin chào, đây là giọng đọc thử nghiệm.";
                      const blob = await sidecar.synthesize({
                        text: text, engine: config.tts_engine, voice: config.voice,
                        rate: config.tts_speed, volume: config.volume, pitch: config.pitch
                      });
                      const url = URL.createObjectURL(blob);
                      new Audio(url).play();
                    } catch (e) {
                      alert("Voice Preview failed.");
                    }
                  }}
                >
                  Preview Voice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
