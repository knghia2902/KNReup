import React, { useState, useRef } from 'react';
import { sidecar } from '../../../lib/sidecar';
import { WarningCircle, Play, Pause } from '@phosphor-icons/react';

interface DesignTabProps {
  connected: boolean;
}

export function DesignTab({ connected }: DesignTabProps) {
  const [designName, setDesignName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [age, setAge] = useState<'Young' | 'Middle' | 'Senior' | null>(null);
  const [pitch, setPitch] = useState<'Low' | 'Normal' | 'High' | null>(null);
  const [sampleText, setSampleText] = useState('Xin chào, tôi là trợ lý AI của KNReup');
  const [customText, setCustomText] = useState('');
  const [isDesigning, setIsDesigning] = useState(false);
  const [designResult, setDesignResult] = useState<{ audio?: string } | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);

  const designAudioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const sampleTexts = [
    "Xin chào, tôi là trợ lý AI của KNReup",
    "Hôm nay trời đẹp quá, chúng ta đi dạo nhé",
    "Video này được tạo bởi công nghệ AI hiện đại"
  ];

  const handleDesign = async () => {
    if (!designName.trim()) return;
    setIsDesigning(true);
    setDesignError(null);
    
    const attrs = [];
    if (gender) attrs.push(gender);
    if (age) attrs.push(age);
    if (pitch) attrs.push(`${pitch} pitch`);
    const fullDesc = `${attrs.join(', ')}. ${description}`.trim();
    
    try {
      const data = await sidecar.fetch<any>('/api/tts/profiles/design', {
        method: 'POST',
        body: JSON.stringify({
          name: designName.trim(),
          description: fullDesc,
          text: customText || sampleText
        })
      });
      
      setDesignResult({ audio: `${sidecar.getBaseUrl()}/api/tts/profiles/${data.profile_name}/audio` });
      setDesignName('');
      // Profiles refresh will be handled via global hooks/history later
    } catch (err: any) {
      setDesignError(err.message);
    } finally {
      setIsDesigning(false);
    }
  };

  const togglePlay = () => {
    const audio = designAudioRef.current;
    if (!audio) return;

    if (playingId === 'design') {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.load();
      audio.play().then(() => {
        setPlayingId('design');
      }).catch(err => {
        console.error('Audio play error:', err);
        setPlayingId(null);
      });
    }
  };

  if (!connected) {
    return (
      <div className="vc-empty-placeholder">
        <WarningCircle size={48} weight="duotone" className="vc-ep-icon" color="var(--vc-danger)" />
        <h3>Engine Offline</h3>
        <p>OmniVoice engine chưa khởi động. Vui lòng kiểm tra Python sidecar.</p>
      </div>
    );
  }

  return (
    <div className="vc-card">
      <h2 className="vc-card-title">Thiết kế giọng AI</h2>
      
      <div className="vc-input-group">
        <label className="vc-label">Mô tả (Prompt tiếng Anh)</label>
        <textarea 
          className="vc-textarea" 
          placeholder="VD: A calm, deep male voice suitable for documentaries..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isDesigning}
        />
      </div>

      <div className="vc-input-group">
        <label className="vc-label">Thuộc tính</label>
        <div className="vc-chips">
          {['Male', 'Female'].map(g => (
            <div key={g} className={`vc-chip ${gender === g ? 'active' : ''}`} onClick={() => setGender(gender === g ? null : g as any)}>
              {g}
            </div>
          ))}
          <div style={{ width: '1px', background: 'var(--vc-border)' }}></div>
          {['Young', 'Middle', 'Senior'].map(a => (
            <div key={a} className={`vc-chip ${age === a ? 'active' : ''}`} onClick={() => setAge(age === a ? null : a as any)}>
              {a}
            </div>
          ))}
          <div style={{ width: '1px', background: 'var(--vc-border)' }}></div>
          {['Low', 'Normal', 'High'].map(p => (
            <div key={p} className={`vc-chip ${pitch === p ? 'active' : ''}`} onClick={() => setPitch(pitch === p ? null : p as any)}>
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="vc-input-group" style={{ marginTop: '8px' }}>
        <label className="vc-label">Đoạn đọc thử (Tiếng Việt)</label>
        <select 
          className="vc-select" 
          value={customText ? '' : sampleText}
          onChange={e => {
            if (e.target.value) {
              setSampleText(e.target.value);
              setCustomText('');
            }
          }}
          disabled={isDesigning}
        >
          <option value="" disabled>Chọn câu mẫu...</option>
          {sampleTexts.map((text, i) => <option key={i} value={text}>{text}</option>)}
        </select>
        <input 
          type="text" 
          className="vc-input" 
          placeholder="Hoặc nhập tùy ý..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          disabled={isDesigning}
        />
      </div>

      <div className="vc-input-group">
        <label className="vc-label">Tên hồ sơ lưu trữ</label>
        <input 
          type="text" 
          className="vc-input" 
          placeholder="VD: Giọng Design 01"
          value={designName}
          onChange={e => setDesignName(e.target.value)}
          disabled={isDesigning}
        />
      </div>

      {designError && (
        <div className="vc-banner error">
          <WarningCircle size={18} weight="fill" />
          {designError}
        </div>
      )}

      <button 
        className="vc-btn-primary" 
        onClick={handleDesign}
        disabled={!designName.trim() || isDesigning}
      >
        {isDesigning ? 'Đang tổng hợp (Designing)...' : 'Tạo Giọng Design'}
      </button>

      {designResult && (
        <div className="vc-player" style={{ marginTop: '12px' }}>
          <button className="vc-play-btn" onClick={togglePlay}>
            {playingId === 'design' ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </button>
          <div className="vc-wave-container"><div className="vc-wave-fill" style={{ width: '0%' }}></div></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--vc-slate)', width: '60px' }}>Preview</div>
          <audio ref={designAudioRef} src={designResult.audio} onEnded={() => setPlayingId(null)} />
        </div>
      )}

    </div>
  );
}
