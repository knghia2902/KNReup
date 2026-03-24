import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';

export function OutTab() {
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
          value="h264" 
          options={[
            { value: 'h264', label: 'H.264 (Nvidia NVENC)' },
            { value: 'hevc', label: 'H.265 (HEVC)' },
            { value: 'vp9', label: 'VP9' }
          ]} 
        />
        <SliderControl label="CRF" value={23} min={0} max={51} step={1} />
        
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
        <ToggleControl label="Keep Orig" checked={true} />
        <SliderControl label="BGM Vol" value={10} min={0} max={100} unit="%" />
        <SliderControl label="TTS Vol" value={100} min={0} max={100} unit="%" />
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <button className="expbtn" style={{ width: 'calc(100% - 24px)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v9M4 7l4 4 4-4M2 14h12"/>
          </svg>
          Render Output
        </button>
      </div>
    </>
  );
}
