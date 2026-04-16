/**
 * DownloaderPanel — Main container cho Downloader module.
 * 3-panel layout: URL Input → Download Options/Queue → History
 */
import { useEffect } from 'react';
import { useDownloader } from '../../hooks/useDownloader';
import { URLInput } from './URLInput';
import { DownloadOptions } from './DownloadOptions';
import { DownloadQueue } from './DownloadQueue';
import { DownloadHistory } from './DownloadHistory';
import { CookieManager } from './CookieManager';
import '../../styles/downloader.css';

export function DownloaderPanel() {
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
    fetchHistory,
    syncCookie,
    checkCookie,
  } = useDownloader();

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
    checkCookie();
  }, []);

  const handleDownload = async (_videoId: string, formatId: string) => {
    if (!videoInfo) return;
    try {
      // Use the original analyzed URL
      const url = document.querySelector<HTMLInputElement>('.dl-url-input')?.value || '';
      await startDownload(url, formatId);
    } catch (err: any) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="dl-panel">
      {/* Header */}
      <div className="dl-panel-header">
        <div className="dl-panel-title-row">
          <h2 className="dl-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Video Downloader
          </h2>
          <CookieManager
            cookieStatus={cookieStatus}
            onSync={syncCookie}
            isSyncing={isSyncingCookie}
          />
        </div>
      </div>

      {/* URL Input */}
      <URLInput
        onAnalyze={analyzeURL}
        isAnalyzing={isAnalyzing}
        error={analyzeError}
      />

      {/* Main content area */}
      <div className="dl-content">
        {/* Download Options */}
        {videoInfo && (
          <DownloadOptions
            videoInfo={videoInfo}
            onDownload={handleDownload}
          />
        )}

        {/* Download Queue */}
        <DownloadQueue queue={queue} onCancel={cancelDownload} />

        {/* History */}
        <DownloadHistory
          history={history}
          onFetch={fetchHistory}
          onDelete={deleteDownload}
        />
      </div>
    </div>
  );
}
