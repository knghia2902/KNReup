import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { SpeakerHigh, Waveform, SpeakerLow, UploadSimple, Microphone } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { sidecar } from '../../lib/sidecar';

export function AudioTab() {
  const config = useProjectStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  // OmniVoice Cloning State
  const [refAudioFile, setRefAudioFile] = useState<File | null>(null);
  const [tempAudioPath, setTempAudioPath] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [cloningStatus, setCloningStatus] = useState<string>('');

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = config.audio_volume;
    }
  }, [config.audio_volume]);

  // Load custom profiles on mount and window focus
  const loadProfiles = () => {
    sidecar.getProfiles().then(res => {
      if (res.profiles) {
        useProjectStore.setState({ custom_voice_profiles: res.profiles });
      }
    }).catch(e => console.error("Failed to load profiles", e));
  };

  useEffect(() => {
    loadProfiles();
    window.addEventListener('focus', loadProfiles);
    return () => window.removeEventListener('focus', loadProfiles);
  }, []);

  const handleUploadReference = async () => {
    if (!refAudioFile) return;
    try {
      setCloningStatus('Uploading...');
      const res = await sidecar.uploadReferenceAudio(refAudioFile);
      setTempAudioPath(res.temp_path);
      setCloningStatus('Uploaded successfully. Ready to save.');
    } catch (e: any) {
      setCloningStatus(`Error: ${e.message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!tempAudioPath || !profileName) return;
    try {
      setCloningStatus('Saving profile...');
      await sidecar.saveProfile(profileName, tempAudioPath);
      setCloningStatus('Profile saved successfully!');
      
      // Refresh profiles
      const res = await sidecar.getProfiles();
      if (res.profiles) {
        useProjectStore.setState({ custom_voice_profiles: res.profiles });
        config.updateConfig({ voice: profileName });
      }
      
      setRefAudioFile(null);
      setTempAudioPath(null);
      setProfileName('');
    } catch (e: any) {
      setCloningStatus(`Error: ${e.message}`);
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
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
                  background: config.tts_engine === 'omnivoice' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  borderColor: config.tts_engine === 'omnivoice' ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
                onClick={() => config.updateConfig({ tts_engine: 'omnivoice' })}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>OmniVoice</div>
                <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 500 }}>Local · Clone</div>
              </div>
              <div 
                style={{
                  padding: '8px', border: '1px solid var(--border)', borderRadius: '6px',
                  background: config.tts_engine === 'elevenlabs' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  borderColor: config.tts_engine === 'elevenlabs' ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}
                onClick={() => config.updateConfig({ tts_engine: 'elevenlabs' })}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>ElevenLabs</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Online · Premium</div>
              </div>
            </div>

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

            <div className="pr" style={{ marginTop: '4px' }}>
              <div className="plbl">Voice</div>
              <div className="pc">
                <select 
                  className="psel" 
                  value={config.voice}
                  onChange={(e) => {
                    const val = e.target.value;
                    config.updateConfig({ voice: val });
                  }}
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

            {config.tts_engine === 'omnivoice' && (
              <div style={{ marginTop: '8px', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Microphone size={14} color="var(--accent)" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>Voice Cloning</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="file" 
                      accept="audio/*"
                      id="ref-audio-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRefAudioFile(e.target.files[0]);
                          setTempAudioPath(null);
                        }
                      }}
                    />
                    <label 
                      htmlFor="ref-audio-upload"
                      className="btn"
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '11px', height: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <UploadSimple size={14} />
                      {refAudioFile ? refAudioFile.name : 'Select Reference Audio'}
                    </label>
                    <button 
                      className="btn"
                      style={{ background: 'var(--accent)', color: 'white', border: 'none', height: '28px', fontSize: '11px', padding: '0 12px' }}
                      onClick={handleUploadReference}
                      disabled={!refAudioFile || !!tempAudioPath}
                    >
                      Preprocess
                    </button>
                  </div>
                  
                  {tempAudioPath && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="text" 
                        className="inp" 
                        placeholder="New Profile Name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button 
                        className="btn"
                        style={{ background: 'var(--accent)', color: 'white', border: 'none', height: '28px', fontSize: '11px', padding: '0 12px' }}
                        onClick={handleSaveProfile}
                        disabled={!profileName}
                      >
                        Save Profile
                      </button>
                    </div>
                  )}

                  {cloningStatus && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {cloningStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

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
