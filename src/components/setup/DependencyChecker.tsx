/**
 * DependencyChecker — First-run popup kiểm tra GPU/FFmpeg.
 * Hiển thị ✅/❌ cho mỗi dependency. Tự đóng sau 2s nếu tất cả OK.
 * Tham khảo: VideoTransAI backend status card.
 */
import { useEffect, useState } from 'react';
import type { SystemCheck } from '../../hooks/useSidecar';
import './DependencyChecker.css';

interface DependencyCheckerProps {
  systemCheck: SystemCheck | null;
  loading: boolean;
  error: string | null;
  onComplete: () => void;
  onRetry: () => void;
}

export function DependencyChecker({
  systemCheck,
  loading,
  error,
  onComplete,
  onRetry,
}: DependencyCheckerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss sau 2s nếu tất cả OK
  useEffect(() => {
    if (systemCheck?.all_ok && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [systemCheck, dismissed, onComplete]);

  if (dismissed) return null;

  return (
    <div className="dep-overlay">
      <div className="dep-card">
        <h2 className="dep-title">Kiểm Tra Hệ Thống</h2>
        <p className="dep-desc">KNReup đang kiểm tra các dependency cần thiết...</p>

        {error && (
          <div className="dep-error">
            <span className="dep-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading && !systemCheck && (
          <div className="dep-loading">
            <div className="dep-spinner" />
            <span>Đang kết nối tới backend...</span>
          </div>
        )}

        {systemCheck && (
          <div className="dep-list">
            {/* GPU */}
            <div className={`dep-item ${systemCheck.gpu.gpu_available ? 'ok' : 'warn'}`}>
              <span className="dep-icon">{systemCheck.gpu.gpu_available ? '✅' : '⚠️'}</span>
              <div className="dep-info">
                <span className="dep-label">GPU</span>
                <span className="dep-detail">{systemCheck.summary.gpu}</span>
              </div>
            </div>

            {/* CUDA */}
            {systemCheck.gpu.gpu_available && (
              <div className={`dep-item ${systemCheck.gpu.cuda_version ? 'ok' : 'warn'}`}>
                <span className="dep-icon">{systemCheck.gpu.cuda_version ? '✅' : '⚠️'}</span>
                <div className="dep-info">
                  <span className="dep-label">CUDA</span>
                  <span className="dep-detail">
                    {systemCheck.gpu.cuda_version
                      ? `CUDA ${systemCheck.gpu.cuda_version} — ${systemCheck.gpu.compute_type}`
                      : 'Không tìm thấy CUDA runtime'}
                  </span>
                </div>
              </div>
            )}

            {/* FFmpeg */}
            <div className={`dep-item ${systemCheck.ffmpeg.available ? 'ok' : 'fail'}`}>
              <span className="dep-icon">{systemCheck.ffmpeg.available ? '✅' : '❌'}</span>
              <div className="dep-info">
                <span className="dep-label">FFmpeg</span>
                <span className="dep-detail">{systemCheck.summary.ffmpeg}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        {systemCheck && (
          <div className="dep-footer">
            {systemCheck.all_ok ? (
              <span className="dep-ok-text">Tất cả OK — đang chuyển vào app...</span>
            ) : (
              <div className="dep-actions">
                <span className="dep-warn-text">Một số dependency chưa cài đặt</span>
                <button className="btn btn-primary" onClick={onRetry}>Kiểm tra lại</button>
                <button className="btn" onClick={() => { setDismissed(true); onComplete(); }}>
                  Tiếp tục
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
