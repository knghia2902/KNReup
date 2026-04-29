/**
 * SmartCropLayout — Main layout with Before/After preview panels.
 */
import { type FC, type RefObject } from 'react';

interface SmartCropLayoutProps {
  inputVideoUrl: string | null;
  outputVideoUrl: string | null;
  inputRef: RefObject<HTMLVideoElement | null>;
  outputRef: RefObject<HTMLVideoElement | null>;
}

export const SmartCropLayout: FC<SmartCropLayoutProps> = ({
  inputVideoUrl,
  outputVideoUrl,
  inputRef,
  outputRef,
}) => {
  return (
    <div className="sc-preview-grid sc-animate-in">
      {/* Before — 16:9 panel */}
      <div className="sc-preview-panel before">
        <span className="sc-preview-label">16:9 · Gốc</span>
        {inputVideoUrl ? (
          <video
            ref={inputRef}
            src={inputVideoUrl}
            controls
            muted
            playsInline
          />
        ) : (
          <div className="sc-preview-empty">Chưa có video gốc</div>
        )}
      </div>

      {/* After — 9:16 panel */}
      <div className="sc-preview-panel after">
        <span className="sc-preview-label">9:16 · Đã crop</span>
        {outputVideoUrl ? (
          <video
            ref={outputRef}
            src={outputVideoUrl}
            controls
            muted
            playsInline
          />
        ) : (
          <div className="sc-preview-empty">Đang chờ xử lý...</div>
        )}
      </div>
    </div>
  );
};
