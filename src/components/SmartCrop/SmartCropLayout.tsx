/**
 * SmartCropLayout — Main layout with Before/After preview panels.
 * Before panel wraps video + CropOverlay for manual review mode.
 */
import { type FC, type RefObject, useEffect, useState } from 'react';
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
  const [cropLayout, setCropLayout] = useState<'vertical' | 'split' | 'spotlight' | 'centered' | 'horizontal'>('vertical');

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
        <div className="sc-preview-header">
          <div className="sc-preview-label">
            <span className="sc-preview-label-title">Position the Crop</span>
            <span className="sc-preview-label-subtitle">Click or drag to position. Drag edges to resize.</span>
          </div>
          <div className="sc-layout-toolbar">
            <button className={cropLayout === 'vertical' ? 'active' : ''} onClick={() => setCropLayout('vertical')}>Vertical</button>
            <button className={cropLayout === 'split' ? 'active' : ''} onClick={() => setCropLayout('split')}>Split</button>
            <button className={cropLayout === 'spotlight' ? 'active' : ''} onClick={() => setCropLayout('spotlight')}>Spotlight</button>
            <button className={cropLayout === 'centered' ? 'active' : ''} onClick={() => setCropLayout('centered')}>Centered</button>
            <button className={cropLayout === 'horizontal' ? 'active' : ''} onClick={() => setCropLayout('horizontal')}>Horizontal</button>
          </div>
        </div>
        
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
                cropLayout={cropLayout}
              />
            </div>
          </div>
        ) : (
          <div className="sc-preview-empty">Chưa có video gốc</div>
        )}
      </div>

      {/* After — 9:16 panel */}
      <div className="sc-preview-panel after">
        <div className="sc-preview-header">
          <div className="sc-preview-label">
            <span className="sc-preview-label-title">Preview (9:16)</span>
          </div>
        </div>
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
            cropLayout={cropLayout}
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
