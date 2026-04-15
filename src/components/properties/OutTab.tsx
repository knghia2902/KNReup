import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useEffect, useRef } from 'react';

interface OutTabProps {
  onRender?: () => void;
  processing?: boolean;
}

export function OutTab({ onRender, processing }: OutTabProps) {
  const config = useProjectStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = config.bgm_volume;
    }
  }, [config.bgm_volume]);

  return (
    <>
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">ENCODE CONFIG</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', padding: '0 12px 12px' }}>
          <SelectControl
            label="Container"
            value={config.container}
            onChange={(v) => config.updateConfig({ container: v as any })}
            options={[{ value: 'mp4', label: 'MP4' }, { value: 'mkv', label: 'MKV' }]}
          />
          <SelectControl
            label="Codec"
            value={config.codec}
            onChange={(v) => config.updateConfig({ codec: v as any })}
            options={[
              { value: 'h264', label: 'H.264' },
              { value: 'h265', label: 'HEVC' },
              { value: 'vp9', label: 'VP9' }
            ]}
          />
        </div>

        <SliderControl
          label="Quality (CRF)"
          value={config.crf}
          min={0} max={51} step={1}
          onChange={(v) => config.updateConfig({ crf: v })}
        />

        <div className="pr">
          <div className="plbl">CPU Preset</div>
          <div className="pc">
            <select className="psel" value={config.preset} onChange={(e) => config.updateConfig({ preset: e.target.value })}>
              <option value="ultrafast">Ultrafast (Draft)</option>
              <option value="superfast">Superfast</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium (Standard)</option>
              <option value="slow">Slow (Best Quality)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">AUDIO MASTERING</div>
        <ToggleControl
          label="Keep Original Audio"
          checked={config.audio_mix_mode === 'mix'}
          onChange={(v) => config.updateConfig({ audio_mix_mode: v ? 'mix' : 'replace' })}
        />
        {config.audio_mix_mode === 'mix' && (
          <SliderControl
            label="Orig Vol"
            value={Math.round(config.original_volume * 100)}
            min={0} max={100} unit="%"
            onChange={(v) => config.updateConfig({ original_volume: v / 100 })}
          />
        )}
        <SliderControl
          label="TTS Master Vol"
          value={Math.round(config.volume * 100)}
          min={0} max={200} unit="%"
          onChange={(v) => config.updateConfig({ volume: v / 100 })}
        />

        <div style={{ padding: '12px 12px 0', marginTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <ToggleControl
            label="Background Music (BGM)"
            checked={config.bgm_enabled}
            onChange={(v) => config.updateConfig({ bgm_enabled: v })}
          />
          {config.bgm_enabled && (
            <div style={{
              marginTop: '8px', padding: '8px', border: '1px solid var(--border)',
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
                  label="BGM Vol"
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
          )}
        </div>
      </div>

      <div className="ps" style={{ borderBottom: 'none', background: 'var(--bg-secondary)', paddingBottom: '24px', paddingTop: '16px' }}>
        <button
          className="btn"
          style={{
            width: 'calc(100% - 24px)', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '32px', background: 'var(--accent)', color: 'var(--bg-surface)', border: 'none', padding: '0 12px',
            fontSize: '12px', fontWeight: 700, borderRadius: '8px', boxShadow: '0 4px 12px var(--accent-glow)',
            transform: 'scale(1)', transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={onRender}
          disabled={processing}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" height="16" width="16" style={{ marginRight: '8px' }}>
            <path d="M8 2v9M4 7l4 4 4-4M2 14h12" />
          </svg>
          {processing ? 'RENDERING...' : 'START EXPORT'}
        </button>
      </div>
    </>
  );
}
