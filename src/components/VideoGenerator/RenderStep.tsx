import React from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { PlayCircle, Plus } from '@phosphor-icons/react';

export const RenderStep: React.FC = () => {
    const { renderProgress, renderStatus, videoUrl, reset } = useVideoGeneratorStore();

    return (
        <div className="vg-content-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <h3>{videoUrl ? '✨ Video đã sẵn sàng!' : 'Đang render video...'}</h3>
            
            {!videoUrl && (
                <div style={{ width: '100%', maxWidth: 400 }}>
                    <div className="vg-progress">
                        <div 
                            className="vg-progress-fill" 
                            style={{ width: `${Math.max(0, Math.min(100, renderProgress))}%` }}
                        ></div>
                    </div>
                    <div className="vg-progress-label">
                        {renderStatus || 'Đang khởi tạo...'} ({Math.round(renderProgress)}%)
                    </div>
                </div>
            )}

            {videoUrl && (
                <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
                    <button className="vg-cta" onClick={() => window.open(videoUrl, '_blank')}>
                        <PlayCircle size={18} weight="bold" />
                        Xem Video
                    </button>
                    <button className="vg-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={reset}>
                        <Plus size={16} weight="bold" />
                        Tạo Video Mới
                    </button>
                </div>
            )}
        </div>
    );
};
