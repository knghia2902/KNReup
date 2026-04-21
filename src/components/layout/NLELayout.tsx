import { type ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import './NLELayout.css';
import { DownloaderPanel } from '../downloader/DownloaderPanel';

export type AppModule = 'editor' | 'downloader' | 'monitor' | 'settings';

interface NLELayoutProps {
  mediaBin?: ReactNode;
  videoPreview?: ReactNode;
  properties?: ReactNode;
  timeline?: ReactNode;
  downloaderContent?: ReactNode;
  monitorContent?: ReactNode;
  settingsContent?: ReactNode;
  statusContent?: ReactNode;
  activeModule: AppModule;
  onVideoDrop?: (e: React.DragEvent) => void;
}

export function NLELayout({
  mediaBin,
  videoPreview,
  properties,
  timeline,
  monitorContent,
  settingsContent,
  statusContent,
  activeModule,
  onVideoDrop,
}: NLELayoutProps) {
  const [mediaBinWidth, setMediaBinWidth] = useState(380);
  const [propertiesWidth, setPropertiesWidth] = useState(380);
  const [timelineHeight, setTimelineHeight] = useState(280);

  const isResizing = useRef<string | null>(null);

  const startResizing = useCallback((direction: string) => {
    isResizing.current = direction;
    document.body.style.cursor = direction === 'timeline' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = null;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    if (isResizing.current === 'mediaBin') {
      const newWidth = e.clientX - 0; // No sidebar offset
      setMediaBinWidth(Math.max(200, Math.min(newWidth, 500)));
    } else if (isResizing.current === 'properties') {
      const newWidth = window.innerWidth - e.clientX;
      setPropertiesWidth(Math.max(260, Math.min(newWidth, 500)));
    } else if (isResizing.current === 'timeline') {
      const newHeight = window.innerHeight - e.clientY - 24; // Status bar is 24px
      setTimelineHeight(Math.max(220, Math.min(newHeight, 500)));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <>
      <div className={`mod ${activeModule === 'editor' ? 'active' : ''}`} id="ws-editor" style={{ display: activeModule === 'editor' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
        <div className="ed-body" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* MEDIA BIN */}
          <div className="mbin" style={{ width: mediaBinWidth, flexShrink: 0 }}>
            {mediaBin || <div style={{ padding: 12, color: 'var(--i4)' }}>Media Bin</div>}
          </div>

          <div
            className="resizer-x"
            onMouseDown={() => startResizing('mediaBin')}
          />

          {/* PREVIEW */}
          <div
            className="pvp"
            onDrop={onVideoDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{ flex: 1, minWidth: 0 }}
          >
            {videoPreview || (
              <div className="pvbody">
                <div className="vnolbl">
                  Drop a video here...
                </div>
              </div>
            )}
          </div>

          <div
            className="resizer-x"
            onMouseDown={() => startResizing('properties')}
          />

          {/* PROPERTIES */}
          <div style={{ width: propertiesWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {properties || (
              <div style={{ padding: 12, color: 'var(--i4)' }}>Properties Panel</div>
            )}
          </div>
        </div>

        <div
          className="resizer-y"
          onMouseDown={() => startResizing('timeline')}
        />

        {/* TIMELINE */}
        <div style={{ height: timelineHeight, flexShrink: 0, overflow: 'hidden' }}>
          {timeline}
        </div>

        {/* STATUS BAR */}
        <div className="stbar">
          <div className="sti">
            {statusContent || <span>Ready</span>}
          </div>
        </div>
      </div>

      <div className={`mod ${activeModule === 'downloader' ? 'active' : ''}`} id="ws-downloader">
        <div className="mscreen">
          <DownloaderPanel />
        </div>
      </div>

      <div className={`mod ${activeModule === 'monitor' ? 'active' : ''}`} id="ws-monitor">
        <div className="mscreen">
          <h2 className="ms-title">Monitor</h2>
          {monitorContent || <span className="ms-sub">Account Feed goes here</span>}
        </div>
      </div>

      <div className={`mod ${activeModule === 'settings' ? 'active' : ''}`} id="ws-settings">
        <div className="mscreen">
          <h2 className="ms-title">Settings</h2>
          {settingsContent || <span className="ms-sub">Config goes here</span>}
        </div>
      </div>
    </>
  );
}
