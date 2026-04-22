import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, ArrowSquareOut } from '@phosphor-icons/react';
import { type AppModule } from './NLELayout';
import { useProjectStore } from '../../stores/useProjectStore';
import { openDownloader } from '../../utils/windowManager';

interface TitlebarProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
}

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('knreup-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('knreup-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);
  return { isDark, toggle };
}

export function Titlebar({ activeModule, onModuleChange }: TitlebarProps) {
  const translation_engine = useProjectStore((state) => state.translation_engine) || 'argos';
  const tts_engine = useProjectStore((state) => state.tts_engine) || 'edge_tts';
  const { isDark, toggle } = useTheme();

  return (
    <div className="tb" data-tauri-drag-region>
      <div className="tb-logo" data-tauri-drag-region>
        <span className="tb-wordmark">kn<em>reup</em></span>
        <span className="tb-v">v1.0.1</span>
      </div>
      <div className="tb-nav" data-tauri-drag-region>
        <div 
          className={`tb-tab ${activeModule === 'editor' ? 'active' : ''}`}
          onClick={() => onModuleChange('editor')}
        >
          Editor
        </div>
        <div 
          className="tb-tab tb-tab-popup"
          onClick={() => openDownloader()}
          title="Mở Downloader trong cửa sổ mới"
        >
          Downloader
          <ArrowSquareOut size={10} weight="bold" style={{ marginLeft: 4, opacity: 0.5 }} />
        </div>
        <div 
          className={`tb-tab ${activeModule === 'monitor' ? 'active' : ''}`}
          onClick={() => onModuleChange('monitor')}
        >
          Monitor<div className="tb-dot"></div>
        </div>
        <div 
          className={`tb-tab ${activeModule === 'settings' ? 'active' : ''}`}
          onClick={() => onModuleChange('settings')}
        >
          Settings
        </div>
      </div>
      <div className="tb-right" data-tauri-drag-region>
        <div className="tb-sys" title="Trình dịch (Translation Engine)">
          <div className="sysled ok"></div>
          {translation_engine.toUpperCase()}
        </div>
        <div className="tb-sys" title="Trình đọc (TTS Engine)">
          <div className="sysled ok"></div>
          TTS: {tts_engine.toUpperCase()}
        </div>
        <button
          className="theme-toggle"
          onClick={toggle}
          title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
        >
          {isDark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
        </button>
      </div>
    </div>
  );
}

