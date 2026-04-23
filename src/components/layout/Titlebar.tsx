import { Sun, Moon } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useTheme } from '../../hooks/useTheme';

export function Titlebar() {
  const translation_engine = useProjectStore((state) => state.translation_engine) || 'argos';
  const tts_engine = useProjectStore((state) => state.tts_engine) || 'edge_tts';
  const { isDark, toggle } = useTheme();

  return (
    <div className="tb" data-tauri-drag-region>
      <div className="tb-logo" data-tauri-drag-region>
        <span className="tb-wordmark">kn<em>reup</em></span>
        <span className="tb-v">v1.0.1</span>
      </div>
      <div className="tb-nav" data-tauri-drag-region />
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
