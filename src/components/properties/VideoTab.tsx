import { SelectControl } from '../controls/SelectControl';
import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';
import { open } from '@tauri-apps/plugin-dialog';
import { Monitor, FrameCorners } from '@phosphor-icons/react';

export function VideoTab() {
  const config = useProjectStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)' }}>
      {/* GROUP: CANVAS & RATIO */}
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '12px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} weight="bold" />
            <span>Canvas</span>
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
            <span>Overlays</span>
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
    </div>
  );
}
