import { useEffect, useState } from 'react';
import { Trash, CloudArrowDown, ArrowCounterClockwise, StopCircle, FolderOpen } from '@phosphor-icons/react';
import type { DownloadItem } from '../../hooks/useDownloader';

interface DownloadHistoryProps {
  history: DownloadItem[];
  queue: DownloadItem[];
  onFetch: (limit?: number, offset?: number, platform?: string, projectId?: string) => void;
  onDelete: (id: number, deleteFile?: boolean) => void;
  onCancel: (id: number) => void;
  onShow: (id: number) => void;
  onDownload?: (url: string, format_id?: string, overwrites?: boolean, meta?: Partial<DownloadItem>, projectId?: string, projectName?: string) => void;
  checkFileExistence?: (title: string, platform: string, video_id: string) => Promise<boolean>;
  connected?: boolean;
  projectId?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getPlatformIcon(p: string): string {
  const icons: Record<string, string> = {
    youtube: '🔴', tiktok: '🎵', douyin: '🎶',
    facebook: '🔵', instagram: '📸', twitter: '🐦',
  };
  return icons[p] || '🌐';
}

function StatusBadge({ status, error }: { status: string; error?: string }) {
  if (status === 'completed') return <span className="dl-st-badge st-done">Completed</span>;
  if (status === 'error') return (
    <span className="dl-st-badge st-err" title={error || 'Unknown error'}>
      Error
    </span>
  );
  if (status === 'cancelled') return <span className="dl-st-badge st-cancel">Cancelled</span>;
  return <span className="dl-st-badge st-pending">{status}</span>;
}

export function DownloadHistory({ 
  history, queue, onFetch, onDelete, onCancel, onShow, onDownload, checkFileExistence, connected = true, projectId 
}: DownloadHistoryProps) {
  const [missingFiles, setMissingFiles] = useState<Record<number, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Auto-refresh on focus or periodically
  useEffect(() => {
    if (!connected) return;

    const refresh = () => onFetch(50, 0, 'all', projectId);

    // 1. Poll every 5s
    const interval = setInterval(refresh, 5000);

    // 2. Refresh on window focus/tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refresh);
    };
  }, [connected, onFetch, projectId]);

