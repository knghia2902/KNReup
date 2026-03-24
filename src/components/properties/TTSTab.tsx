import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';

export function TTSTab() {
  return (
    <>
      <div className="ps">
        <div className="pshd">Dubbing System</div>
        <ToggleControl label="Status" checked={true} />
        
        <div className="egrid">
          <div className="ecard active">
            <span className="ecard-name">Microsoft Edge</span>
            <span className="ecard-st ok">Online · Free</span>
          </div>
          <div className="ecard">
            <span className="ecard-name">Piper TTS</span>
            <span className="ecard-st">Offline · Medium</span>
          </div>
          <div className="ecard">
            <span className="ecard-name">ElevenLabs</span>
            <span className="ecard-st warn">API Key Req</span>
          </div>
          <div className="ecard">
            <span className="ecard-name">OpenAI</span>
            <span className="ecard-st">Paid · Slow</span>
          </div>
        </div>
      </div>

      <div className="ps">
        <div className="pshd">Voice Setting</div>
        <div className="pr">
          <div className="plbl">Actor</div>
          <div className="pc">
            <select className="psel">
              <optgroup label="Female">
                <option>vi-VN-HoaiMyNeural</option>
                <option>vi-VN-BichNgocNeural</option>
              </optgroup>
              <optgroup label="Male">
                <option>vi-VN-NamMinhNeural</option>
              </optgroup>
            </select>
          </div>
        </div>
        <SliderControl label="Speed" value={1} min={0.5} max={2.0} step={0.1} unit="x" />
        <SliderControl label="Volume" value={100} min={0} max={200} step={5} unit="%" />
        <SliderControl label="Pitch" value={0} min={-50} max={50} step={1} unit="st" />
      </div>

      <div className="ps" style={{ borderBottom: 'none' }}>
        <div className="pshd">Fallback Chain</div>
        <div className="fchain">
          <span className="fcn">1</span>
          <span className="fcname">Edge TTS</span>
          <span className="fcbadge ok">Active</span>
        </div>
        <div className="fchain">
          <span className="fcn">2</span>
          <span className="fcname">Piper (vi-VN-x-medium)</span>
          <span className="fcbadge">Ready</span>
        </div>
      </div>
    </>
  );
}
