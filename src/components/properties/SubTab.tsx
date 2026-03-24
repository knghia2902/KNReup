import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { useSidecar } from '../../hooks/useSidecar';
import { useProjectStore } from '../../stores/useProjectStore';

function formatTc(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

export function SubTab() {
  const { segments, updateSegment, deleteSegment } = useSubtitleStore();
  const config = useProjectStore();
  const { emitTask } = useSidecar();

  const handleReTTS = async (segId: number, text: string) => {
    updateSegment(segId, { tts_status: 'pending' });
    try {
      await emitTask('tts:generate', {
        text,
        segment_id: segId,
        engine: config.tts_engine,
        voice: config.voice,
        speed: config.speed,
        volume: config.volume,
        pitch: config.pitch
      });
      // Sidecar listener (setup in pipeline usually) sets to generated
    } catch {
      updateSegment(segId, { tts_status: 'error' });
    }
  };

  return (
    <>
      <div className="subhd">
        <span className="subsid">Segment Editor ({segments.length})</span>
        <div className="subnav">
          <button className="snb">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v12M2 8h12"/>
            </svg>
          </button>
          <button className="snb">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 8h8M2 3h12M2 13h12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="slist">
        {segments.length === 0 ? (
          <div style={{ padding: 12, fontSize: 10, color: 'var(--i4)' }}>No segments. Run Pipeline to extract subtitles.</div>
        ) : (
          segments.map((seg, idx) => (
            <div key={seg.id} className="srow">
              <div className="snum">{idx + 1}</div>
              <div className="scnt">
                <div className="stc">{formatTc(seg.start)} · {formatTc(seg.end)}</div>
                <div className="so">{seg.source_text}</div>
                <div className="st">{seg.translated_text}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {segments.length > 0 && (
        <div className="sedit">
          <div className="stcbar">
            {/* Displaying first segment info for demo of editor */}
            <input type="text" className="tci" defaultValue={formatTc(segments[0].start)} />
            <span className="tcsep">—</span>
            <input type="text" className="tci" defaultValue={formatTc(segments[0].end)} />
            <div className="sacts">
              <button className="sab">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10M8 3v10"/>
                </svg>
              </button>
              <button className="sab del" onClick={() => deleteSegment(segments[0].id)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M6 8v4M10 8v4M4 4v10a1 1 0 001 1h6a1 1 0 001-1V4M7 1h2"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="scols">
            <div className="sc">
              <div className="schd">
                <div className="scdot" style={{background: 'var(--i3)'}}></div>
                <span className="sclang">src</span>
              </div>
              <textarea 
                className="scta" 
                value={segments[0].source_text} 
                onChange={(e) => updateSegment(segments[0].id, { source_text: e.target.value })}
              />
              <div className="scfoot">
                <span className="scinfo">Whisper ASR</span>
                <button className="btn sm">Reload</button>
              </div>
            </div>

            <div className="sc">
              <div className="schd">
                <div className="scdot" style={{background: 'var(--ac)'}}></div>
                <span className="sclang">target</span>
              </div>
              <textarea 
                className="scta" 
                value={segments[0].translated_text}
                onChange={(e) => updateSegment(segments[0].id, { translated_text: e.target.value })}
              />
              <div className="scfoot">
                <span className="scinfo">Translation</span>
                <button 
                  className="btn sm pri" 
                  style={{background: 'var(--green)'}}
                  onClick={() => handleReTTS(segments[0].id, segments[0].translated_text)}
                >
                  {segments[0].tts_status === 'pending' ? 'Syncing...' : 'Re-TTS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
