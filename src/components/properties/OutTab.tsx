import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePipeline } from '../../hooks/usePipeline';

export function OutTab() {
  const config = useProjectStore();
  const { processing } = usePipeline();

  return (
    <>
      <div className="ps">
        <div className="pshd">Format</div>
        <SelectControl 
          label="Container" 
          value="mp4" 
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
          <div className="plbl">Presst</div>
          <div className="pc">
            <select className="psel">
              <option>fast</option>
              <option>medium</option>
              <option>slow</option>
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
          label="BGM Vol" 
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
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <button className="expbtn" style={{ width: 'calc(100% - 24px)', opacity: processing ? 0.5 : 1 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v9M4 7l4 4 4-4M2 14h12"/>
          </svg>
          {processing ? 'Processing...' : 'Render Output'}
        </button>
      </div>
    </>
  );
}
