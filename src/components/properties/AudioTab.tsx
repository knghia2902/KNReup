import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { usePipeline } from '../../hooks/usePipeline';
import { SpeakerHigh, Waveform, SpeakerLow, ArrowSquareOut, MusicNotes, Microphone } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef } from 'react';
import { sidecar } from '../../lib/sidecar';
import { AudioMixer } from '../../lib/audioMixer';

export function AudioTab() {
  const config = useProjectStore();
  const segments = useSubtitleStore((s) => s.segments);
  const updateSegment = useSubtitleStore((s) => s.updateSegment);
  const { generateVoice, processing: ttsProcessing, progress: ttsProgress } = usePipeline();

  // Compute TTS stats
  const generatedCount = useMemo(() => segments.filter((s) => s.tts_status === 'generated').length, [segments]);
  const allGenerated = segments.length > 0 && generatedCount === segments.length;

  // Get projectId from store
  const getProjectId = () => {
    return useProjectStore.getState().currentProjectId || 'default';
  };

  // Watch SSE progress for per-segment updates
  const lastSegResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ttsProgress?.segment_result) return;
    const sr = ttsProgress.segment_result;
    const key = `${sr.seg_id}_${sr.filename}`;
    if (key === lastSegResultRef.current) return;
    lastSegResultRef.current = key;
    updateSegment(sr.seg_id, {
      tts_status: 'generated',
      tts_audio_path: sr.filename,
    });
  }, [ttsProgress, updateSegment]);

  // Handle Generate All Voice
  const handleGenerateAll = async () => {
    const projectId = getProjectId();
    try {
      const result = await generateVoice(projectId, segments, {
        tts_engine: config.tts_engine,
        voice: config.voice,
        speed: config.tts_speed,
        pitch: config.pitch,
        volume: config.volume,
        duration: 0,
      });

      // Update dubbed_audio_path when batch is done
      if (result?.dubbed_audio_path) {
        useProjectStore.getState().updateConfig({
          dubbed_audio_path: result.dubbed_audio_path,
          tts_generated_at: Date.now(),
        });
      }
    } catch (err) {
      console.error('Generate Voice failed:', err);
    }
  };

  // Sync store volumes → AudioMixer GainNodes
  useEffect(() => {
    AudioMixer.setOriginalVolume(
      config.audio_mix_mode === 'mix' ? config.original_volume : 0
    );
    AudioMixer.setTTSVolume(config.volume);
    AudioMixer.setBGMVolume(config.audio_volume);
  }, [config.original_volume, config.volume, config.audio_volume, config.audio_mix_mode]);

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



            {/* Voice Selector */}
            <div className="pr" style={{ marginTop: '4px' }}>
              <div className="plbl">Voice</div>
              <div className="pc">
                <select 
                  className="psel" 
                  value={config.voice}
                  onChange={(e) => config.updateConfig({ voice: e.target.value })}
                >
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

      {/* SECTION: GENERATE VOICE */}
      {config.dubbing_enabled && segments.length > 0 && (
        <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
          <div className="pshd">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Microphone size={16} weight="bold" />
              <span>Generate Voice</span>
            </div>
          </div>

          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Progress Bar */}
            {ttsProcessing && ttsProgress && ttsProgress.stage === 'tts-batch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{ttsProgress.message}</div>
                <div style={{
                  width: '100%', height: '4px', background: 'var(--border-subtle)',
                  borderRadius: '2px', overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${ttsProgress.progress}%`, height: '100%',
                    background: 'var(--accent)', transition: 'width 0.3s ease',
                    borderRadius: '2px'
                  }} />
                </div>
              </div>
            )}

            {/* Status */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '11px', color: 'var(--text-secondary)'
            }}>
              <span>
                {allGenerated ? '✓ All segments ready' : `${generatedCount}/${segments.length} segments generated`}
              </span>
              {config.dubbed_audio_path && (
                <span style={{ fontSize: '9px', color: 'var(--accent)' }}>Pre-generated ✓</span>
              )}
            </div>

            {/* Generate Button */}
            <button
              className="btn"
              disabled={ttsProcessing}
              onClick={handleGenerateAll}
              style={{
                width: '100%', height: '32px', display: 'flex',
                justifyContent: 'center', alignItems: 'center', gap: '6px',
                background: ttsProcessing ? 'var(--bg-surface)' : allGenerated ? 'var(--bg-surface)' : 'var(--accent)',
                color: ttsProcessing ? 'var(--text-muted)' : allGenerated ? 'var(--accent)' : '#fff',
                border: allGenerated ? '1px solid var(--accent)' : 'none',
                borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                cursor: ttsProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {ttsProcessing ? (
                <>⏳ Generating...</>
              ) : allGenerated ? (
                <>🔄 Re-generate All</>
              ) : (
                <>🎙️ Generate All Voice</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SECTION: BACKGROUND MUSIC */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MusicNotes size={16} weight="bold" />
            <span>Background Music</span>
          </div>
          <ToggleControl 
            label="" 
            checked={config.audio_enabled} 
            onChange={(v) => config.updateConfig({ audio_enabled: v })}
          />
        </div>
        
        {config.audio_enabled && config.audio_file && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SliderControl
              label="BGM Volume"
              value={Math.round(config.audio_volume * 100)}
              min={0} max={100} unit="%"
              onChange={(v) => config.updateConfig({ audio_volume: v / 100 })}
            />
            <SliderControl
              label="Ducking"
              value={Math.round(config.ducking_strength * 100)}
              min={0} max={100} unit="%"
              onChange={(v) => config.updateConfig({ ducking_strength: v / 100 })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
