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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  return (
    <div className="dl-hero-search">
      <div className="dl-search-box">
        <div className="dl-search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <input
          type="text"
          className="dl-search-input"
          placeholder="Paste video URL here..."
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
            <span className="dl-btn-content">
              <span className="dl-spinner-small" />
              Analyzing...
            </span>
          ) : (
            'Analyze Link ➔'
          )}
        </button>
      </div>
      {error && <div className="dl-error-message" style={{ color: 'var(--dl-danger)', fontWeight: 600 }}>{error}</div>}
    </div>
  );
}
