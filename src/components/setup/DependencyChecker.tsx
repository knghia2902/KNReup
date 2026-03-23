/**
 * DependencyChecker — taste-skill compliant
 * No emojis. Phosphor Icons. Liquid glass card.
 * Skeleton shimmer loading. Tactile feedback.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  CheckCircle, Warning, XCircle,
  Circuitry, FilmStrip, Cpu, CircleNotch,
} from '@phosphor-icons/react';
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
  systemCheck, loading, error, onComplete, onRetry,
}: DependencyCheckerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (systemCheck?.all_ok && !dismissed) {
      const timer = setTimeout(() => { setDismissed(true); onComplete(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [systemCheck, dismissed, onComplete]);

  if (dismissed) return null;

  return (
    <div className="dep-overlay">
      <div className="dep-card glass-panel">
        <div className="dep-header">
          <Cpu size={20} weight="duotone" className="dep-header-icon" />
          <div>
            <h2 className="dep-title">System Check</h2>
            <p className="dep-desc">Verifying dependencies...</p>
          </div>
        </div>

        {error && (
          <div className="dep-alert danger">
            <Warning size={14} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        {loading && !systemCheck && (
          <div className="dep-loading">
            <CircleNotch size={18} className="dep-spin" />
            <span>Connecting to backend...</span>
          </div>
        )}

        {systemCheck && (
          <div className="dep-list">
            <DepItem
              icon={<Circuitry size={16} weight="duotone" />}
              label="GPU"
              detail={systemCheck.gpu.gpu_available
                ? `${systemCheck.gpu.gpu_name} ${systemCheck.gpu.cuda_version ? `/ CUDA ${systemCheck.gpu.cuda_version}` : ''}`
                : 'Not found — CPU mode'}
              status={systemCheck.gpu.gpu_available ? 'ok' : 'warn'}
            />
            <DepItem
              icon={<FilmStrip size={16} weight="duotone" />}
              label="FFmpeg"
              detail={systemCheck.ffmpeg.available
                ? (systemCheck.ffmpeg.version?.split(' ').slice(0, 3).join(' ') || 'Installed')
                : 'Not installed'}
              status={systemCheck.ffmpeg.available ? 'ok' : 'fail'}
            />
          </div>
        )}

        {systemCheck && (
          <div className="dep-footer">
            {systemCheck.all_ok ? (
              <div className="dep-ok">
                <CheckCircle size={14} weight="fill" />
                <span>All clear</span>
              </div>
            ) : (
              <div className="dep-actions">
                <button className="dep-btn primary" onClick={onRetry}>Retry</button>
                <button className="dep-btn" onClick={() => { setDismissed(true); onComplete(); }}>
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DepItem({ icon, label, detail, status }: {
  icon: ReactNode; label: string; detail: string; status: 'ok' | 'warn' | 'fail';
}) {
  const StatusIcon = status === 'ok' ? CheckCircle : status === 'warn' ? Warning : XCircle;
  return (
    <div className={`dep-item ${status}`}>
      <div className="dep-item-icon">{icon}</div>
      <div className="dep-item-info">
        <span className="dep-item-label">{label}</span>
        <span className="dep-item-detail">{detail}</span>
      </div>
      <StatusIcon size={14} weight="fill" className={`dep-status-icon ${status}`} />
    </div>
  );
}

