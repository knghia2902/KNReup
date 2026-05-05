import React from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES } from '../TemplatePreview/templateData';

export function LabHistoryList() {
  const store = useVideoGenLabStore();
  const { history } = store;

  if (history.length === 0) {
    return (
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          📜 Lịch sử (0)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Chưa có video nào
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        📜 Lịch sử ({history.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
        {history.slice(0, 10).map((entry, idx) => {
          let domain = entry.url;
          try {
            domain = new URL(entry.url).hostname;
          } catch {}

          const themeInfo = THEME_PALETTES[entry.theme];
          const dotColor = themeInfo ? themeInfo.dot : '#888';

          // Format timestamp
          const d = new Date(entry.timestamp);
          const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

          return (
            <div
              key={idx}
              onClick={() => store.viewHistoryEntry(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                gap: '8px'
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {domain}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {themeInfo ? themeInfo.name : entry.theme}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {timeStr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
