export function SubTab() {
  return (
    <>
      <div className="subhd">
        <span className="subsid">Segment Editor</span>
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
        <div className="srow active">
          <div className="snum">1</div>
          <div className="scnt">
            <div className="stc">00:00:00:00 · 00:00:02:14</div>
            <div className="so">Wait a minute!</div>
            <div className="st">Chờ chút đã!</div>
          </div>
        </div>
        <div className="srow">
          <div className="snum">2</div>
          <div className="scnt">
            <div className="stc">00:00:02:14 · 00:00:05:00</div>
            <div className="so">What is this?</div>
            <div className="st">Cái gì thế này?</div>
          </div>
        </div>
        <div className="srow">
          <div className="snum">3</div>
          <div className="scnt">
            <div className="stc">00:00:05:00 · 00:00:08:12</div>
            <div className="so">It's beautiful!</div>
            <div className="st">Đẹp quá!</div>
          </div>
        </div>
        <div className="srow">
          <div className="snum">4</div>
          <div className="scnt">
            <div className="stc">00:00:08:12 · 00:00:12:00</div>
            <div className="so">Absolutely stunning.</div>
            <div className="st">Vô cùng tinh tế.</div>
          </div>
        </div>
      </div>

      <div className="sedit">
        <div className="stcbar">
          <input type="text" className="tci" defaultValue="00:00:00:00" />
          <span className="tcsep">—</span>
          <input type="text" className="tci" defaultValue="00:00:02:14" />
          <div className="sacts">
            <button className="sab">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M8 3v10"/>
              </svg>
            </button>
            <button className="sab del">
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
              <span className="sclang">en</span>
            </div>
            <textarea className="scta" defaultValue="Wait a minute!" />
            <div className="scfoot">
              <span className="scinfo">Original Transcribe</span>
              <button className="btn sm">Reload</button>
            </div>
          </div>

          <div className="sc">
            <div className="schd">
              <div className="scdot" style={{background: 'var(--ac)'}}></div>
              <span className="sclang">vi</span>
            </div>
            <textarea className="scta" defaultValue="Chờ chút đã!" />
            <div className="scfoot">
              <span className="scinfo">DeepSeek R1</span>
              <button className="btn sm pri" style={{background: 'var(--green)'}}>Re-TS</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
