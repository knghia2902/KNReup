import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { SpeakerHigh, Waveform, MusicNotes, SpeakerLow } from '@phosphor-icons/react';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useEffect, useRef } from 'react';

export function AudioTab() {
  const config = useProjectStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = config.bgm_volume;
    }
  }, [config.bgm_volume]);

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

            <div style={{ marginTop: '8px', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '0 4px' }}>
                <Waveform size={14} color="var(--accent)" />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Modulation</span>
              </div>
              <SliderControl 
                label="Speed" 
                value={config.speed} 
                min={0.5} max={2.0} step={0.1} unit="x" 
                onChange={(v) => config.updateConfig({ speed: v })}
              />
              <SliderControl 
                label="Master Vol" 
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
                  Preview Voice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: BACKGROUND MUSIC (BGM) */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MusicNotes size={16} weight="bold" />
            <span>Background Music</span>
          </div>
          <ToggleControl
            label=""
            checked={config.bgm_enabled}
            onChange={(v) => config.updateConfig({ bgm_enabled: v })}
          />
        </div>
        
        {config.bgm_enabled && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              padding: '8px', border: '1px solid var(--border)',
              borderRadius: '6px', background: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <button
                  className="btn"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '10px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={async () => {
                    const selected = await open({
                      multiple: false,
                      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'flac'] }]
                    });
                    if (selected && typeof selected === 'string') {
                      config.updateConfig({ bgm_file: selected });
                    }
                  }}
                >
                  {config.bgm_file ? config.bgm_file.split(/[/\\]/).pop() : "Select audio file..."}
                </button>
                {config.bgm_file && (
                  <button className="btn" style={{ padding: '4px 8px', color: '#ef4444' }} onClick={() => config.updateConfig({ bgm_file: '' })}>×</button>
                )}
              </div>

              {config.bgm_file && (
                <div style={{ marginBottom: '8px' }}>
                  <audio ref={audioRef} controls style={{ width: '100%', height: '24px' }} src={convertFileSrc(config.bgm_file)} />
                </div>
              )}

              <div style={{ margin: '0 -12px' }}>
                <SliderControl
                  label="Volume"
                  value={Math.round(config.bgm_volume * 100)}
                  min={0} max={100} unit="%"
                  onChange={(v) => config.updateConfig({ bgm_volume: v / 100 })}
                />
                <SliderControl
                  label="Ducking"
                  value={Math.round(config.ducking_strength * 100)}
                  min={0} max={100} unit="%"
                  onChange={(v) => config.updateConfig({ ducking_strength: v / 100 })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
