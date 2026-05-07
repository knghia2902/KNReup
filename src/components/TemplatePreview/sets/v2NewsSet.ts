import { SmartTemplate, ThemePalette, el } from '../templateData';
import type { TemplateSet } from './index';

// Helper to get persistent shell HTML
const getShellHtml = (d: any) => `
    <div class="shell-bg"></div>
    <div class="brand-shell-header">
      <div class="brand-icon">&gt;_</div>
      <div class="brand-text">
        <div class="brand-name">${d.channelName || 'KNReup News'}</div>
        <div class="brand-tag">TIN CÔNG NGHỆ</div>
      </div>
    </div>
    <div class="brand-shell-handle">
      <span class="handle-music">&#9835;</span>
      <span class="handle-text">@knreup</span>
    </div>
    <div class="brand-shell-keyword">
      <span>${d.source || 'vnexpress.net'}</span>
    </div>
`;

// ── V2 VISUAL SYSTEM TEMPLATES ──────────────────────────────────────────────
export const V2_NEWS_TEMPLATES: SmartTemplate[] = [
    {
        id: 'hook', name: 'Hook', icon: '⚡', desc: 'Headline + Ken Burns BG',
        sampleData: { 
            headline: 'TIẾN SĨ TOÁN GỐC NGA BIẾN AI THÀNH CỖ MÁY', 
            subhead: 'Công nghệ AI đang mở ra kỷ nguyên mới về...',
            bgSrc: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080&h=1920&fit=crop'
        },
        render(c, d, theme) {
            c.style.padding = '0'; // reset default padding
            
            const bgHtml = d.bgSrc 
                ? `<div class="bg-blur" style="position: absolute; inset: 0; background-image: url('${d.bgSrc}'); background-size: cover; background-position: center; filter: blur(35px); opacity: 0.4; transform: scale(1.1); z-index: 0;"></div>
                   <div class="bg" style="background-image: url('${d.bgSrc}'); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1040px; height: 585px; background-size: cover; background-position: center; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); z-index: 1;"></div>`
                : `<div class="bg gradient-news-dark" style="position: absolute; inset: 0; z-index: 1;"></div>`;
                
            c.innerHTML = getShellHtml(d) + `
                ${bgHtml}
                <div class="overlay" style="opacity: 0.1; position: absolute; inset: 0; background: #000; z-index: 2;"></div>
                <div class="layout-hook" style="position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 200px 80px 300px; text-align: center;">
                    <div class="hook-headline">${d.headline}</div>
                    ${d.subhead ? `<div class="hook-subhead">${d.subhead}</div>` : ''}
                </div>
            `;
        },
        animate(c, tl) {
            const h = c.querySelector('.hook-headline');
            const s = c.querySelector('.hook-subhead');
            if (h) tl.fromTo(h, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 0.15);
            if (s) tl.fromTo(s, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.55);
        }
    },
    {
        id: 'stat-hero', name: 'Stat Hero', icon: '📊', desc: 'Big number highlight',
        sampleData: { value: '97%', label: 'Người dùng hài lòng', context: 'Khảo sát Q4 2025' },
        render(c, d, theme) {
            c.style.padding = '0';
            c.innerHTML = getShellHtml(d) + `
                <div class="layout-stat-hero" style="position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 80px;">
                    <div class="stat-value">${d.value}</div>
                    <div class="stat-label">${d.label}</div>
                    ${d.context ? `<div class="stat-context">${d.context}</div>` : ''}
                </div>
            `;
        },
        animate(c, tl) {
            const v = c.querySelector('.stat-value');
            const l = c.querySelector('.stat-label');
            const ctx = c.querySelector('.stat-context');
            if (v) tl.fromTo(v, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 0.15);
            if (l) tl.fromTo(l, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.55);
            if (ctx) tl.fromTo(ctx, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.85);
        }
    },
    {
        id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'VS side-by-side',
        sampleData: { left: { label: 'iPhone 16', value: '$799', color: 'cyan' }, right: { label: 'Galaxy S25', value: '$749', color: 'purple', winner: true } },
        render(c, d, theme) {
            c.style.padding = '0';
            const lc = d.left.color || 'cyan';
            const rc = d.right.color || 'purple';
            const win = d.right.winner ? ' card-winner' : '';
            c.innerHTML = getShellHtml(d) + `
                <div class="layout-comparison" style="position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 80px; gap: 40px;">
                    <div class="cmp-card cmp-left color-${lc}">
                        <div class="cmp-label">${d.left.label}</div>
                        <div class="cmp-value">${d.left.value}</div>
                    </div>
                    <div class="cmp-vs">VS</div>
                    <div class="cmp-card cmp-right color-${rc}${win}">
                        <div class="cmp-label">${d.right.label}</div>
                        <div class="cmp-value">${d.right.value}</div>
                        ${d.right.winner ? '<div class="cmp-winner-badge">WINNER</div>' : ''}
                    </div>
                </div>
            `;
        },
        animate(c, tl) {
            const leftCard = c.querySelector('.cmp-left');
            const vs = c.querySelector('.cmp-vs');
            const rightCard = c.querySelector('.cmp-right');
            if (leftCard) tl.fromTo(leftCard, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, 0.15);
            if (vs) tl.fromTo(vs, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35 }, 0.45);
            if (rightCard) tl.fromTo(rightCard, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, 0.6);
        }
    },
    {
        id: 'feature-list', name: 'Feature List', icon: '📋', desc: 'Title + bullet points',
        sampleData: { title: 'Tính năng nổi bật', bullets: ['AI tự động phân tích', 'Render real-time 4K', 'Export đa nền tảng', 'Chỉnh sửa không phá hủy'] },
        render(c, d, theme) {
            c.style.padding = '0';
            const bulletsHtml = d.bullets.map((b: string, i: number) => `
                <div class="feat-bullet feat-bullet-${i}">
                    <div class="feat-dot"></div>
                    <div class="feat-text">${b}</div>
                </div>
            `).join('');

            c.innerHTML = getShellHtml(d) + `
                <div class="layout-feature-list" style="position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; justify-content: center; padding: 120px 80px;">
                    <div class="feat-card">
                        <div class="feat-title">${d.title}</div>
                        <div class="feat-rule"></div>
                        <div class="feat-bullets">
                            ${bulletsHtml}
                        </div>
                    </div>
                </div>
            `;
        },
        animate(c, tl) {
            const card = c.querySelector('.feat-card');
            const rule = c.querySelector('.feat-rule');
            const bullets = c.querySelectorAll('.feat-bullet');
            
            if (card) tl.fromTo(card, { y: 60, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5 }, 0.1);
            if (rule) tl.fromTo(rule, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.4 }, 0.45);
            bullets.forEach((b, i) => {
                tl.fromTo(b, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, 0.6 + i * 0.15);
            });
        }
    },
    {
        id: 'callout', name: 'Callout', icon: '🔔', desc: 'Bold statement + tag',
        sampleData: { tag: 'CẢNH BÁO', statement: 'Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12' },
        render(c, d, theme) {
            c.style.padding = '0';
            c.innerHTML = getShellHtml(d) + `
                <div class="layout-callout" style="position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; justify-content: center; padding: 100px 80px;">
                    <div class="callout-card">
                        ${d.tag ? `<div class="callout-tag">${d.tag}</div>` : ''}
                        <div class="callout-statement">${d.statement}</div>
                    </div>
                </div>
            `;
        },
        animate(c, tl) {
            const card = c.querySelector('.callout-card');
            if (card) tl.fromTo(card, { y: 50, scale: 0.92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55 }, 0.2);
        }
    },
    {
        id: 'outro', name: 'Outro', icon: '🎬', desc: 'CTA + follow card',
        sampleData: { ctaTop: 'THEO DÕI NGAY', channelName: 'KNReup News', source: 'vnexpress.net' },
        render(c, d, theme) {
            c.style.padding = '0';
            c.innerHTML = getShellHtml(d) + `
                <div class="layout-outro" style="position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; padding: 300px 80px 200px;">
                    <div class="out-cta-top">${d.ctaTop}</div>
                    <div class="out-channel">${d.channelName}</div>
                    <div class="out-underline"></div>
                    <div class="out-source">Nguồn: ${d.source}</div>
                </div>
                <div id="tt-card" class="tt-card">
                    <img class="tt-avatar" src="assets/avatar.png" alt="Avatar" crossorigin="anonymous" />
                    <div class="tt-profile-info">
                        <div class="tt-display-name">${d.channelName}</div>
                        <div class="tt-handle">@knreup</div>
                        <div class="tt-followers">1.2M followers</div>
                    </div>
                    <div id="tt-follow-btn" class="tt-follow-btn">
                        <span id="tt-btn-follow" class="tt-btn-text">Follow</span>
                        <span id="tt-btn-following" class="tt-btn-text tt-btn-text-following" style="opacity: 0; position: absolute;">
                            <span>Following</span>
                            <span class="tt-check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                        </span>
                    </div>
                </div>
            `;
        },
        animate(c, tl) {
            const cta = c.querySelector('.out-cta-top');
            const channel = c.querySelector('.out-channel');
            const underline = c.querySelector('.out-underline');
            const source = c.querySelector('.out-source');
            
            if (cta) tl.fromTo(cta, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.45 }, 0.2);
            if (channel) tl.fromTo(channel, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55 }, 0.55);
            if (underline) tl.fromTo(underline, { width: 0 }, { width: "600px", duration: 0.5 }, 0.9);
            if (source) tl.fromTo(source, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, 1.3);

            const ttCard = c.querySelector('#tt-card');
            const ttBtn = c.querySelector('#tt-follow-btn');
            const ttFollow = c.querySelector('#tt-btn-follow');
            const ttFollowing = c.querySelector('#tt-btn-following');
            const ttBase = 1.6;

            if (ttCard) tl.fromTo(ttCard, { opacity: 0, y: 300, xPercent: -50 }, { opacity: 1, y: 0, xPercent: -50, duration: 0.5 }, ttBase);
            if (ttBtn) {
                tl.to(ttBtn, { scale: 0.92, duration: 0.15 }, ttBase + 0.9);
                tl.to(ttBtn, { scale: 1, duration: 0.4 }, ttBase + 1.05);
            }
            if (ttFollow) tl.to(ttFollow, { opacity: 0, duration: 0.08 }, ttBase + 1.05);
            if (ttFollowing) tl.to(ttFollowing, { opacity: 1, duration: 0.08 }, ttBase + 1.08);
            if (ttCard) tl.to(ttCard, { scale: 1.08, duration: 2.0 }, ttBase + 1.3); // Slow zoom
        }
    }
];

export const V2_NEWS_SET: TemplateSet = {
    id: 'v2-news',
    name: 'V2 Visual System',
    description: 'Advanced Tech News Style (Repo Test template)',
    templates: V2_NEWS_TEMPLATES,
};
