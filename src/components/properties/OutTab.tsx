import { SelectControl } from '../controls/SelectControl';
import { SliderControl } from '../controls/SliderControl';
import { useProjectStore } from '../../stores/useProjectStore';

interface OutTabProps {
  onRender?: () => void;
  processing?: boolean;
}

export function OutTab({ onRender, processing }: OutTabProps) {
  const config = useProjectStore();

  return (
    <>
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">Encode Config</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', padding: '0 12px 12px' }}>
          <SelectControl
            label="Container"
            value={config.container}
            onChange={(v) => config.updateConfig({ container: v as any })}
            options={[{ value: 'mp4', label: 'MP4' }, { value: 'mkv', label: 'MKV' }]}
          />
          <SelectControl
            label="Codec"
            value={config.codec}
            onChange={(v) => config.updateConfig({ codec: v as any })}
            options={[
              { value: 'h264', label: 'H.264' },
              { value: 'h265', label: 'HEVC' },
              { value: 'vp9', label: 'VP9' }
            ]}
          />
        </div>

        <SliderControl
          label="Quality (CRF)"
          value={config.crf}
          min={0} max={51} step={1}
          onChange={(v) => config.updateConfig({ crf: v })}
        />

        <div className="pr">
          <div className="plbl">CPU Preset</div>
          <div className="pc">
            <select className="psel" value={config.preset} onChange={(e) => config.updateConfig({ preset: e.target.value })}>
              <option value="ultrafast">Ultrafast (Draft)</option>
              <option value="superfast">Superfast</option>
              <option value="fast">Fast</option>
              <option value="medium">Medium (Standard)</option>
              <option value="slow">Slow (Best Quality)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ps" style={{ borderBottom: 'none', background: 'var(--bg-secondary)', paddingBottom: '24px', paddingTop: '16px' }}>
        <button
          className="btn"
          style={{
            width: 'calc(100% - 24px)', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '32px', background: 'var(--accent)', color: 'var(--bg-surface)', border: 'none', padding: '0 12px',
            fontSize: '12px', fontWeight: 700, borderRadius: '8px', boxShadow: '0 4px 12px var(--accent-glow)',
            transform: 'scale(1)', transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={onRender}
          disabled={processing}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" height="16" width="16" style={{ marginRight: '8px' }}>
            <path d="M8 2v9M4 7l4 4 4-4M2 14h12" />
          </svg>
          {processing ? 'Rendering...' : 'Start Export'}
        </button>
      </div>
    </>
  );
}
