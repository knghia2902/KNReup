import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { ToggleControl } from '../controls/ToggleControl';
import { ColorPickerControl } from '../controls/ColorPickerControl';
import { ChipGroup } from '../controls/ChipGroup';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';

import { Translate, TextT, Monitor, Eyedropper, FrameCorners } from '@phosphor-icons/react';

export function StyleTab() {
  const config = useProjectStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)' }}>
      {/* GROUP: TRANSLATION */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '12px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Translate size={16} weight="bold" />
            <span>TRANSLATION</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
        </div>
      </div>

      {/* GROUP: TYPOGRAPHY */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TextT size={16} weight="bold" />
            <span>TYPOGRAPHY</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ToggleControl 
            label="Show Subtitles" 
            checked={config.subtitle_enabled} 
            onChange={(v) => config.updateConfig({ subtitle_enabled: v })}
          />

          {config.subtitle_enabled && (
             <div style={{
               margin: '4px 12px 10px',
               padding: '12px',
               background: 'var(--bg-surface)',
               borderRadius: '6px',
               border: '1px solid var(--border)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               minHeight: '60px',
               overflow: 'hidden',
               boxShadow: 'var(--shadow-sm)'
             }}>
               <span style={{
                 fontFamily: `"${config.subtitle_font}", var(--font-sans)`,
                 fontSize: `${Math.min(config.subtitle_font_size, 32)}px`,
                 color: config.subtitle_color,
                 WebkitTextStroke: `1px ${config.subtitle_outline_color}`,
                 fontWeight: 700,
                 letterSpacing: '0.02em',
                 textShadow: `0 2px 4px rgba(0,0,0,0.3)`
               }}>
                 KNReup
               </span>
             </div>
          )}

          <SliderControl 
            label="Font Size" 
            value={config.subtitle_font_size} 
            min={10} max={100} unit="px" 
            onChange={(v) => config.updateConfig({ subtitle_font_size: v })}
          />
          <SliderControl 
            label="Vertical Pos" 
            value={config.subtitle_position} 
            min={0} max={100} unit="%"
            onChange={(v) => config.updateConfig({ subtitle_position: v })}
          />
          
          <div className="pr">
            <div className="plbl">Font Face</div>
            <div className="pc">
              <button 
                className="btn" 
                style={{
                  flex: 1, 
                  textAlign: 'left', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{config.subtitle_font}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Change</span>
              </button>
            </div>
          </div>

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

      {/* GROUP: CANVAS & RATIO */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '12px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} weight="bold" />
            <span>CANVAS</span>
          </div>
        </div>
        <SelectControl 
          label="Ratio" 
          value={config.video_ratio} 
          onChange={(v) => {
            const videoEl = document.querySelector('video');
            if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
              const vw = videoEl.videoWidth;
              const vh = videoEl.videoHeight;
              let effW = vw, effH = vh;
              if (v === '16:9') { effW = 1920; effH = 1080; }
              else if (v === '9:16') { effW = 1080; effH = 1920; }
              
              const updates: Record<string, any> = {
                video_ratio: v,
                crop_enabled: v === '9:16',
                watermark_x: Math.min(config.watermark_x, Math.max(0, effW - 50)),
                watermark_y: Math.min(config.watermark_y, Math.max(0, effH - 30)),
                image_logo_x: Math.min(config.image_logo_x, Math.max(0, effW - 50)),
                image_logo_y: Math.min(config.image_logo_y, Math.max(0, effH - 30)),
              };
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
            { value: 'original', label: 'Original' },
            { value: '16:9', label: '16:9 (Landscape)' },
            { value: '9:16', label: '9:16 (Portrait)' }
          ]} 
        />
      </div>

      {/* GROUP: OVERLAYS */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '12px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FrameCorners size={16} weight="bold" />
            <span>OVERLAYS</span>
          </div>
        </div>
        
        <div style={{ padding: '0 12px 8px', fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Drag & drop elements directly on preview to position.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 12px' }}>
            <ToggleControl 
              label="Blur Regions" 
              checked={config.blur_enabled} 
              onChange={(v) => config.updateConfig({ blur_enabled: v })}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: '0 12px' }}>
            <ToggleControl 
              label="Text Watermark" 
              checked={config.watermark_enabled} 
              onChange={(v) => config.updateConfig({ watermark_enabled: v })}
            />
            {config.watermark_enabled && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  className="pinp"
                  style={{ width: '100%' }}
                  value={config.watermark_text} 
                  onChange={(e) => config.updateConfig({ watermark_text: e.target.value })}
                  placeholder="@mychannel"
                />
                <SliderControl label="Opacity" value={Math.round(config.watermark_opacity * 100)} min={0} max={100} unit="%" onChange={(v) => config.updateConfig({ watermark_opacity: v / 100 })} />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', margin: '0 12px' }}>
            <ToggleControl 
              label="Image Logo" 
              checked={config.image_logo_enabled} 
              onChange={(v) => config.updateConfig({ image_logo_enabled: v })}
            />
            {config.image_logo_enabled && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                </div>
                <SliderControl label="Opacity" value={Math.round(config.image_logo_opacity * 100)} min={0} max={100} unit="%" onChange={(v) => config.updateConfig({ image_logo_opacity: v / 100 })} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GROUP: PRESETS */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', borderBottom: 'none', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eyedropper size={16} weight="bold" />
            <span>PRESETS</span>
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
