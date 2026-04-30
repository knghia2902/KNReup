/**
 * SmartCropLayout — Main layout with Before/After preview panels.
 * Before panel wraps video + CropOverlay for manual review mode.
 */
import { type FC, type RefObject } from 'react';
import { CropOverlay, type Keyframe } from './CropOverlay';
import { CropTimeline } from './CropTimeline';

interface SmartCropLayoutProps {
  inputVideoUrl: string | null;
  outputVideoUrl: string | null;
  inputRef: RefObject<HTMLVideoElement | null>;
  outputRef: RefObject<HTMLVideoElement | null>;
  trackingData: any | null;
  keyframes: Keyframe[];
  onKeyframeAdd: (kf: Keyframe) => void;
  onKeyframeDelete: (frameIdx: number) => void;
  showOverlay: boolean;
}

export const SmartCropLayout: FC<SmartCropLayoutProps> = ({
  inputVideoUrl,
  outputVideoUrl,
  inputRef,
  outputRef,
  trackingData,
  keyframes,
  onKeyframeAdd,
  onKeyframeDelete,
  showOverlay,
}) => {
  return (
    <div className="sc-preview-grid sc-animate-in">
      {/* Before — 16:9 panel */}
      <div className="sc-preview-panel before">
        <span className="sc-preview-label">16:9 · Gốc</span>
        {inputVideoUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <div className="sc-video-overlay-container" style={{ flex: 1, minHeight: 0 }}>
              <video
                ref={inputRef}
                src={inputVideoUrl}
                controls
                muted
                playsInline
              />
              <CropOverlay
                videoRef={inputRef}
                trackingData={trackingData}
                keyframes={keyframes}
                onKeyframeAdd={onKeyframeAdd}
                onKeyframeDelete={onKeyframeDelete}
                enabled={showOverlay}
              />
            </div>
            {showOverlay && (
              <CropTimeline
                videoRef={inputRef}
                trackingData={trackingData}
                keyframes={keyframes}
                onKeyframeDelete={onKeyframeDelete}
                enabled={showOverlay}
              />
            )}
          </div>
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
