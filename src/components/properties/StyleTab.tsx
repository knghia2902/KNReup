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
        <SelectControl 
          label="Engine" 
          value={config.translation_engine} 
          onChange={(v) => config.updateConfig({ translation_engine: v })}
          options={[
            { value: 'argos', label: 'Argos (Offline)' },
            { value: 'nllb', label: 'NLLB (Offline)' },
            { value: 'deepseek', label: 'DeepSeek (API)' },
            { value: 'gemini', label: 'Gemini (API)' },
            { value: 'deepl', label: 'DeepL (API)' },
            { value: 'ollama', label: 'Ollama (Local)' },
          ]} 
        />
        {config.translation_engine === 'gemini' && (
          <div className="pr"><div className="plbl" style={{flex: 0.3}}>API Key</div><input type="text" className="pinput" value={config.gemini_api_key} onChange={e => config.updateConfig({gemini_api_key: e.target.value})} placeholder="AIza..." style={{flex: 0.7, padding: '2px 6px', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 4, color: 'var(--fg)', fontSize: 11}}/></div>
        )}
        {config.translation_engine === 'deepl' && (
          <div className="pr"><div className="plbl" style={{flex: 0.3}}>API Key</div><input type="text" className="pinput" value={config.deepl_api_key} onChange={e => config.updateConfig({deepl_api_key: e.target.value})} placeholder="DeepL Auth Key" style={{flex: 0.7, padding: '2px 6px', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 4, color: 'var(--fg)', fontSize: 11}}/></div>
        )}
        {config.translation_engine === 'deepseek' && (
          <div className="pr"><div className="plbl" style={{flex: 0.3}}>API Key</div><input type="text" className="pinput" value={config.deepseek_api_key} onChange={e => config.updateConfig({deepseek_api_key: e.target.value})} placeholder="sk-..." style={{flex: 0.7, padding: '2px 6px', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 4, color: 'var(--fg)', fontSize: 11}}/></div>
        )}
        {config.translation_engine === 'ollama' && (
          <div className="pr"><div className="plbl" style={{flex: 0.3}}>URL</div><input type="text" className="pinput" value={config.ollama_url} onChange={e => config.updateConfig({ollama_url: e.target.value})} placeholder="http://localhost:11434" style={{flex: 0.7, padding: '2px 6px', background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 4, color: 'var(--fg)', fontSize: 11}}/></div>
        )}
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
          min={0} max={100} unit="%"
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
        <div className="pshd">Video ratio</div>
        <SelectControl 
          label="Ratio" 
          value={config.video_ratio} 
          onChange={(v) => config.updateConfig({ video_ratio: v as any, crop_enabled: v === '9:16' })}
          options={[
            { value: 'original', label: 'original · keep' },
            { value: '16:9', label: '16:9 · landscape' },
            { value: '9:16', label: '9:16 · portrait' }
          ]} 
        />
      </div>

      <div className="ps">
        <div className="pshd">Blur regions</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingBottom: '8px' }}>Draw on the preview to mark regions</div>
        <ToggleControl 
          label="Enable Blur" 
          checked={config.blur_enabled} 
          onChange={(v) => config.updateConfig({ blur_enabled: v })}
        />
        {config.blur_enabled && (
          <div style={{ marginTop: '8px' }}>
            <SliderControl label="X Pos" value={Math.round(config.blur_x)} min={0} max={1920} onChange={(v) => config.updateConfig({ blur_x: v })} />
            <SliderControl label="Y Pos" value={Math.round(config.blur_y)} min={0} max={1080} onChange={(v) => config.updateConfig({ blur_y: v })} />
            <SliderControl label="Width" value={Math.round(config.blur_w)} min={10} max={1920} onChange={(v) => config.updateConfig({ blur_w: v })} />
            <SliderControl label="Height" value={Math.round(config.blur_h)} min={10} max={1080} onChange={(v) => config.updateConfig({ blur_h: v })} />
          </div>
        )}
      </div>

      <div className="ps">
        <div className="pshd">Logo & watermark</div>
        <ToggleControl 
          label="TEXT LOGO" 
          checked={config.watermark_enabled} 
          onChange={(v) => config.updateConfig({ watermark_enabled: v })}
        />
        {config.watermark_enabled && (
          <div style={{ marginTop: '8px' }}>
            <div className="pr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
              <div className="plbl" style={{ width: '100%' }}>Text</div>
              <input 
                type="text" 
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--c-bg2)', border: '1px solid var(--c-bg3)', color: 'white', padding: '4px 8px', borderRadius: '4px', pointerEvents: 'auto' }}
                value={config.watermark_text} 
                onChange={(e) => config.updateConfig({ watermark_text: e.target.value })}
                placeholder="@mychannel"
              />
            </div>
            <SliderControl label="X Pos" value={config.watermark_x} min={0} max={1920} onChange={(v) => config.updateConfig({ watermark_x: v })} />
            <SliderControl label="Y Pos" value={config.watermark_y} min={0} max={1080} onChange={(v) => config.updateConfig({ watermark_y: v })} />
            <SliderControl label="Opacity" value={Math.round(config.watermark_opacity * 100)} min={0} max={100} unit="%" onChange={(v) => config.updateConfig({ watermark_opacity: v / 100 })} />
          </div>
        )}
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
