import React, { useState } from 'react';
import { useVoiceStudioStore } from '../../../stores/useVoiceStudioStore';
import { sidecar } from '../../../lib/sidecar';
import { SpeakerHifi, WarningCircle, CaretDown } from '@phosphor-icons/react';

interface TTSTabProps {
  connected: boolean;
}

export function TTSTab({ connected }: TTSTabProps) {
  const { generateTTS, loading } = useVoiceStudioStore();

  const [text, setText] = useState('');
  const [engine, setEngine] = useState('edge_tts');
  const [voice, setVoice] = useState('vi-VN-HoaiMyNeural');
  
  // Customization
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);

  const [error, setError] = useState<string | null>(null);

  const charsLeft = 5000 - text.length;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (text.length > 5000) {
      setError('Độ dài text vượt quá 5000 ký tự');
      return;
    }
    
    setError(null);
    try {
      const config = {
        voice,
        speed,
        pitch,
        volume
      };
      await generateTTS(sidecar.getBaseUrl(), text, engine, config);
      setText(''); // Reset or keep it? Usually better to keep text in case they want to adjust
    } catch (e: any) {
      setError(e.message || 'Lỗi khi tạo TTS');
    }
  };

  const getVoiceOptions = () => {
    switch (engine) {
      case 'edge_tts':
        return [
          { label: 'Hoài My (Nữ)', value: 'vi-VN-HoaiMyNeural' },
          { label: 'Nam Minh (Nam)', value: 'vi-VN-NamMinhNeural' }
        ];
      case 'elevenlabs':
        return [
          { label: 'Callum (Nam)', value: 'N2lVS1w4EtoT3dr4eOWO' },
          { label: 'Rachel (Nữ)', value: '21m00Tcm4TlvDq8ikWAM' }
        ];
      case 'omnivoice':
        return [
          { label: 'Omni Default', value: 'default' }
        ];
      default:
        return [];
    }
  };

  if (!connected) {
    return (
      <div className="vc-empty-placeholder">
        <WarningCircle size={48} weight="duotone" className="vc-ep-icon" color="var(--vc-danger)" />
        <h3>Engine Offline</h3>
        <p>Vui lòng kiểm tra kết nối Python sidecar.</p>
      </div>
    );
  }

  return (
    <div className="vc-card">
      <h2 className="vc-card-title">Tổng hợp Text-to-Speech</h2>
      
      <div className="vc-input-group">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label className="vc-label">Engine</label>
            <div className="vc-select-wrapper">
              <select className="vc-select" value={engine} onChange={e => {
                setEngine(e.target.value);
                // Reset select depending on engine
                if (e.target.value === 'edge_tts') setVoice('vi-VN-HoaiMyNeural');
                if (e.target.value === 'elevenlabs') setVoice('N2lVS1w4EtoT3dr4eOWO');
                if (e.target.value === 'omnivoice') setVoice('default');
              }}>
                <option value="edge_tts">Edge TTS (Miễn phí)</option>
                <option value="elevenlabs">ElevenLabs (Premium)</option>
                <option value="omnivoice">OmniVoice (Local AI)</option>
              </select>
              <CaretDown className="vc-select-icon" />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <label className="vc-label">Giọng đọc</label>
            <div className="vc-select-wrapper">
              <select className="vc-select" value={voice} onChange={e => setVoice(e.target.value)}>
                {getVoiceOptions().map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <CaretDown className="vc-select-icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="vc-input-group" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="vc-label" style={{ marginBottom: 0 }}>Nội dung văn bản</label>
          <span style={{ fontSize: '0.8rem', color: charsLeft < 0 ? 'var(--vc-danger)' : 'var(--vc-slate)' }}>
            {charsLeft} / 5000 ký tự
          </span>
        </div>
        <textarea 
          className="vc-textarea" 
          placeholder="Nhập nội dung cần chuyển đổi thành giọng nói..."
          rows={5}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="vc-input-group" style={{ marginTop: '16px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <label className="vc-label">Tốc độ ({speed}x)</label>
          <input 
            type="range" 
            min="0.5" max="2.0" step="0.1" 
            value={speed} 
            onChange={e => setSpeed(parseFloat(e.target.value))} 
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="vc-label">Âm lượng ({volume})</label>
          <input 
            type="range" 
            min="0.1" max="2.0" step="0.1" 
            value={volume} 
            onChange={e => setVolume(parseFloat(e.target.value))} 
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {error && (
        <div className="vc-banner error" style={{ marginTop: '16px' }}>
          <WarningCircle size={18} weight="fill" />
          {error}
        </div>
      )}

      <button 
        className="vc-btn-primary" 
        style={{ marginTop: '16px', width: '100%' }}
        onClick={handleGenerate}
        disabled={!text.trim() || charsLeft < 0 || loading}
      >
        <SpeakerHifi size={20} weight="fill" />
        {loading ? 'Đang tổng hợp...' : 'Tạo File Audio'}
      </button>

    </div>
  );
}
