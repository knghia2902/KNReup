import { open } from '@tauri-apps/plugin-dialog';

interface UploadPanelProps {
  onFileSelected?: (filePath: string) => void;
  onFileSwitch?: (filePath: string) => void;
  onFileRemoved?: (filePath: string) => void;
  disabled?: boolean;
  filePaths?: string[];
  activeFile?: string | null;
}

export function UploadPanel({ onFileSelected, onFileSwitch, onFileRemoved, disabled, filePaths = [], activeFile }: UploadPanelProps) {
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
        <span className="phd-cnt">{filePaths.length} items</span>
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
          const isActive = path === activeFile;
          return (
            <div 
              key={path} 
              className={`mitem ${isActive ? 'active' : ''}`}
                onClick={() => onFileSwitch?.(path)}
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ filePath: path, mediaType: 'video' }));
                }}
                style={{ cursor: 'grab' }}
              >
                <div className="mthumb">
                <div className="mthumb-bg">
                  <span className="mthumb-lbl">{baseName}</span>
                </div>
                {isActive && <div className="mthumb-badge done">ACT</div>}
                {!isActive && <div className="mthumb-badge idle">IDLE</div>}
              </div>
              <div className="minfo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="mname" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 0 }}>{fileName}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemoved?.(path);
                  }}
                  title="Remove"
                  style={{ background: 'transparent', border: 'none', color: 'var(--i3)', cursor: 'pointer', display: 'flex', padding: 2, marginLeft: 4 }}
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4L4 12" />
                  </svg>
                </button>
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