  // Check existence for completed items - Optimized to reduce log spam
  useEffect(() => {
    let isMounted = true;
    const checkMissing = async () => {
      if (!checkFileExistence || history.length === 0) return;
      
      const completedItems = history.filter(item => item.status === 'completed');
      if (completedItems.length === 0) return;

      const results: Record<number, boolean> = { ...missingFiles };
      let changed = false;
      
      // Only check items we haven't checked or that were missing (in case they were restored)
      for (const item of completedItems) {
        if (!isMounted) return;
        
        // If we don't have a result for this ID yet, or if it was marked missing
        if (results[item.id] === undefined || results[item.id] === true) {
          try {
            const exists = await checkFileExistence(item.title, item.platform, item.video_id);
            if (results[item.id] !== !exists) {
              results[item.id] = !exists;
              changed = true;
            }
          } catch (err) {
            console.error('Failed to check file existence:', err);
          }
        }
      }
      
      if (changed && isMounted) {
        setMissingFiles(results);
      }
    };

    // Debounce the check to avoid spamming on rapid history updates
    const timer = setTimeout(checkMissing, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [history, checkFileExistence]);

  // Combine queue and history, ensuring uniqueness by id
  // Queue items take precedence to show real-time progress
  const allItemsMap = new Map<number, any>();
  
  // 1. Add history items
  history.forEach(item => allItemsMap.set(item.id, item));
  
  // 2. Add/overwrite with queue items
  queue.forEach(item => allItemsMap.set(item.id, item));
  
  // 3. Convert back to array and sort by created_at desc (newest first)
  const allItems = Array.from(allItemsMap.values()).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });


  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId !== null) {
      onDelete(deleteConfirmId, true);
    }
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="dl-recent-section">
      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId !== null && (
        <div className="dl-modal-overlay" onClick={cancelDelete}>
          <div className="dl-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-icon">🗑️</div>
            <div className="dl-modal-text">
              <h2>Xác nhận xóa</h2>
              <p>
                Bạn có chắc chắn muốn xóa lịch sử này và <strong>xóa luôn file video đã tải xuống</strong> (nếu có)?
              </p>
            </div>
            <div className="dl-modal-actions">
              <button className="dl-modal-btn secondary" onClick={cancelDelete}>Hủy</button>
              <button className="dl-modal-btn primary" style={{ backgroundColor: '#ef4444' }} onClick={confirmDelete}>Xóa Đồng Ý</button>
            </div>
          </div>
        </div>
      )}


      <div className="dl-recent-table">
        <div className="dl-rt-head">
          <div className="dl-rtc">MEDIA</div>
          <div className="dl-rtc">PLATFORM</div>
          <div className="dl-rtc">SIZE</div>
          <div className="dl-rtc">STATUS</div>
          <div className="dl-rtc">ACTIONS</div>
        </div>

        <div className="dl-rt-body">
          {allItems.length === 0 ? (
            <div className="dl-hist-empty">No downloads yet. Get started by analyzing a link.</div>
          ) : (
            allItems.map(item => {
              const isDownloading = item.status === 'downloading' || item.status === 'analyzing';
              return (
                <div className="dl-rt-row" key={item.id}>
                  <div className="dl-rtc media">
                    <div className="dl-rt-thumb">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" />
                      ) : (
                        <span>{getPlatformIcon(item.platform)}</span>
                      )}
                    </div>
                    <span className="dl-rt-title" title={item.title}>{item.title}</span>
                  </div>
                  <div className="dl-rtc platform">
                    <span>{item.platform}</span>
                  </div>
                  <div className="dl-rtc size">
                    {formatBytes(item.file_size)}
                  </div>
                  <div className="dl-rtc status">
                    {isDownloading ? (
                      <div className="dl-rt-progress">
                        <div className="dl-rt-pct">{Math.round(item.progress || 0)}%</div>
                        <div className="dl-rt-bar">
                          <div className="dl-rt-fill" style={{ width: `${item.progress || 0}%` }} />
                        </div>
                        <div className="dl-rt-speed">{item.speed || ''}</div>
                      </div>
                    ) : (
                      <StatusBadge 
                        status={item.status} 
                        error={item.metadata?.error || item.metadata?.errMsg || (typeof item.metadata === 'string' ? item.metadata : undefined)} 
                      />
                    )}
                  </div>
                  <div className="dl-rtc actions">
                    <div className="dl-rt-action-btns">
                       {item.status === 'completed' && missingFiles[item.id] && onDownload && (
                        <button 
                          className="dl-rt-btn restore" 
                          onClick={() => onDownload(item.url, item.resolution, true, item, item.project_id)}
                          title="Video missing. Click to Restore."
                        >
                          <CloudArrowDown size={18} weight="bold" />
                        </button>
                      )}
                      {item.status === 'completed' && !missingFiles[item.id] && (
                        <>
                          <button 
                            className="dl-rt-btn folder" 
                            onClick={() => onShow(item.id)}
                            title="Mở thư mục"
                          >
                            <FolderOpen size={18} weight="bold" />
                          </button>
                        </>
                      )}
                      {(item.status === 'cancelled' || item.status === 'error') && onDownload && (
                        <button 
                          className="dl-rt-btn retry" 
                          onClick={() => onDownload(item.url, item.resolution, true, item, item.project_id)}
                          title="Click to download again."
                        >
                          <ArrowCounterClockwise size={18} weight="bold" />
                        </button>
                      )}
                      {isDownloading ? (
                        <button 
                          className="dl-rt-btn cancel" 
                          onClick={() => onCancel(item.id)} 
                          title="Hủy tải"
                        >
                          <StopCircle size={18} weight="bold" />
                        </button>
                      ) : (
                        <button 
                          className="dl-rt-btn delete" 
                          onClick={() => handleDeleteClick(item.id)} 
                          title="Xóa lịch sử & file"
                        >
                          <Trash size={18} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
