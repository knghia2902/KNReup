import { useState, useEffect } from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';

export function LabScriptEditor() {
  const store = useVideoGenLabStore();
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (store.script) {
      setText(JSON.stringify(store.script, null, 2));
    }
  }, [store.script]);

  const handleContinue = () => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        setErrorMsg('Lỗi: thiếu array "scenes"');
        return;
      }
      setErrorMsg(null);
      store.continuePipeline(parsed);
    } catch (e: any) {
      setErrorMsg(`JSON Error: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px' }}>
      <div style={{ backgroundColor: 'var(--vgl-accent)', color: '#fff', padding: '10px 14px', borderRadius: '12px 12px 0 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span>📝</span> Duyệt kịch bản
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--vgl-bg)',
            color: 'var(--vgl-text)',
            fontFamily: 'Consolas, "JetBrains Mono", monospace',
            fontSize: '12px',
            padding: '12px',
            border: 'none',
            borderRadius: '0 0 12px 12px',
            outline: 'none',
            resize: 'none',
            lineHeight: '1.4'
          }}
          spellCheck={false}
        />
      </div>

      {errorMsg && (
        <div style={{ color: 'var(--vgl-danger)', marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex' }}>
        <button
          onClick={handleContinue}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'var(--vgl-success)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          ▶ Bắt đầu Render
        </button>
      </div>
    </div>
  );
}
