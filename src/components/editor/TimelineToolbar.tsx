import { memo } from 'react';
import { Scissors, ArrowLineLeft, ArrowLineRight, Trash, MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut } from '@phosphor-icons/react';

interface TimelineToolbarProps {
  onSplit: () => void;
  onSplitLeft: () => void;
  onSplitRight: () => void;
  onResetDuration: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  zoom: number;
  minZoom: number;
  onZoomChange: (zoom: number) => void;
  canSplit: boolean;
  canDelete: boolean;
  canResetDuration: boolean;
}

export const TimelineToolbar = memo(({
  onSplit,
  onSplitLeft,
  onSplitRight,
  onResetDuration,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitToView,
  zoom,
  minZoom,
  onZoomChange,
  canSplit,
  canDelete,
  canResetDuration,
}: TimelineToolbarProps) => {
  return (
    <div className="tlhd" style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
      
      {/* TOOLBAR: LEFT GROUP */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center', background: 'var(--bg-primary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
        <button className="tlb-split" onClick={onSplit} title="Split (Ctrl+B)" disabled={!canSplit}>
          <Scissors size={16} weight="regular" />
        </button>
        <button className="tlb-split" onClick={onSplitLeft} title="Split Left (Q)" disabled={!canSplit}>
          <ArrowLineLeft size={16} weight="regular" />
        </button>
        <button className="tlb-split" onClick={onSplitRight} title="Split Right (W)" disabled={!canSplit}>
          <ArrowLineRight size={16} weight="regular" />
        </button>
        <button className="tlb-split" onClick={onResetDuration} title="Reset to Full Duration" disabled={!canResetDuration}>
          <ArrowsOut size={16} weight="regular" />
        </button>
        <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 4px' }} />
        <button className="tlb-split" onClick={onDelete} title="Delete (Del)" disabled={!canDelete}>
          <Trash size={16} weight="regular" />
        </button>
      </div>

      {/* ZOOM CONTROLS: RIGHT GROUP */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
        <button className="tlb-split" onClick={onZoomOut} title="Zoom Out">
          <MagnifyingGlassMinus size={17} weight="regular" />
        </button>
        
        <div 
          style={{ width: 80, height: 16, display: 'flex', alignItems: 'center', cursor: 'pointer', margin: '0 4px' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const updateZoom = (clientX: number) => {
              const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
              let newZoom: number;
              if (pct <= 0.5) {
                const factor = pct / 0.5;
                newZoom = minZoom * Math.pow(1 / minZoom, factor);
              } else {
                const factor = (pct - 0.5) / 0.5;
                newZoom = 1 * Math.pow(10 / 1, factor);
              }
              onZoomChange(Math.max(minZoom, Math.min(10, newZoom)));
            };
            updateZoom(e.clientX);
            const onMove = (me: PointerEvent) => updateZoom(me.clientX);
            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        >
          <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)', borderRadius: 2, position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: `${zoom <= 1 
                ? (Math.log10(zoom / minZoom) / Math.log10(1 / minZoom)) * 50 
                : 50 + (Math.log10(zoom) / Math.log10(10)) * 50}%`, 
              top: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: 'var(--accent)', 
              border: '2px solid #fff',
              pointerEvents: 'none'
            }} />
          </div>
        </div>

        <button className="tlb-split" onClick={onZoomIn} title="Zoom In">
          <MagnifyingGlassPlus size={17} weight="regular" />
        </button>
        
        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />
        
        <button className="tlb-split" onClick={onFitToView} title="Fit to View">
          <ArrowsOut size={17} weight="regular" />
        </button>
      </div>
    </div>
  );
});
