/**
 * SmartCropControls — Sliders & action buttons for Smart Crop.
 * Supports Auto mode (Export) and Manual mode (Analyze → Review → Render).
 */
import { type FC } from 'react';

interface SmartCropControlsProps {
  alpha: number;
  deadZone: number;
  detectEvery: number;
  fallbackCenter: boolean;
  onAlphaChange: (v: number) => void;
  onDeadZoneChange: (v: number) => void;
  onDetectEveryChange: (v: number) => void;
  onFallbackCenterChange: (v: boolean) => void;
  onExport: () => void;
  onOpenEditor: () => void;
  isProcessing: boolean;
  hasOutput: boolean;
  disabled?: boolean;
  // Manual mode props
  mode: 'auto' | 'manual';
  manualStage: 'idle' | 'analyzing' | 'review' | 'rendering' | 'done';
  onAnalyze: () => void;
  onRender: () => void;
  onReanalyze: () => void;
  outWidth: number;
  outHeight: number;
  onResolutionChange: (w: number, h: number) => void;
}

export const SmartCropControls: FC<SmartCropControlsProps> = ({
  alpha, deadZone, detectEvery, fallbackCenter,
  onAlphaChange, onDeadZoneChange, onDetectEveryChange, onFallbackCenterChange,
  onExport, onOpenEditor,
  isProcessing, hasOutput, disabled,
  mode, manualStage, onAnalyze, onRender, onReanalyze,
  outWidth, outHeight, onResolutionChange,
}) => {
  return (
    <div className="sc-controls sc-animate-in">
      {/* AI Settings - Only visible before analysis */}
      {(mode === 'auto' || manualStage === 'idle') && (
        <>
          {/* Alpha / Smoothing */}
          <div className="sc-control-group">
            <span className="sc-control-label">Độ mượt camera</span>
            <div className="sc-control-row">
              <input
                type="range" min={0.01} max={0.50} step={0.01}
                value={alpha}
                onChange={(e) => onAlphaChange(+e.target.value)}
                disabled={disabled || isProcessing}
              />
              <span className="sc-control-value">{alpha.toFixed(2)}</span>
            </div>
          </div>

          {/* Dead Zone */}
          <div className="sc-control-group">
            <span className="sc-control-label">Vùng an toàn</span>
            <div className="sc-control-row">
              <input
                type="range" min={0.01} max={0.20} step={0.01}
                value={deadZone}
                onChange={(e) => onDeadZoneChange(+e.target.value)}
                disabled={disabled || isProcessing}
              />
              <span className="sc-control-value">{deadZone.toFixed(2)}</span>
            </div>
          </div>

          {/* Detect Every N frames */}
          <div className="sc-control-group">
            <span className="sc-control-label">Nhận diện mỗi</span>
            <div className="sc-control-row">
              <input
                type="range" min={1} max={10} step={1}
                value={detectEvery}
                onChange={(e) => onDetectEveryChange(+e.target.value)}
                disabled={disabled || isProcessing}
              />
              <span className="sc-control-value">{detectEvery} fr</span>
            </div>
          </div>

          {/* Fallback Center */}
          <label className="sc-toggle-row">
            <input
              type="checkbox"
              checked={fallbackCenter}
              onChange={(e) => onFallbackCenterChange(e.target.checked)}
              disabled={disabled || isProcessing}
            />
            Fix giữa nếu mất mặt
          </label>
        </>
      )}

      {/* Resolution dropdown — Manual mode review/done only */}
      {mode === 'manual' && (manualStage === 'review' || manualStage === 'done') && (
        <div className="sc-control-group">
          <span className="sc-control-label">Output Resolution</span>
          <select
            className="sc-select"
            value={`${outWidth}x${outHeight}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              onResolutionChange(w, h);
            }}
            disabled={isProcessing}
          >
            <option value="1080x1920">1080×1920 (Full HD)</option>
            <option value="720x1280">720×1280 (HD)</option>
          </select>
        </div>
      )}

      {/* Action Buttons — mode-aware */}
      <div className="sc-actions">
        {mode === 'auto' ? (
          <>
            <button className="sc-btn primary" onClick={onExport} disabled={disabled || isProcessing}>
              💾 Export 9:16
            </button>
            {hasOutput && (
              <button className="sc-btn" onClick={onOpenEditor}>→ Mở trong Editor</button>
            )}
          </>
        ) : (
          <>
            {(manualStage === 'idle') && (
              <button className="sc-btn primary" onClick={onAnalyze} disabled={disabled || isProcessing}>
                🔍 Analyze
              </button>
            )}
            {manualStage === 'analyzing' && (
              <button className="sc-btn primary" disabled>
                ⏳ Đang phân tích...
              </button>
            )}
            {manualStage === 'review' && (
              <>
                <button className="sc-btn" onClick={onReanalyze} disabled={isProcessing}>
                  🔄 Re-analyze
                </button>
                <button className="sc-btn primary" onClick={onRender} disabled={disabled || isProcessing}>
                  ⬇ Render
                </button>
              </>
            )}
            {manualStage === 'rendering' && (
              <button className="sc-btn primary" disabled>
                ⏳ Đang render...
              </button>
            )}
            {manualStage === 'done' && (
              <>
                <button className="sc-btn" onClick={onRender} disabled={isProcessing}>
                  🔄 Re-render
                </button>
                <button className="sc-btn" onClick={onOpenEditor}>→ Mở trong Editor</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
