/**
 * SmartCropLayout — Main layout with Before/After preview panels.
 * Before panel wraps video + CropOverlay for manual review mode.
 */
import { type FC, type RefObject, useEffect } from 'react';
import { CropOverlay, type Keyframe } from './CropOverlay';
import { CropTimeline } from './CropTimeline';
import { CropLivePreview } from './CropLivePreview';

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
  // Sync output video with input video
  useEffect(() => {
    const input = inputRef.current;
    const output = outputRef.current;
    if (!input || !output) return;

    const handlePlay = () => output.play().catch(() => {});
    const handlePause = () => output.pause();
    const handleSeek = () => { output.currentTime = input.currentTime; };

    input.addEventListener('play', handlePlay);
    input.addEventListener('pause', handlePause);
    input.addEventListener('seeked', handleSeek);
    input.addEventListener('seeking', handleSeek);
    
    return () => {
      input.removeEventListener('play', handlePlay);
      input.removeEventListener('pause', handlePause);
      input.removeEventListener('seeked', handleSeek);
      input.removeEventListener('seeking', handleSeek);
    };
  }, [inputRef, outputRef, outputVideoUrl]);
  return (
    <>
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
          </div>
        ) : (
          <div className="sc-preview-empty">Chưa có video gốc</div>
        )}
      </div>

      {/* After — 9:16 panel */}
      <div className="sc-preview-panel after">
        <span className="sc-preview-label">9:16 · Live / KQ</span>
        {outputVideoUrl ? (
          <video
            ref={outputRef}
            src={outputVideoUrl}
            muted
            playsInline
          />
        ) : showOverlay ? (
          <CropLivePreview 
            videoRef={inputRef}
            trackingData={trackingData}
            keyframes={keyframes}
            enabled={true}
          />
        ) : (
          <div className="sc-preview-empty">Đang chờ xử lý...</div>
        )}
      </div>
    </div>
    {/* Full-width Timeline below the grid */}
    {inputVideoUrl && (
      <CropTimeline
        videoRef={inputRef}
        trackingData={trackingData}
        keyframes={keyframes}
        onKeyframeDelete={onKeyframeDelete}
        enabled={showOverlay}
      />
    )}
    </>
  );
};
