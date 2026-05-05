import React from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { PaintBrush, Check, FilmSlate, Lightning, ArrowsLeftRight, ChartBar, ListBullets, Quotes, Flag } from '@phosphor-icons/react';

const THEMES = [
    {
        id: 'default',
        name: 'Modern Default',
        desc: 'Năng động, màu neon, phù hợp cho tin tức Tech/Gaming.',
        icon: Lightning,
        colors: ['#0f0f0f', '#1a1a2e', '#6366f1', '#a78bfa'],
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        desc: 'Tối giản, tinh tế, font chữ thanh lịch, tông màu sáng.',
        icon: PaintBrush,
        colors: ['#ffffff', '#f8fafc', '#94a3b8', '#334155'],
    },
    {
        id: 'brutalist',
        name: 'Brutalist',
        desc: 'Góc cạnh, viền đậm, font công nghiệp, độ tương phản cao.',
        icon: FilmSlate,
        colors: ['#000000', '#ffeb3b', '#ff3d00', '#ffffff'],
    }
];

export const StyleSelectStep: React.FC = () => {
    const { theme, setTheme, setStep, startRender } = useVideoGeneratorStore();

    return (
        <div className="vg-step-content">
            <div className="vg-step-title-row">
                <PaintBrush size={20} weight="bold" />
                <h3>Chọn Giao Diện (Theme)</h3>
            </div>
            <p className="vg-step-desc">
                Đây là các giao diện thiết kế tổng thể cho video. Tool sẽ áp dụng phong cách này cho tất cả các cảnh.
            </p>

            <div className="vg-style-grid">
                {THEMES.map((t) => {
                    const IconComp = t.icon;
                    return (
                        <div
                            key={t.id}
                            className={`vg-style-card ${theme === t.id ? 'selected' : ''}`}
                            onClick={() => setTheme(t.id)}
                        >
                            <div className={`vg-style-preview vg-theme-preview-${t.id}`}>
                                {theme === t.id && (
                                    <div className="vg-style-check">
                                        <Check size={18} weight="bold" />
                                    </div>
                                )}
                            </div>
                            <div className="vg-style-info">
                                <span className="vg-style-name">
                                    <IconComp size={14} weight="bold" style={{ marginRight: 4, opacity: 0.7 }} />
                                    {t.name}
                                </span>
                                <span className="vg-style-desc">{t.desc}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="vg-actions-row">
                <button className="vg-btn-secondary" onClick={() => setStep(3)}>
                    Quay Lại
                </button>
                <button className="vg-cta" onClick={startRender}>
                    <FilmSlate size={18} weight="bold" />
                    Bắt Đầu Render Video
                </button>
            </div>
        </div>
    );
};
