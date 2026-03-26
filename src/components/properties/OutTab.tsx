import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { useProjectStore } from '../../stores/useProjectStore';

interface OutTabProps {
  onRender?: () => void;
  processing?: boolean;
}

export function OutTab({ onRender, processing }: OutTabProps) {
  const config = useProjectStore();

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
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <ToggleControl 
            label="Enable custom BGM" 
            checked={config.bgm_enabled} 
            onChange={(v) => config.updateConfig({ bgm_enabled: v })}
          />
          {config.bgm_enabled && (
            <>
              <div className="pr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div className="plbl" style={{ width: '100%' }}>BGM File (Absolute Path)</div>
                <input 
                  type="text" 
                  className="psel" 
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--c-bg2)', border: '1px solid var(--c-bg3)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}
                  value={config.bgm_file} 
                  onChange={(e) => config.updateConfig({ bgm_file: e.target.value })}
                  placeholder="e.g. C:/music/bgm.mp3"
                />
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

      <div className="ps">
        <div className="pshd">Video Effects</div>
        <ToggleControl 
          label="Smart Crop (9:16)" 
          checked={config.crop_enabled} 
          onChange={(v) => config.updateConfig({ crop_enabled: v, video_ratio: v ? '9:16' : 'original' })}
        />
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <ToggleControl 
            label="Enable Blur" 
            checked={config.blur_enabled} 
            onChange={(v) => config.updateConfig({ blur_enabled: v })}
          />
          {config.blur_enabled && (
            <div style={{ padding: '8px 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              (Adjust blur box in Preview)
            </div>
          )}
        </div>
      </div>

      <div className="ps">
        <div className="pshd">Watermark</div>
        <ToggleControl 
          label="Enable Watermark" 
          checked={config.watermark_enabled} 
          onChange={(v) => config.updateConfig({ watermark_enabled: v })}
        />
        {config.watermark_enabled && (
          <>
            <div className="pr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '8px' }}>
              <div className="plbl" style={{ width: '100%' }}>Text</div>
              <input 
                type="text" 
                className="psel" 
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--c-bg2)', border: '1px solid var(--c-bg3)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}
                value={config.watermark_text} 
                onChange={(e) => config.updateConfig({ watermark_text: e.target.value })}
                placeholder="Your Watermark"
              />
            </div>
            <SliderControl 
              label="Opacity" 
              value={Math.round(config.watermark_opacity * 100)} 
              min={0} max={100} unit="%" 
              onChange={(v) => config.updateConfig({ watermark_opacity: v / 100 })}
            />
          </>
        )}
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <button 
          className="expbtn" 
          style={{ width: 'calc(100% - 24px)' }}
          onClick={onRender}
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
