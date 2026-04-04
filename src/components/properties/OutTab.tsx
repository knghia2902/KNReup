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
      <div className="ps">
        <div className="pshd">Format</div>
        <SelectControl 
          label="Container" 
          value={config.container} 
          onChange={(v) => config.updateConfig({ container: v as any })}
          options={[{ value: 'mp4', label: 'MP4 (Web)' }, { value: 'mkv', label: 'MKV (Arch)' }]} 
        />
        <SelectControl 
          label="Codec" 
          value={config.codec} 
          onChange={(v) => config.updateConfig({ codec: v as any })}
          options={[
            { value: 'h264', label: 'H.264 (Nvidia NVENC)' },
            { value: 'h265', label: 'H.265 (HEVC)' },
            { value: 'vp9', label: 'VP9' }
          ]} 
        />
        <SliderControl 
          label="CRF" 
          value={config.crf} 
          min={0} max={51} step={1} 
          onChange={(v) => config.updateConfig({ crf: v })}
        />
        
        <div className="pr">
          <div className="plbl">Preset</div>
          <div className="pc">
            <select className="psel" value={config.preset} onChange={(e) => config.updateConfig({ preset: e.target.value })}>
              <option value="ultrafast">ultrafast</option>
              <option value="superfast">superfast</option>
              <option value="fast">fast</option>
              <option value="medium">medium</option>
              <option value="slow">slow</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ps">
        <div className="pshd">Audio Mix</div>
        <ToggleControl 
          label="Keep Orig" 
          checked={config.audio_mix_mode === 'mix'} 
          onChange={(v) => config.updateConfig({ audio_mix_mode: v ? 'mix' : 'replace' })}
        />
        <SliderControl 
          label="Orig Vol" 
          value={Math.round(config.original_volume * 100)} 
          min={0} max={100} unit="%" 
          onChange={(v) => config.updateConfig({ original_volume: v / 100 })}
        />
        <SliderControl 
          label="TTS Vol" 
          value={Math.round(config.volume * 100)} 
          min={0} max={200} unit="%" 
          onChange={(v) => config.updateConfig({ volume: v / 100 })}
        />
        <div style={{ padding: '12px 0 0 0', marginTop: '12px', borderTop: '1px solid var(--c-bg3)', pointerEvents: 'auto' }}>
          <ToggleControl 
            label="Enable custom BGM" 
            checked={config.bgm_enabled} 
            onChange={(v) => config.updateConfig({ bgm_enabled: v })}
          />
          {config.bgm_enabled && (
            <>
              <div className="pr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div className="plbl" style={{ width: '100%' }}>BGM File</div>
                <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
                  <button 
                    className="btn" 
                    style={{ flex: 1, padding: '4px 8px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                    <button className="btn" style={{ padding: '4px 8px' }} onClick={() => config.updateConfig({ bgm_file: '' })}>×</button>
                  )}
                </div>
                {config.bgm_file && (
                  <audio ref={audioRef} controls style={{ width: '100%', height: '32px', marginTop: '4px' }} src={convertFileSrc(config.bgm_file)} />
                )}
              </div>
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
            </>
          )}
        </div>
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <button 
          className="expbtn" 
          style={{ width: 'calc(100% - 24px)' }}
          onClick={onRender}
          disabled={processing}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v9M4 7l4 4 4-4M2 14h12"/>
          </svg>
          Add to Queue
        </button>
      </div>
    </>
  );
}
