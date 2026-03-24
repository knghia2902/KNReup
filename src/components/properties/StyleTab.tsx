import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { ColorPickerControl } from '../controls/ColorPickerControl';
import { ChipGroup } from '../controls/ChipGroup';

export function StyleTab() {
  return (
    <>
      <div className="ps">
        <div className="pshd">Translation</div>
        <SelectControl 
          label="Source" 
          value="en" 
          options={[{ value: 'en', label: 'English (US)' }, { value: 'auto', label: 'Auto Detect' }]} 
        />
        <SelectControl 
          label="Target" 
          value="vi" 
          options={[{ value: 'vi', label: 'Tiếng Việt' }]} 
        />
        <ChipGroup 
          value="vlog"
          items={[
            { value: 'vlog', label: 'Vlog' },
            { value: 'cinema', label: 'Cinema' },
            { value: 'lite', label: 'Literal' }
          ]}
        />
      </div>

      <div className="ps">
        <div className="pshd">Subtitle Render</div>
        <ToggleControl label="Canvas" checked={true} />
        <SliderControl label="Font Size" value={48} min={10} max={100} unit="px" />
        <SliderControl label="Pos Y" value={90} min={10} max={100} unit="%" />
        
        <div className="pr">
          <div className="plbl">Font Face</div>
          <div className="pc">
            <button className="btn" style={{flex: 1, textAlign: 'left'}}>Geist Medium</button>
          </div>
        </div>

        <ColorPickerControl label="Text Color" color="#f1f5f9" />
        <ColorPickerControl label="Outline" color="#0f172a" />
      </div>

      <div className="ps">
        <div className="pshd">Layout</div>
        <ChipGroup 
          value="16:9"
          items={[
            { value: 'original', label: 'Original' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' }
          ]}
        />
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <div className="pshd">Presets</div>
        <ChipGroup 
          value="None"
          items={[
            { value: 'Minimal', label: 'Minimalist' },
            { value: 'Pop', label: 'Pop Art' },
            { value: 'Neon', label: 'Cyberpunk' }
          ]}
        />
      </div>
    </>
  );
}
