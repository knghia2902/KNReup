import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { ColorPickerControl } from '../controls/ColorPickerControl';
import { ChipGroup } from '../controls/ChipGroup';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

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
            { value: 'opus', label: 'Helsinki OPUS-MT (Siêu nhẹ & Nhanh)' },
            { value: 'nllb', label: 'NLLB (Nặng & Đa Ngữ)' },
            { value: 'argos', label: 'Argos (Offline Local)' },
            { value: 'ollama', label: 'Ollama (Offline Model)' },
            { value: 'deepseek', label: 'DeepSeek (API)' },
            { value: 'gemini', label: 'Gemini (API)' },
            { value: 'deepl', label: 'DeepL (API)' },
            { value: 'openai', label: 'OpenAI / 9Router (API)' },
          ]} 
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
          onChange={(v) => {
            // Tính effectiveDimensions mới để clamp overlay positions (chuẩn hóa tỷ lệ)
            const videoEl = document.querySelector('video');
            if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
              const vw = videoEl.videoWidth;
              const vh = videoEl.videoHeight;
              let effW = vw, effH = vh;
              if (v === '16:9') { effW = 1920; effH = 1080; }
              else if (v === '9:16') { effW = 1080; effH = 1920; }
              
              // Clamp all overlay positions
              const updates: Record<string, any> = {
                video_ratio: v,
                crop_enabled: v === '9:16',
                watermark_x: Math.min(config.watermark_x, Math.max(0, effW - 50)),
                watermark_y: Math.min(config.watermark_y, Math.max(0, effH - 30)),
                image_logo_x: Math.min(config.image_logo_x, Math.max(0, effW - 50)),
                image_logo_y: Math.min(config.image_logo_y, Math.max(0, effH - 30)),
              };
              // Clamp blur region
              if (config.blur_enabled) {
                updates.blur_x = Math.min(config.blur_x, Math.max(0, effW - config.blur_w));
                updates.blur_y = Math.min(config.blur_y, Math.max(0, effH - config.blur_h));
              }
              config.updateConfig(updates);
            } else {
              config.updateConfig({ video_ratio: v as any, crop_enabled: v === '9:16' });
            }
          }}
          options={[
            { value: 'original', label: 'original · keep' },
            { value: '16:9', label: '16:9 · landscape' },
            { value: '9:16', label: '9:16 · portrait' }
          ]} 
        />
      </div>

      <div className="ps">
        <div className="pshd">Blur regions</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingBottom: '8px' }}>🖱️ Kéo thả khung Blur trực tiếp trên Video Preview</div>
        <ToggleControl 
          label="Enable Blur" 
          checked={config.blur_enabled} 
          onChange={(v) => config.updateConfig({ blur_enabled: v })}
        />
        {/* Sliders (X, Y, Width, Height) for Blur are removed because they are now controlled via direct drag & drop on the Video Preview */}
      </div>

      <div className="ps">
        <div className="pshd">Text Logo</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingBottom: '8px' }}>🖱️ Kéo thả trực tiếp trên Video Preview</div>
        <ToggleControl 
          label="Enable" 
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
            {/* Position sliders removed, handled by drag & drop on Video Preview */}
            <SliderControl label="Opacity" value={Math.round(config.watermark_opacity * 100)} min={0} max={100} unit="%" onChange={(v) => config.updateConfig({ watermark_opacity: v / 100 })} />
          </div>
        )}
      </div>

      <div className="ps">
        <div className="pshd">Image Logo</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingBottom: '8px' }}>🖱️ Kéo thả trực tiếp trên Video Preview</div>
        <ToggleControl 
          label="Enable" 
          checked={config.image_logo_enabled} 
          onChange={(v) => config.updateConfig({ image_logo_enabled: v })}
        />
        {config.image_logo_enabled && (
          <div style={{ marginTop: '8px' }}>
            <div className="pr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
              <div className="plbl" style={{ width: '100%' }}>Image File</div>
              <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
                <button 
                  className="btn" 
                  style={{ flex: 1, padding: '4px 8px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={async () => {
                    const selected = await open({
                      multiple: false,
                      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'] }]
                    });
                    if (selected && typeof selected === 'string') {
                      config.updateConfig({ image_logo_file: selected });
                    }
                  }}
                >
                  {config.image_logo_file ? config.image_logo_file.split(/[/\\]/).pop() : "Select image..."}
                </button>
                {config.image_logo_file && (
                  <button className="btn" style={{ padding: '4px 8px' }} onClick={() => config.updateConfig({ image_logo_file: '' })}>×</button>
                )}
              </div>
              {config.image_logo_file && (
                <img 
                  src={convertFileSrc(config.image_logo_file)} 
                  alt="logo preview" 
                  style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain', marginTop: 4, borderRadius: 4, border: '1px solid var(--c-bg3)' }} 
                />
              )}
            </div>
            {/* Position sliders removed, handled by drag & drop on Video Preview */}
            <SliderControl label="Opacity" value={Math.round(config.image_logo_opacity * 100)} min={0} max={100} unit="%" onChange={(v) => config.updateConfig({ image_logo_opacity: v / 100 })} />
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
