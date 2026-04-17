/**
 * DownloaderPanel — Main container cho Downloader module.
 * 3-panel layout: URL Input → Download Options/Queue → History
 */
import { useEffect } from 'react';
import { useDownloader } from '../../hooks/useDownloader';
import { URLInput } from './URLInput';
import { DownloadOptions } from './DownloadOptions';
import { DownloadHistory } from './DownloadHistory';
import { DouyinAuthWidget } from './DouyinAuthWidget';
import { useSidecar } from '../../hooks/useSidecar';
import '../../styles/downloader.css';

export function DownloaderPanel() {
  const { connected } = useSidecar();

  const {
    videoInfo,
    isAnalyzing,
    analyzeError,
    queue,
    history,
    cookieStatus,
    isSyncingCookie,
    analyzeURL,
    startDownload,
    cancelDownload,
    deleteDownload,
    showInFolder,
    fetchHistory,
    syncCookie,
    setCookie,
    checkCookie,
    checkFileExistence,
  } = useDownloader();

  // Fetch history when sidecar connected
  useEffect(() => {
    if (connected) {
      fetchHistory();
      checkCookie();
    }
  }, [connected]);

  const handleDownload = async (_videoId: string, formatId: string, overwrites: boolean = false) => {
    if (!videoInfo) return;
    try {
      // Use the webpage_url retrieved during analysis
      const url = videoInfo.webpage_url;
      await startDownload(url, formatId, overwrites);

    } catch (err: any) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="dl-layout-wrapper">
      <div className="dl-container">
        
        {/* Top Section: Branding and Search */}
        <section className="dl-top-section">
          <div className="dl-hero-header">
            <div className="dl-top-row">
              <h1>Multi Download Media</h1>
              <DouyinAuthWidget
                cookieStatus={cookieStatus}
                onSet={setCookie}
                onSync={syncCookie}
                isSyncing={isSyncingCookie}
              />
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
                onDownload={handleDownload}
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
              onCancel={cancelDownload}
              onDownload={startDownload}
              onShow={showInFolder}
              checkFileExistence={checkFileExistence}
              connected={connected}
            />
          </div>

        </div>
        
      </div>
    </div>
  );
}
