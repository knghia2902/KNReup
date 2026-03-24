import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { ColorPickerControl } from '../controls/ColorPickerControl';
import { ChipGroup } from '../controls/ChipGroup';
import { useProjectStore } from '../../stores/useProjectStore';

export function StyleTab() {
  const config = useProjectStore();

  return (
    <>
      <div className="ps">
        <div className="pshd">Translation</div>
        <SelectControl 
          label="Source" 
          value={config.language} 
          onChange={(v) => config.updateConfig({ language: v })}
          options={[
            { value: 'auto', label: 'Auto Detect' },
            { value: 'en', label: 'English (US)' },
            { value: 'zh', label: '中文' },
            { value: 'ja', label: '日本語' },
            { value: 'ko', label: '한국어' },
            { value: 'fr', label: 'Français' },
          ]} 
        />
        <SelectControl 
          label="Target" 
          value="vi" 
          options={[{ value: 'vi', label: 'Tiếng Việt' }]} 
        />
        <ChipGroup 
          value={config.translation_style}
          onChange={(v) => config.updateConfig({ translation_style: v })}
          items={[
            { value: 'default', label: 'Default' },
            { value: 'vlog', label: 'Vlog' },
            { value: 'cinema', label: 'Cinema' },
            { value: 'science', label: 'Science' }
          ]}
        />
      </div>

      <div className="ps">
        <div className="pshd">Subtitle Render</div>
        <ToggleControl 
          label="Canvas (On/Off)" 
          checked={config.subtitle_enabled} 
          onChange={(v) => config.updateConfig({ subtitle_enabled: v })}
        />
        <SliderControl 
          label="Size" 
          value={config.subtitle_font_size} 
          min={10} max={100} unit="px" 
          onChange={(v) => config.updateConfig({ subtitle_font_size: v })}
        />
        <SliderControl 
          label="Pos Y" 
          value={config.subtitle_position} 
          min={1} max={5} 
          onChange={(v) => config.updateConfig({ subtitle_position: v })}
        />
        
        <div className="pr">
          <div className="plbl">Font Face</div>
          <div className="pc">
            <button className="btn" style={{flex: 1, textAlign: 'left'}}>{config.subtitle_font}</button>
          </div>
        </div>

        <ColorPickerControl 
          label="Color" 
          color={config.subtitle_color} 
          onChange={(c) => config.updateConfig({ subtitle_color: c })}
        />
        <ColorPickerControl 
          label="Outline" 
          color={config.subtitle_outline_color} 
          onChange={(c) => config.updateConfig({ subtitle_outline_color: c })}
        />
      </div>

      <div className="ps">
        <div className="pshd">Layout</div>
        <ChipGroup 
          value={config.video_ratio}
          onChange={(v) => config.updateConfig({ video_ratio: v as any })}
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
    </>
  );
}
