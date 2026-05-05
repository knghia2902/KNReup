import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { THEME_PALETTES } from '../TemplatePreview/templateData';
import { Trash, Warning, X } from '@phosphor-icons/react';

export function LabHistoryList() {
  const store = useVideoGenLabStore();
  const { history } = store;
  const [deleteTarget, setDeleteTarget] = useState<{ sessionId: string; domain: string } | null>(null);

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
    <>
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span>{timeStr}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ sessionId: entry.session_id, domain });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Xóa video"
                  >
                    <Trash size={14} weight="bold" style={{ cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && createPortal(
        <div className="vgl-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="vgl-modal" onClick={(e) => e.stopPropagation()}>
            <button className="vgl-modal-close" onClick={() => setDeleteTarget(null)}>
              <X size={18} weight="bold" />
            </button>
            <div className="vgl-modal-icon">
              <Trash size={32} weight="duotone" />
            </div>
            <h3 className="vgl-modal-title">Xóa video này?</h3>
            <p className="vgl-modal-desc">
              Video <strong>{deleteTarget.domain}</strong> sẽ bị xóa khỏi lịch sử và ổ cứng. Hành động này không thể hoàn tác.
            </p>
            <div className="vgl-modal-actions">
              <button className="vgl-modal-btn cancel" onClick={() => setDeleteTarget(null)}>
                Hủy
              </button>
              <button
                className="vgl-modal-btn danger"
                onClick={() => {
                  store.deleteHistoryEntry(deleteTarget.sessionId);
                  setDeleteTarget(null);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
