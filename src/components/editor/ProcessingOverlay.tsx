/**
 * ProcessingOverlay — full-screen processing indicator with SSE progress.
 * No emojis. Phosphor Icons. Conic-gradient progress ring.
 */
import { CheckCircle, XCircle, X as XIcon } from '@phosphor-icons/react';
import type { PipelineProgress } from '../../hooks/usePipeline';
import './ProcessingOverlay.css';

const STAGE_LABELS: Record<string, string> = {
  upload: 'Uploading',
  transcribe: 'Transcribing',
  translate: 'Translating',
  tts: 'Generating Speech',
  merge: 'Building Video',
  done: 'Complete',
  error: 'Error',
  cancelled: 'Cancelled',
};

interface ProcessingOverlayProps {
  progress: PipelineProgress;
  onCancel: () => void;
}

export function ProcessingOverlay({ progress, onCancel }: ProcessingOverlayProps) {
  const isDone = progress.stage === 'done';
  const isError = progress.stage === 'error';
  const pct = Math.max(0, Math.min(100, progress.progress));

  return (
    <div className="processing-overlay">
      <div className="processing-card">
        {/* Progress ring */}
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(
              var(--accent) ${pct * 3.6}deg,
              var(--surface-2) ${pct * 3.6}deg
            )`,
          }}
        >
          <div className="progress-ring-inner">
            {isDone ? (
              <CheckCircle size={32} weight="fill" className="progress-icon-done" />
            ) : isError ? (
              <XCircle size={32} weight="fill" className="progress-icon-error" />
            ) : (
              <span className="progress-pct font-mono">{pct}%</span>
            )}
          </div>
        </div>

        {/* Stage info */}
        <div className="progress-stage">
          {STAGE_LABELS[progress.stage] || progress.stage}
        </div>
        <div className="progress-message">{progress.message}</div>

        {/* Stage badges */}
        <div className="stage-badges">
          {['transcribe', 'translate', 'tts', 'merge'].map((s) => (
            <span
              key={s}
              className={`stage-badge ${
                progress.stage === s
                  ? 'active'
                  : pct > 0 && ['transcribe', 'translate', 'tts', 'merge'].indexOf(s) <
                    ['transcribe', 'translate', 'tts', 'merge'].indexOf(progress.stage)
                  ? 'completed'
                  : ''
              }`}
            >
              {s === 'transcribe' && 'ASR'}
              {s === 'translate' && 'Translate'}
              {s === 'tts' && 'TTS'}
              {s === 'merge' && 'Merge'}
            </span>
          ))}
        </div>

        {/* Cancel button */}
        {!isDone && !isError && (
          <button className="processing-cancel" onClick={onCancel}>
            <XIcon size={14} weight="bold" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
