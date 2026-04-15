import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useEffect, useRef } from 'react';

function formatTc(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

interface SubTabProps {
  onAnalyze?: () => void;
  processing?: boolean;
}

export function SubTab({ onAnalyze, processing }: SubTabProps) {
  const { segments, updateSegment } = useSubtitleStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const segId = (e as CustomEvent).detail;
      if (!listRef.current) return;
      const el = listRef.current.querySelector(`[data-seg-id="${segId}"]`) as HTMLTextAreaElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Just flash the background to indicate selection without stealing keyboard focus
        const parent = el.closest('div[data-seg-row="true"]') as HTMLDivElement;
        if (parent) {
          parent.style.transition = 'none';
          parent.style.backgroundColor = 'var(--ac)';
          setTimeout(() => {
            parent.style.transition = 'background-color 0.5s ease';
            parent.style.backgroundColor = 'var(--bg-surface)';
          }, 100);
        }
      }
    };
    window.addEventListener('focus-subtitle-panel', handler);
    return () => window.removeEventListener('focus-subtitle-panel', handler);
  }, []);
  return (
    <>

      <div className="subhd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px' }}>
        <span className="subsid">Segment Editor ({segments.length})</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className="btn" 
            style={{ padding: '2px 8px', fontSize: '10px', height: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onClick={() => useSubtitleStore.getState().autoSplitLongSegments()} 
            disabled={processing || segments.length === 0}
          >
            Auto Split
          </button>
          <button 
            className="btn" 
            style={{ padding: '2px 8px', fontSize: '10px', height: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onClick={onAnalyze} 
            disabled={processing}
          >
            {processing ? 'Analyzing...' : 'Auto Translate'}
          </button>
        </div>
      </div>

      <div className="slist" ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {segments.length === 0 ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Chưa có phụ đề, hãy nhấn Auto Translate để quét AI.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {segments.map((seg, idx) => (
              <div key={seg.id} data-seg-row="true" style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 8px',
                display: 'flex',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  fontSize: '9px', fontWeight: 700, color: 'var(--text-disabled)',
                  width: '20px', textAlign: 'center', paddingTop: '2px'
                }}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatTc(seg.start)} <span style={{ color: 'var(--border)' }}>→</span> {formatTc(seg.end)}
                    </span>
                    {seg.tts_audio_path && <span style={{ fontSize: '8px', background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 4px', borderRadius: '4px' }}>TTS DONE</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>{seg.source_text}</div>
                  <textarea
                    data-seg-id={seg.id}
                    style={{ 
                      fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500, 
                      background: 'var(--bg)', border: '1px solid transparent', borderRadius: '4px',
                      padding: '2px 4px', width: '100%', resize: 'none', minHeight: '20px', height: 'auto', overflow: 'hidden',
                      outline: 'none', transition: 'border-color 0.2s, background 0.2s',
                      lineHeight: '1.4',
                      // Prevent giant scrollbars when typing a lot, but auto-grow based on scroll height
                      boxSizing: 'border-box'
                    }}
                    value={seg.translated_text}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    onChange={(e) => updateSegment(seg.id, { translated_text: e.target.value })}
                    onFocus={(e) => { 
                      e.currentTarget.style.borderColor = 'var(--accent)'; 
                      e.currentTarget.style.background = 'var(--bg-surface)'; 
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg)'; }}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </>
  );
}
