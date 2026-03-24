import { open } from '@tauri-apps/plugin-dialog';

interface UploadPanelProps {
  onFileSelected?: (filePath: string) => void;
  disabled?: boolean;
  filePaths?: string[];
}

export function UploadPanel({ onFileSelected, disabled, filePaths = [] }: UploadPanelProps) {
  const handleOpen = async () => {
    if (disabled) return;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'avi'] }]
      });
      if (selected && typeof selected === 'string') {
        onFileSelected?.(selected);
      }
    } catch (e) {
      console.error('Failed to open dialog:', e);
    }
  };
  return (
    <div className="mbin" style={{ width: '100%', height: '100%', borderRight: 'none' }}>
      <div className="phd">
        <span className="phd-lbl">Project Media</span>
        <span className="phd-cnt">1/1</span>
        <button className="ico-btn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2.5 8h11M8 2.5v11"/>
          </svg>
        </button>
        <button className="ico-btn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12A2 2 0 011 8h14a2 2 0 01-1 4H2zM12 2v6M2 5l3-3 3 3"/>
          </svg>
        </button>
      </div>

      <div className="mlist">
        {/* Active items */}
        {filePaths.map((path) => {
          const fileName = path.split(/[\\/]/).pop() || '';
          const baseName = fileName.replace(/\.[^/.]+$/, '');
          return (
            <div key={path} className="mitem active">
              <div className="mthumb">
                <div className="mthumb-bg">
                  <span className="mthumb-lbl">{baseName}</span>
                </div>
                <div className="mthumb-badge done">RDY</div>
              </div>
              <div className="minfo">
                <div className="mname">{fileName}</div>
              </div>
            </div>
          );
        })}

        {/* Dropzone */}
        <div className="dropz" onClick={handleOpen} style={{ opacity: disabled ? 0.5 : 1 }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--i3)' }}>
            <path d="M12 4v12m-4-4l4 4 4-4M4 20h16"/>
          </svg>
          <span>Drop media</span>
        </div>
      </div>
    </div>
  );
}
