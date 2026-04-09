import { useProjectStore } from '../../stores/useProjectStore';

export function SettingsTab() {
  const { 
    gemini_api_key, deepl_api_key, deepseek_api_key, openai_api_key, openai_base_url, openai_model, ollama_url, ollama_model,
    updateConfig 
  } = useProjectStore();

  return (
    <div style={{ padding: '0 24px', maxWidth: 640, margin: '24px auto', color: 'var(--fg)', height: 'calc(100% - 48px)', overflowY: 'auto' }}>
       <h2 style={{ marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 16, fontSize: '20px', fontWeight: 600 }}>API Keys Configuration</h2>
       
       <div className="pgrp" style={{ marginBottom: 20 }}>
         <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>Google Gemini API Key</label>
         <input 
           type="password" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px' }}
           value={gemini_api_key} 
           onChange={e => updateConfig({ gemini_api_key: e.target.value })} 
           placeholder="AI Studio / Vertex Key..." 
         />
       </div>

       <div className="pgrp" style={{ marginBottom: 20 }}>
         <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>DeepSeek API Key</label>
         <input 
           type="password" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px' }}
           value={deepseek_api_key} 
           onChange={e => updateConfig({ deepseek_api_key: e.target.value })} 
           placeholder="DeepSeek V3 / R1 Key..." 
         />
       </div>

       <div className="pgrp" style={{ marginBottom: 20 }}>
         <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>OpenAI / 9Router Configuration</label>
         <input 
           type="password" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px', marginBottom: '8px' }}
           value={openai_api_key} 
           onChange={e => updateConfig({ openai_api_key: e.target.value })} 
           placeholder="sk-proj-..." 
         />
         <input 
           type="text" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px', marginBottom: '8px' }}
           value={openai_base_url} 
           onChange={e => updateConfig({ openai_base_url: e.target.value })} 
           placeholder="https://api.openai.com/v1 (Base URL)" 
         />
         <input 
           type="text" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px' }}
           value={openai_model} 
           onChange={e => updateConfig({ openai_model: e.target.value })} 
           placeholder="knghia-v1 / gpt-4o" 
         />
       </div>

       <div className="pgrp" style={{ marginBottom: 20 }}>
         <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>DeepL API Key</label>
         <input 
           type="password" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px' }}
           value={deepl_api_key} 
           onChange={e => updateConfig({ deepl_api_key: e.target.value })} 
           placeholder="DeepL Pro / Free Key..." 
         />
       </div>

       <div className="pgrp" style={{ marginBottom: 20 }}>
         <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>Ollama Server URL (Local)</label>
         <input 
           type="text" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px', marginBottom: '8px' }}
           value={ollama_url} 
           onChange={e => updateConfig({ ollama_url: e.target.value })} 
           placeholder="http://localhost:11434" 
         />
         <input 
           type="text" 
           className="inp" 
           style={{ width: '100%', padding: '10px 12px' }}
           value={ollama_model} 
           onChange={e => updateConfig({ ollama_model: e.target.value })} 
           placeholder="gemma4:e4b / qwen2.5" 
         />
       </div>

       <div style={{ marginTop: 40, fontSize: 13, color: 'var(--i4)', background: 'var(--bg2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
         <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--ac)' }}>Privacy & Security</p>
         These API keys are securely stored locally via Zustand Persisted Storage inside your browser/app memory. They never leave your device except when securely interacting with the official LLM provider endpoints over HTTPS.
       </div>
    </div>
  );
}
