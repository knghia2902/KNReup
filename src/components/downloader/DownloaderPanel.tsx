/**
 * DownloaderPanel — Main container cho Downloader module.
 * 3-panel layout: URL Input → Download Options/Queue → History
 * Project-centric: downloads are associated with the active project.
 */
import { useEffect, useMemo } from 'react';
import { useDownloader } from '../../hooks/useDownloader';
import { useTheme } from '../../hooks/useTheme';
import { URLInput } from './URLInput';
import { DownloadOptions } from './DownloadOptions';
import { DownloadHistory } from './DownloadHistory';
import { DouyinAuthWidget } from './DouyinAuthWidget';
import { useSidecar } from '../../hooks/useSidecar';
import { useLauncherStore } from '../../stores/useLauncherStore';
import '../../styles/downloader.css';

export function DownloaderPanel() {
  useTheme();
  const { connected } = useSidecar();
  const { recentProjects, activeProjectId, setActiveProjectId } = useLauncherStore();

  const activeProject = useMemo(
    () => recentProjects.find(p => p.id === activeProjectId),
    [recentProjects, activeProjectId]
  );

  const {
    videoInfo,
    isAnalyzing,
    analyzeError,
    queue,
    history,
    cookieStatus,
    analyzeURL,
    startDownload,
    cancelDownload,
    deleteDownload,
    moveDownload,
    showInFolder,
    fetchHistory,
    setCookie,
    checkCookie,
    checkFileExistence,
  } = useDownloader();

  // Fetch history when sidecar connected or active project changes
  useEffect(() => {
    if (connected) {
      fetchHistory(50, 0, 'all', activeProjectId || undefined);
      checkCookie();
    }
  }, [connected, activeProjectId]);

  return (
    <div className="dl-layout-wrapper">
      <div className="dl-container">
        
        {/* Top Section: Branding and Search */}
        <section className="dl-top-section">
          <div className="dl-hero-header">
            <div className="dl-top-row">
              <h1>Multi Download Media</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Project Selector */}
                <select
                  className="dl-project-select"
                  value={activeProjectId || ''}
                  onChange={e => setActiveProjectId(e.target.value || null)}
                >
                  <option value="">📁 Tất cả (Global)</option>
                  {recentProjects.map(p => (
                    <option key={p.id} value={p.id}>📂 {p.name}</option>
                  ))}
                </select>
                <DouyinAuthWidget
                  cookieStatus={cookieStatus}
                  onSet={setCookie}
                />
              </div>
            </div>
            <p>High-performance extraction from Douyin, TikTok, YouTube & more.</p>
          </div>

          <URLInput
            onAnalyze={analyzeURL}
            isAnalyzing={isAnalyzing}
            error={analyzeError}
          />
        </section>

        {/* Bottom Section: Side-by-Side Panels */}
        <div className="dl-main-grid">
          <div className="dl-options-panel">
            {videoInfo ? (
              <DownloadOptions
                videoInfo={videoInfo}
                history={history}
                onDownload={(url, formatId, overwrites, mediaType) => {
                  startDownload(url, formatId, overwrites, undefined, activeProjectId || undefined, activeProject?.name, mediaType);
                }}
              />
            ) : (
              <div className="dl-empty-placeholder">
                <div className="dl-ep-icon">✨</div>
                <h3>Ready to Extract</h3>
                <p>Paste a video URL above to see available formats and resolutions.</p>
                <div className="dl-ep-platforms">
                  <span>Douyin</span>
                  <span>TikTok</span>
                  <span>YouTube</span>
                  <span>...</span>
                </div>
              </div>
            )}
          </div>

          <div className="dl-history-panel">
            <DownloadHistory
              history={history}
              queue={queue}
              onFetch={fetchHistory}
              onDelete={deleteDownload}
              onMove={moveDownload}
              onCancel={cancelDownload}
              onDownload={startDownload}
              onShow={showInFolder}
              checkFileExistence={checkFileExistence}
              connected={connected}
              projectId={activeProjectId || undefined}
            />
          </div>

        </div>
        
      </div>
    </div>
  );
}
