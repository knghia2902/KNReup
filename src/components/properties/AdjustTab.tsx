import { Faders } from '@phosphor-icons/react';

export function AdjustTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)' }}>
      <div className="ps" style={{ background: 'var(--bg-secondary)', paddingBottom: '16px' }}>
        <div className="pshd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Faders size={16} weight="bold" />
            <span>Basic Adjustments</span>
          </div>
        </div>
        
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '11px', fontStyle: 'italic' }}>
          Color correction controls coming soon.
        </div>
      </div>
    </div>
  );
}
