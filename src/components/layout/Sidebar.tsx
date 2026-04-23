import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  activeFocus: string; // Updated to string since SidebarFocus might be missing from some contexts
  onFocusChange: (focus: any) => void;
}

export function Sidebar({ activeFocus, onFocusChange }: SidebarProps) {
  const { isDark, toggle } = useTheme();

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
    </div>
  );
}
