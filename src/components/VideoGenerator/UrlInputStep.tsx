import React, { useState } from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { Lightning, Faders, MagicWand } from '@phosphor-icons/react';

export const UrlInputStep: React.FC = () => {
    const { url, setUrl, generateScript, isScraping, isGeneratingScript } = useVideoGeneratorStore();
    const [mode, setMode] = useState<'quick' | 'advanced'>('quick');

    const handleStart = () => {
        generateScript();
    };

    return (
        <div className="vg-content-card">
            <h3>Nguồn nội dung</h3>
            <div className="vg-chips-group">
                <div 
                    className={`vg-chip ${mode === 'quick' ? 'active' : ''}`}
                    onClick={() => setMode('quick')}
                >
                    <Lightning size={14} weight="bold" style={{ marginRight: 4 }} />
                    Nhanh
                </div>
                <div 
                    className={`vg-chip ${mode === 'advanced' ? 'active' : ''}`}
                    onClick={() => setMode('advanced')}
                >
                    <Faders size={14} weight="bold" style={{ marginRight: 4 }} />
                    Chi Tiết
                </div>
            </div>
            
            <input 
                type="url" 
                className="vg-input" 
                placeholder="Dán URL bài viết vào đây..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isScraping || isGeneratingScript}
            />
            <button 
                className="vg-cta" 
                onClick={handleStart}
                disabled={!url || isScraping || isGeneratingScript}
            >
                <MagicWand size={18} weight="bold" />
                {isScraping || isGeneratingScript ? 'Đang phân tích & tạo kịch bản...' : 'Phân Tích Nội Dung'}
            </button>
        </div>
    );
};
