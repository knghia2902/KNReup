import { useState } from 'react';

interface URLInputProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
  error: string;
}

export function URLInput({ onAnalyze, isAnalyzing, error }: URLInputProps) {
  const [url, setUrl] = useState('');

  const handleAnalyze = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAnalyze(trimmed);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        onAnalyze(text.trim());
      }
    } catch { /* clipboard denied */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div className="dl-url-section">
      <div className="dl-url-row">
        <button className="dl-paste-btn" onClick={handlePaste} title="Paste from clipboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <input
          className="dl-url-input"
          type="text"
          placeholder="Paste video URL here... (YouTube, TikTok, Douyin, Facebook)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnalyzing}
        />
        <button
          className="dl-analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !url.trim()}
        >
          {isAnalyzing ? (
            <span className="dl-spinner" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Link'}
        </button>
      </div>
      {error && <div className="dl-error">{error}</div>}
    </div>
  );
}
