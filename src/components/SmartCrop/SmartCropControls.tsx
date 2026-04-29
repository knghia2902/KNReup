/**
 * SmartCropControls — Sliders & action buttons for Smart Crop.
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
}

export const SmartCropControls: FC<SmartCropControlsProps> = ({
  alpha, deadZone, detectEvery, fallbackCenter,
  onAlphaChange, onDeadZoneChange, onDetectEveryChange, onFallbackCenterChange,
  onExport, onOpenEditor,
  isProcessing, hasOutput, disabled,
}) => {
  return (
    <div className="sc-controls sc-animate-in">
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

      {/* Action Buttons */}
      <div className="sc-actions">
        <button
          className="sc-btn primary"
          onClick={onExport}
          disabled={disabled || isProcessing}
        >
          💾 Export 9:16
        </button>

        {hasOutput && (
          <button className="sc-btn" onClick={onOpenEditor}>
            → Mở trong Editor
          </button>
        )}
      </div>
    </div>
  );
};
