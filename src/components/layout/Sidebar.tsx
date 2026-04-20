import { useState, useEffect } from 'react';
import { type SidebarFocus } from './NLELayout';

interface SidebarProps {
  activeFocus: SidebarFocus;
  onFocusChange: (focus: SidebarFocus) => void;
}

export function Sidebar({ activeFocus, onFocusChange }: SidebarProps) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('kn_theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('kn_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('kn_theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="sb">
      <div 
        className={`sb-ico ${activeFocus === 'preview' ? 'active' : ''}`}
        onClick={() => onFocusChange('preview')}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="14" height="10" rx="1.5"/>
          <line x1="5" y1="15" x2="11" y2="15"/>
          <line x1="8" y1="11" x2="8" y2="15"/>
        </svg>
        <div className="tip">Preview</div>
      </div>
      
      <div className="sb-div"></div>
      
      <div 
        className={`sb-ico ${activeFocus === 'subtitle' ? 'active' : ''}`}
        onClick={() => onFocusChange('subtitle')}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="1" y1="5" x2="15" y2="5"/>
          <line x1="1" y1="9" x2="11" y2="9"/>
          <line x1="1" y1="13" x2="13" y2="13"/>
        </svg>
        <div className="tip">Subtitles</div>
      </div>
      
      <div 
        className={`sb-ico ${activeFocus === 'pipeline' ? 'active' : ''}`}
        onClick={() => onFocusChange('pipeline')}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="4" cy="4" r="2.5"/>
          <circle cx="12" cy="8" r="2.5"/>
          <circle cx="4" cy="12" r="2.5"/>
          <path d="M6.3 5L9.7 6.8M6.3 11L9.7 9.2"/>
        </svg>
        <div className="tip">Pipeline</div>
      </div>
      
      <div className="sb-sp"></div>
      
      <div 
        className={`sb-ico dot ${activeFocus === 'monitor-mini' ? 'active' : ''}`}
        onClick={() => onFocusChange('monitor-mini')}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 10L5 5l4 5 4-7 3 5"/>
        </svg>
        <div className="tip">Monitor · 3 new</div>
      </div>
      
      <div 
        className="sb-ico"
        onClick={() => setIsDark(!isDark)}
      >
        {isDark ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.5 10.5C11 11.5 6 9 5 4 4.5 9 8.5 14.5 14.5 10.5z" fill="currentColor"/>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.5 1.5M11.3 11.3l1.5 1.5M3.2 12.8l1.5-1.5M11.3 4.7l1.5-1.5"/>
          </svg>
        )}
        <div className="tip">Toggle ThemeMode</div>
      </div>
    </div>
  );
}
