import { useSubtitleStore } from '../../stores/useSubtitleStore';
import { sidecar } from '../../lib/sidecar';
import { useProjectStore } from '../../stores/useProjectStore';
import { SelectControl } from '../controls/SelectControl';

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
  const { segments, updateSegment, deleteSegment } = useSubtitleStore();
  const config = useProjectStore();
  const handleReTTS = async (segId: number, text: string) => {
    updateSegment(segId, { tts_status: 'pending' });
    try {
      const res = await sidecar.fetch<{audio_path: string}>('/api/pipeline/tts-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          engine: config.tts_engine,
          voice: config.voice,
          rate: config.speed,
          volume: config.volume,
          pitch: config.pitch
        })
      });
      updateSegment(segId, { tts_status: 'generated', tts_audio_path: res.audio_path });
    } catch {
      updateSegment(segId, { tts_status: 'error' });
    }
  };

  return (
    <>
      <div className="ps" style={{ padding: '16px', borderBottom: '1px solid var(--c-bg3)' }}>
        <div className="pshd" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--i1)', marginBottom: '8px' }}>Hardsub Extraction (OCR)</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingBottom: '8px' }}>
          Chuột trái vào Video để resize khung màu xanh OCR Region. Giúp OCR không quét tốn CPU.
        </div>
        <SelectControl 
          label="Analyze Source" 
          value={(config.asr_enabled ? 'audio' : '') + (config.ocr_enabled ? '_ocr' : '')} 
          onChange={(v) => {
            if (v === 'audio') config.updateConfig({ asr_enabled: true, ocr_enabled: false });
            if (v === '_ocr') config.updateConfig({ asr_enabled: false, ocr_enabled: true });
            if (v === 'audio_ocr') config.updateConfig({ asr_enabled: true, ocr_enabled: true });
          }}
          options={[
            { value: 'audio', label: 'Audio Only (Whisper)' },
            { value: '_ocr', label: 'Hardsub Only (OCR)' },
            { value: 'audio_ocr', label: 'Smart Merge (Audio + Hardsub)' },
          ]} 
        />
      </div>

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
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--i4)' }}>No segments. Configure settings and run Pipeline.</div>
            <button 
              className="btn pri" 
              style={{ padding: '8px 24px', background: 'var(--ac)', color: 'var(--bg)' }}
              onClick={onAnalyze} 
              disabled={processing}
            >
              {processing ? 'Analyzing...' : 'Auto Translate'}
            </button>
          </div>
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
