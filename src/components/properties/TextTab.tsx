import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { ColorPickerControl } from '../controls/ColorPickerControl';
import { ChipGroup } from '../controls/ChipGroup';
import { useProjectStore } from '../../stores/useProjectStore';
import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useEffect, useRef } from 'react';
import { Translate, TextT, Eyedropper, ListBullets } from '@phosphor-icons/react';

function formatTc(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

interface TextTabProps {
  onAnalyze?: () => void;
  processing?: boolean;
}

export function TextTab({ onAnalyze, processing }: TextTabProps) {
  const config = useProjectStore();
  const { segments, updateSegment } = useSubtitleStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const segId = (e as CustomEvent).detail;
      if (!listRef.current) return;
      const el = listRef.current.querySelector(`[data-seg-id="${segId}"]`) as HTMLTextAreaElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const parent = el.closest('div[data-seg-row="true"]') as HTMLDivElement;
        if (parent) {
          parent.style.transition = 'none';
          parent.style.backgroundColor = 'var(--ac)';
          setTimeout(() => {
            parent.style.transition = 'background-color 0.5s ease';
            parent.style.backgroundColor = 'var(--bg-surface)';
          }, 100);
        }
      }
    };
    window.addEventListener('focus-subtitle-panel', handler);
    return () => window.removeEventListener('focus-subtitle-panel', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)', height: '100%' }}>
      {/* GROUP: TRANSLATION & SETTINGS */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '12px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Translate size={16} weight="bold" />
            <span>Translation</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SelectControl 
            label="Engine" 
            value={config.translation_engine} 
            onChange={(v) => config.updateConfig({ translation_engine: v })}
            options={[
              { value: 'opus', label: 'Helsinki OPUS-MT' },
              { value: 'nllb', label: 'NLLB (Meta)' },
              { value: 'argos', label: 'Argos (Offline)' },
              { value: 'ollama', label: 'Ollama' },
              { value: 'deepseek', label: 'DeepSeek' },
              { value: 'gemini', label: 'Gemini' },
              { value: 'deepl', label: 'DeepL' },
              { value: 'openai', label: 'OpenAI' },
            ]} 
          />
          <SelectControl 
            label="Analyze" 
            value={(config.asr_enabled ? 'audio' : '') + (config.ocr_enabled ? '_ocr' : '')} 
            onChange={(v) => {
              if (v === 'audio') config.updateConfig({ asr_enabled: true, ocr_enabled: false });
              if (v === '_ocr') config.updateConfig({ asr_enabled: false, ocr_enabled: true });
              if (v === 'audio_ocr') config.updateConfig({ asr_enabled: true, ocr_enabled: true });
            }}
            options={[
              { value: 'audio', label: 'Audio Only (Whisper)' },
              { value: '_ocr', label: 'Hardsub Only (OCR)' },
              { value: 'audio_ocr', label: 'Smart Merge' },
            ]} 
          />
        </div>
      </div>

      {/* GROUP: TYPOGRAPHY */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TextT size={16} weight="bold" />
            <span>Typography</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ToggleControl 
            label="Show Subtitles" 
            checked={config.subtitle_enabled} 
            onChange={(v) => config.updateConfig({ subtitle_enabled: v })}
          />

          <SliderControl 
            label="Font Size" 
            value={config.subtitle_font_size} 
            min={10} max={100} unit="px" 
            onChange={(v) => config.updateConfig({ subtitle_font_size: v })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', padding: '0 12px', marginTop: '4px' }}>
             <ColorPickerControl 
               label="Fill" 
               color={config.subtitle_color} 
               onChange={(c) => config.updateConfig({ subtitle_color: c })}
             />
             <ColorPickerControl 
               label="Outline" 
               color={config.subtitle_outline_color} 
               onChange={(c) => config.updateConfig({ subtitle_outline_color: c })}
             />
          </div>
        </div>
      </div>

      {/* GROUP: SEGMENT EDITOR */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="pshd" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListBullets size={16} weight="bold" />
            <span>Segments ({segments.length})</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="btn" 
              style={{ padding: '2px 8px', fontSize: '10px', height: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              onClick={() => useSubtitleStore.getState().autoSplitLongSegments()} 
              disabled={processing || segments.length === 0}
            >
              Split
            </button>
            <button 
              className="btn" 
              style={{ padding: '2px 8px', fontSize: '10px', height: '20px', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
              onClick={onAnalyze} 
              disabled={processing}
            >
              {processing ? '...' : 'Auto'}
            </button>
          </div>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {segments.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', opacity: 0.1, fontSize: 11 }}>
              No subtitles detected yet. Click Auto to start.
            </div>
          ) : (
            segments.map((seg, idx) => {
              const segVoiceMap = config.voice_mapping[seg.id] || {};
              const currentEngine = segVoiceMap.engine || config.tts_engine;
              const currentVoice = segVoiceMap.voice || config.voice;
              const currentSpeed = segVoiceMap.speed || config.tts_speed;

              return (
              <div key={seg.id} data-seg-row="true" style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px',
                padding: '6px 8px', display: 'flex', gap: '8px', transition: 'all 0.2s', flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-disabled)', width: '20px', textAlign: 'center' }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatTc(seg.start)} → {formatTc(seg.end)}
                      </span>
                      {seg.tts_audio_path && <span style={{ fontSize: '8px', color: 'var(--accent)' }}>TTS</span>}
                    </div>
                    <textarea
                      data-seg-id={seg.id}
                      style={{ 
                        fontSize: '11px', color: 'var(--text-primary)', background: 'transparent',
                        border: 'none', padding: 0, width: '100%', resize: 'none', outline: 'none'
                      }}
                      value={seg.translated_text}
                      onChange={(e) => updateSegment(seg.id, { translated_text: e.target.value })}
                      spellCheck={false}
                      rows={1}
                    />
                  </div>
                </div>
                
                {/* Per-segment Voice Settings */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', paddingLeft: '28px', alignItems: 'center' }}>
                  <select 
                    style={{ 
                      fontSize: '9px', padding: '2px 4px', background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', flex: 1
                    }}
                    value={`${currentEngine}:${currentVoice}`}
                    onChange={(e) => {
                      const [eng, ...vParts] = e.target.value.split(':');
                      const vce = vParts.join(':');
                      config.updateConfig({ 
                        voice_mapping: { 
                          ...config.voice_mapping, 
                          [seg.id]: { ...segVoiceMap, engine: eng, voice: vce } 
                        } 
                      });
                    }}
                  >
                    <optgroup label="Global Default">
                      <option value={`${config.tts_engine}:${config.voice}`}>Use Global ({config.voice})</option>
                    </optgroup>
                    <optgroup label="Edge TTS - Vietnamese">
                      <option value="edge_tts:vi-VN-HoaiMyNeural">Hoài My (Female)</option>
                      <option value="edge_tts:vi-VN-NamMinhNeural">Nam Minh (Male)</option>
                    </optgroup>
                    <optgroup label="ElevenLabs Voices">
                      <option value="elevenlabs:Rachel">Rachel</option>
                      <option value="elevenlabs:Drew">Drew</option>
                      <option value="elevenlabs:Clyde">Clyde</option>
                      <option value="elevenlabs:Mimi">Mimi</option>
                    </optgroup>
                    <optgroup label="OmniVoice - Standard">
                      <option value="omnivoice:default_male">Default Male</option>
                      <option value="omnivoice:default_female">Default Female</option>
                    </optgroup>
                    {(config.custom_voice_profiles || []).length > 0 && (
                      <optgroup label="OmniVoice - Custom">
                        {config.custom_voice_profiles.map(p => {
                          const vName = typeof p === 'string' ? p : p.name;
                          return <option key={vName} value={`omnivoice:${vName}`}>🎤 {vName}</option>;
                        })}
                      </optgroup>
                    )}
                  </select>
                  
                  <input 
                    type="number" 
                    step="0.1" min="0.5" max="2.0"
                    style={{ 
                      width: '40px', fontSize: '9px', padding: '2px', background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', textAlign: 'center'
                    }}
                    value={currentSpeed}
                    onChange={(e) => {
                      config.updateConfig({ 
                        voice_mapping: { 
                          ...config.voice_mapping, 
                          [seg.id]: { ...segVoiceMap, speed: parseFloat(e.target.value) || 1.0 } 
                        } 
                      });
                    }}
                    title="Speed"
                  />
                  
                  {(segVoiceMap.engine || segVoiceMap.voice || segVoiceMap.speed) && (
                    <button 
                      style={{ 
                        fontSize: '9px', padding: '2px 6px', background: 'var(--accent)', 
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Apply this segment's settings globally and clear mappings
                        config.updateConfig({
                          tts_engine: currentEngine,
                          voice: currentVoice,
                          tts_speed: currentSpeed,
                          voice_mapping: {}
                        });
                      }}
                      title="Apply to All Segments"
                    >
                      Apply All
                    </button>
                  )}
                  {segVoiceMap.voice && (
                    <button 
                      style={{ 
                        fontSize: '9px', padding: '2px 4px', background: 'transparent', 
                        color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer'
                      }}
                      onClick={() => {
                        const newMapping = { ...config.voice_mapping };
                        delete newMapping[seg.id];
                        config.updateConfig({ voice_mapping: newMapping });
                      }}
                      title="Clear Override"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
      {/* GROUP: PRESETS */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', borderBottom: 'none', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eyedropper size={16} weight="bold" />
            <span>Presets</span>
          </div>
        </div>
        <ChipGroup 
          value="Default"
          onChange={(v) => {
            if (v === 'Minimal') config.updateConfig({ subtitle_color: '#E0E0E0', subtitle_outline_color: '#333333', subtitle_font_size: 40 });
            if (v === 'Pop') config.updateConfig({ subtitle_color: '#FFD700', subtitle_outline_color: '#8B0000', subtitle_font_size: 52 });
            if (v === 'Neon') config.updateConfig({ subtitle_color: '#00FF88', subtitle_outline_color: '#003322', subtitle_font_size: 50 });
            if (v === 'Default') config.resetConfig();
          }}
          items={[
            { value: 'Default', label: 'Default' },
            { value: 'Minimal', label: 'Minimalist' },
            { value: 'Pop', label: 'Pop Art' },
            { value: 'Neon', label: 'Cyberpunk' }
          ]}
        />
      </div>
    </div>
  );
}
