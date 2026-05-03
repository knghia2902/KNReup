import React from 'react';
import { useVideoGeneratorStore } from '../../stores/useVideoGeneratorStore';
import { PaintBrush, Check, FilmSlate, Lightning, ArrowsLeftRight, ChartBar, ListBullets, Quotes, Flag } from '@phosphor-icons/react';

const TEMPLATES = [
    {
        id: 'hook',
        name: 'Hook',
        desc: 'Mở đầu gây chú ý — headline + ảnh nền Ken Burns',
        icon: Lightning,
        colors: ['#0f0f0f', '#1a1a2e', '#6366f1', '#a78bfa'],
    },
    {
        id: 'comparison',
        name: 'Comparison',
        desc: 'So sánh 2 bên đối lập (VS layout)',
        icon: ArrowsLeftRight,
        colors: ['#0d0d0d', '#00f5d4', '#7b2ff7', '#f72585'],
    },
    {
        id: 'stat-hero',
        name: 'Stat Hero',
        desc: 'Số liệu lớn nổi bật giữa màn hình',
        icon: ChartBar,
        colors: ['#111827', '#22d3ee', '#dc2626', '#f59e0b'],
    },
    {
        id: 'feature-list',
        name: 'Feature List',
        desc: 'Tiêu đề + danh sách bullet points',
        icon: ListBullets,
        colors: ['#1c1917', '#a855f7', '#78350f', '#fef3c7'],
    },
    {
        id: 'callout',
        name: 'Callout',
        desc: 'Nhận định mạnh / cảnh báo với tag nổi bật',
        icon: Quotes,
        colors: ['#ff006e', '#fb5607', '#8338ec', '#ffbe0b'],
    },
    {
        id: 'outro',
        name: 'Outro',
        desc: 'CTA + TikTok follow card + nguồn bài viết',
        icon: Flag,
        colors: ['#f8fafc', '#334155', '#475569', '#ffffff'],
    },
];

export const StyleSelectStep: React.FC = () => {
    const { template, setTemplate, setStep, startRender } = useVideoGeneratorStore();

    return (
        <div className="vg-step-content">
            <div className="vg-step-title-row">
                <PaintBrush size={20} weight="bold" />
                <h3>Chọn Template Giao Diện</h3>
            </div>
            <p className="vg-step-desc">
                Đây là các template thiết kế mặc định lấy cảm hứng từ kênh công nghệ. Tool sẽ tự động map scene content vào layout tương ứng.
            </p>

            <div className="vg-style-grid">
                {TEMPLATES.map((t) => {
                    const IconComp = t.icon;
                    return (
                        <div
                            key={t.id}
                            className={`vg-style-card ${template === t.id ? 'selected' : ''}`}
                            onClick={() => setTemplate(t.id)}
                        >
                            <div className={`vg-style-preview vg-template-preview-${t.id}`}>
                                {template === t.id && (
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
