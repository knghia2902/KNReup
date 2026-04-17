/**
 * useDownloader hook — Quản lý state cho Downloader module.
 * Giao tiếp với backend qua sidecar bridge (fetch + SSE).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { sidecar } from '../lib/sidecar';

// ─── Types ────────────────────────────────────────────────
export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
  vcodec: string;
  acodec: string;
  format_note: string;
  fps?: number;
  tbr?: number;
}

export interface VideoInfo {
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  platform: string;
  video_id: string;
  webpage_url: string;
  formats: VideoFormat[];
}

export interface DownloadItem {
  id: number;
  url: string;
  platform: string;
  title: string;
  thumbnail_url: string;
  resolution: string;
  file_size: number;
  video_id: string;
  status: 'pending' | 'analyzing' | 'downloading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  speed: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  completed_at: string;
}

export interface CookieStatus {
  valid: boolean;
  message: string;
}

// ─── Hook ─────────────────────────────────────────────────
export function useDownloader() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string>('');
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const [history, setHistory] = useState<DownloadItem[]>([]);
  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [isSyncingCookie, setIsSyncingCookie] = useState(false);

  const eventSourcesRef = useRef<Map<number, EventSource>>(new Map());

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach(es => es.close());
      eventSourcesRef.current.clear();
    };
  }, []);

  // ─── Analyze URL ──────────────────────────────────────
  const analyzeURL = useCallback(async (url: string) => {
    setIsAnalyzing(true);
    setAnalyzeError('');
    setVideoInfo(null);

    try {
      const result = await sidecar.fetch<VideoInfo>('/api/download/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      setVideoInfo(result);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // ─── Start Download ───────────────────────────────────
  const startDownload = useCallback(async (
    url: string, 
    format_id: string = '', 
    overwrites: boolean = false,
    meta?: Partial<DownloadItem>
  ) => {
    try {
      const result = await sidecar.fetch<{ download_id: number }>('/api/download/start', {
        method: 'POST',
        body: JSON.stringify({ url, format_id, overwrites }),
      });

      const downloadId = result.download_id;

      // Add to queue immediately with provided meta or fallback to videoInfo
      setQueue(prev => [{
        id: downloadId,
        url,
        platform: meta?.platform || videoInfo?.platform || 'unknown',
        title: meta?.title || videoInfo?.title || url,
        thumbnail_url: meta?.thumbnail_url || videoInfo?.thumbnail || '',
        resolution: format_id,
        file_size: meta?.file_size || 0,
        video_id: meta?.video_id || videoInfo?.video_id || '',
        status: 'downloading',
        progress: 0,
        speed: '',
        error_message: '',
        created_at: new Date().toISOString(),
        completed_at: '',
      }, ...prev]);

      // Start SSE listener
      const es = sidecar.createEventSource(`/api/download/stream/${downloadId}`);
      eventSourcesRef.current.set(downloadId, es);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setQueue(prev => prev.map(item =>
            item.id === downloadId
              ? { 
                  ...item, 
                  progress: data.progress ?? item.progress, 
                  speed: data.speed ?? item.speed, 
                  status: data.status ?? item.status,
                  file_size: data.file_size ?? item.file_size,
                  metadata: data.metadata ?? item.metadata
                }
              : item
          ));

          if (['completed', 'error', 'cancelled'].includes(data.status)) {
            es.close();
            eventSourcesRef.current.delete(downloadId);
            // Move to history
            if (data.status === 'completed') {
              setQueue(prev => prev.filter(item => item.id !== downloadId));
              fetchHistory();
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        eventSourcesRef.current.delete(downloadId);
      };

      return downloadId;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to start download');
    }
  }, [videoInfo]);

  // ─── Cancel Download ──────────────────────────────────
  const cancelDownload = useCallback(async (downloadId: number) => {
    try {
      await sidecar.fetch(`/api/download/cancel/${downloadId}`, { method: 'POST' });
      setQueue(prev => prev.map(item =>
        item.id === downloadId ? { ...item, status: 'cancelled' as const } : item
      ));
      // Close SSE
      const es = eventSourcesRef.current.get(downloadId);
      if (es) { es.close(); eventSourcesRef.current.delete(downloadId); }
    } catch (err: any) {
      console.error('Cancel failed:', err);
    }
  }, []);

  const openFile = useCallback(async (downloadId: number) => {
    try {
      await sidecar.fetch(`/api/download/open/${downloadId}`, { method: 'POST' });
    } catch (err: any) {
      console.error('Failed to open file:', err);
    }
  }, []);

  const showInFolder = useCallback(async (downloadId: number) => {
    try {
      await sidecar.fetch(`/api/download/show/${downloadId}`, { method: 'POST' });
    } catch (err: any) {
      console.error('Failed to show folder:', err);
    }
  }, []);

  // ─── Delete Download ──────────────────────────────────
  const deleteDownload = useCallback(async (downloadId: number) => {
    try {
      await sidecar.fetch(`/api/download/${downloadId}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => item.id !== downloadId));
      setQueue(prev => prev.filter(item => item.id !== downloadId));
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  }, []);

  // ─── Fetch History ────────────────────────────────────
  const fetchHistory = useCallback(async (limit = 50, offset = 0, platform?: string) => {
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (platform && platform !== 'all') params.set('platform', platform);
      
      const result = await sidecar.fetch<{ downloads: DownloadItem[] }>(
        `/api/download/history?${params}`
      );
      setHistory(result.downloads || []);
    } catch (err: any) {
      console.error('Fetch history failed:', err);
    }
  }, []);

  // ─── Cookie Management ────────────────────────────────
  const syncCookie = useCallback(async (browser: string = 'auto') => {
    setIsSyncingCookie(true);
    try {
      const result = await sidecar.fetch<{ success: boolean; message: string }>(
        '/api/download/cookie/sync',
        { method: 'POST', body: JSON.stringify({ browser }) }
      );
      if (result.success) {
        setCookieStatus({ valid: true, message: result.message });
      } else {
        setCookieStatus({ valid: false, message: result.message });
      }
      return result;
    } catch (err: any) {
      setCookieStatus({ valid: false, message: err.message });
      return { success: false, message: err.message };
    } finally {
      setIsSyncingCookie(false);
    }
  }, []);

  const setCookie = useCallback(async (cookie_string: string) => {
    setIsSyncingCookie(true);
    try {
      const result = await sidecar.fetch<{ success: boolean; message: string }>(
        '/api/download/cookie/set',
        { method: 'POST', body: JSON.stringify({ cookie_string }) }
      );
      if (result.success) {
        setCookieStatus({ valid: true, message: result.message });
      } else {
        setCookieStatus({ valid: false, message: result.message });
      }
      return result;
    } catch (err: any) {
      setCookieStatus({ valid: false, message: err.message });
      return { success: false, message: err.message };
    } finally {
      setIsSyncingCookie(false);
    }
  }, []);

  const checkCookie = useCallback(async () => {
    try {
      const result = await sidecar.fetch<CookieStatus>('/api/download/cookie/status');
      setCookieStatus(result);
      return result;
    } catch {
      setCookieStatus({ valid: false, message: 'Check failed' });
      return { valid: false, message: 'Check failed' };
    }
  }, []);

  const checkFileExistence = useCallback(async (title: string, platform: string, video_id: string = '') => {
    try {
      const params = new URLSearchParams({ title, platform, video_id });
      const result = await sidecar.fetch<{ exists: boolean }>(`/api/download/check-file?${params}`);
      return result.exists;
    } catch {
      return false;
    }
  }, []);


  // ─── Clear video info ─────────────────────────────────
  const clearVideoInfo = useCallback(() => {
    setVideoInfo(null);
    setAnalyzeError('');
  }, []);

  return {
    // State
    videoInfo,
    isAnalyzing,
    analyzeError,
    queue,
    history,
    cookieStatus,
    isSyncingCookie,
    // Actions
    analyzeURL,
    startDownload,
    cancelDownload,
    deleteDownload,
    openFile,
    showInFolder,
    fetchHistory,
    syncCookie,
    setCookie,
    checkCookie,
    checkFileExistence,
    clearVideoInfo,
  };
}

