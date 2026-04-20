import { useSubtitleStore } from '../../stores/useSubtitleStore';

interface TimelinePlaceholderProps {
  filePaths?: string[];
}

export function TimelinePlaceholder({ filePaths = [] }: TimelinePlaceholderProps) {
  const { segments } = useSubtitleStore();
  
  // Calculate a mock duration bound based on the last segment to map percentages
  const duration = segments.length > 0 ? Math.max(15, segments[segments.length - 1].end + 2) : 15;

  return (
    <div className="tl">
      <div className="tlhd">
        <span className="tltitle">Timeline</span>
        <span className="tltc">00:00:00:00</span>
        <div className="tlctrls">
          <button className="tlb">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v12M2 8h12"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="tlbody" style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          background: 'rgba(250,250,250,0.8)', color: 'var(--fg)', 
          fontWeight: 600, letterSpacing: 1, backdropFilter: 'blur(2px)'
        }}>
          TIMELINE EDITING WILL BE AVAILABLE IN PHASE 6 (CURRENTLY READ-ONLY)
        </div>
        <div className="tllbls">
          <div className="tlll"><div className="tlldot" style={{ background: 'var(--i4)' }}></div> VID</div>
          <div className="tlll"><div className="tlldot" style={{ background: 'var(--green)' }}></div> TTS</div>
          <div className="tlll"><div className="tlldot" style={{ background: 'var(--ac)' }}></div> SUB</div>
          <div className="tlll"><div className="tlldot" style={{ background: 'var(--i3)' }}></div> BGM</div>
        </div>
        <div className="tltracks">
          <div className="playhead"></div>
          
          {/* Video track */}
          <div className="tltr">
            <div className="tlblock vid" style={segments.length > 0 ? {position: 'absolute', left: 0, width: '100%'} : undefined}>
              <div className="tlbi">
                <div className="wf">
                  <div className="wfb" style={{ height: '40%' }}></div>
                  <div className="wfb" style={{ height: '80%' }}></div>
                  <div className="wfb" style={{ height: '60%' }}></div>
                  <div className="wfb" style={{ height: '100%' }}></div>
                  <div className="wfb" style={{ height: '50%' }}></div>
                </div>
                {filePaths.length > 0 
                  ? filePaths.length === 1 
                    ? filePaths[0].split(/[\\/]/).pop() 
                    : `${filePaths.length} Media Items` 
                  : 'No Media'}
              </div>
            </div>
          </div>
          
          {/* TTS track */}
          <div className="tltr">
            <div className="tlblock atts" style={segments.length > 0 ? {position: 'absolute', left: 0, width: '100%'} : undefined}>
              <div className="tlbi">
                <div className="wf">
                  <div className="wfb" style={{ height: '30%' }}></div>
                  <div className="wfb" style={{ height: '70%' }}></div>
                  <div className="wfb" style={{ height: '90%' }}></div>
                </div>
                TTS Audio
              </div>
            </div>
          </div>
          
          {/* SUB track */}
          <div className="tltr">
            {segments.length > 0 ? (
              segments.map((s) => (
                <div 
                  key={s.id} 
                  className="tlblock sub"
                  style={{
                    position: 'absolute',
                    left: `${(s.start / duration) * 100}%`,
                    width: `${((s.end - s.start) / duration) * 100}%`,
                  }}
                >
                  <div className="tlbi">{s.translated_text || s.source_text}</div>
                </div>
              ))
            ) : (
              <>
                <div className="tlblock sub s1"><div className="tlbi">Chờ chút đã!</div></div>
                <div className="tlblock sub s2"><div className="tlbi">Cái gì thế này?</div></div>
                <div className="tlblock sub s3"><div className="tlbi">Đẹp quá!</div></div>
                <div className="tlblock sub s4"><div className="tlbi">Vô cùng tinh tế.</div></div>
              </>
            )}
          </div>
          
          {/* BGM track */}
          <div className="tltr">
            <div className="tlblock bgm" style={segments.length > 0 ? {position: 'absolute', left: 0, width: '100%'} : undefined}>
              <div className="tlbi">
                <div className="wf">
                  <div className="wfb" style={{ height: '20%' }}></div>
                  <div className="wfb" style={{ height: '30%' }}></div>
                  <div className="wfb" style={{ height: '25%' }}></div>
                  <div className="wfb" style={{ height: '40%' }}></div>
                </div>
                Lofi Chill Loop
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
