import { SmartTemplate, ThemePalette, el } from '../templateData';
import type { TemplateSet } from './index';

// Helper to apply News fonts
function applyNewsFonts(el: HTMLElement, type: 'headline' | 'body') {
    if (type === 'headline') {
        el.style.fontFamily = "'Inter', sans-serif";
        el.style.fontWeight = '800';
        el.style.textTransform = 'uppercase';
    } else {
        el.style.fontFamily = "'Inter', sans-serif";
        el.style.fontWeight = '500';
    }
}

// Helper to create a lower-third container
function createLowerThird(c: HTMLElement, theme: ThemePalette): HTMLElement {
    c.style.justifyContent = 'flex-end';
    c.style.padding = '0';
    
    const lowerThird = el('div', 'news-lower-third');
    lowerThird.style.width = '100%';
    lowerThird.style.background = `linear-gradient(to right, ${theme.surface}f0, ${theme.surface}cc)`;
    lowerThird.style.borderLeft = `12px solid ${theme.accent}`;
    lowerThird.style.padding = '40px 60px';
    lowerThird.style.position = 'relative';
    lowerThird.style.marginBottom = '80px';
    
    c.appendChild(lowerThird);
    return lowerThird;
}

export const NEWS_BROADCAST_TEMPLATES: SmartTemplate[] = [
    {
        id: 'hook', name: 'Hook', icon: '⚡', desc: 'Headline + Ken Burns BG',
        sampleData: { headline: 'APPLE ĐÃ LÀM GÌ MÀ CẢ THẾ GIỚI SỐC?', subhead: 'Sự thật đằng sau thương vụ tỷ đô' },
        render(c, d, theme) {
            const lt = createLowerThird(c, theme);
            
            const tag = el('div', 'news-breaking-bar', 'BREAKING NEWS');
            tag.style.background = theme.accent;
            tag.style.color = theme.bg;
            tag.style.display = 'inline-block';
            tag.style.padding = '8px 16px';
            applyNewsFonts(tag, 'headline');
            tag.style.fontSize = '24px';
            tag.style.marginBottom = '16px';
            
            const h = el('div', 'news-headline', d.headline); 
            h.style.color = theme.text;
            applyNewsFonts(h, 'headline');
            h.style.fontSize = '64px';
            h.style.lineHeight = '1.1';
            
            lt.appendChild(tag);
            lt.appendChild(h);
            
            if (d.subhead) {
                const s = el('div', 'news-subhead', d.subhead); 
                s.style.color = theme.muted;
                applyNewsFonts(s, 'body');
                s.style.fontSize = '32px';
                s.style.marginTop = '16px';
                lt.appendChild(s);
            }
        },
        animate(c, tl) {
            const lt = c.querySelector('.news-lower-third');
            const tag = c.querySelector('.news-breaking-bar');
            const h = c.querySelector('.news-headline');
            const s = c.querySelector('.news-subhead');
            
            if (lt) tl.fromTo(lt, { x: '-100%' }, { x: '0%', duration: 0.6, ease: 'power3.out' });
            if (tag) tl.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.2');
            if (h) tl.fromTo(h, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1');
            if (s) tl.fromTo(s, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
        }
    },
    {
        id: 'stat-hero', name: 'Stat Hero', icon: '📊', desc: 'Big number highlight',
        sampleData: { value: '97%', label: 'Người dùng hài lòng', context: 'Khảo sát Q4 2025' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.padding = '80px';
            
            const panel = el('div', 'news-stat-panel');
            panel.style.background = theme.surface;
            panel.style.borderTop = `8px solid ${theme.accent}`;
            panel.style.padding = '60px';
            panel.style.width = '100%';
            panel.style.textAlign = 'center';
            
            const v = el('div', 'news-stat-value', d.value); v.style.color = theme.text;
            applyNewsFonts(v, 'headline');
            v.style.fontSize = '180px';
            
            const ticker = el('div', 'news-ticker-strip');
            ticker.style.background = theme.accent;
            ticker.style.color = theme.bg;
            ticker.style.padding = '16px';
            ticker.style.marginTop = '20px';
            applyNewsFonts(ticker, 'headline');
            ticker.style.fontSize = '32px';
            ticker.textContent = (d.label as string).toUpperCase();
            
            panel.appendChild(v); panel.appendChild(ticker);
            c.appendChild(panel);
            
            if (d.context) {
                const ctx = el('div', 'news-stat-context', d.context); 
                ctx.style.color = theme.muted;
                applyNewsFonts(ctx, 'body');
                ctx.style.fontSize = '24px';
                ctx.style.marginTop = '24px';
                panel.appendChild(ctx);
            }
        },
        animate(c, tl) {
            const panel = c.querySelector('.news-stat-panel');
            const v = c.querySelector('.news-stat-value');
            const ticker = c.querySelector('.news-ticker-strip');
            
            if (panel) tl.fromTo(panel, { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 0.5, ease: 'power3.out' });
            if (v) tl.fromTo(v, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)' }, '-=0.2');
            if (ticker) tl.fromTo(ticker, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2');
        }
    },
    {
        id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'VS side-by-side',
        sampleData: { left: { label: 'iPhone 16', value: '$799' }, right: { label: 'Galaxy S25', value: '$749' } },
        render(c, d, theme) {
            c.style.padding = '80px 40px';
            const w = el('div', 'news-comparison-wrapper');
            w.style.display = 'flex';
            w.style.flexDirection = 'column';
            w.style.gap = '20px';
            w.style.width = '100%';
            
            const createSide = (data: any, color: string) => {
                const side = el('div', 'news-comp-side');
                side.style.background = theme.surface;
                side.style.borderLeft = `12px solid ${color}`;
                side.style.padding = '40px';
                side.style.display = 'flex';
                side.style.justifyContent = 'space-between';
                side.style.alignItems = 'center';
                
                side.innerHTML = `<div class="news-comp-label" style="font-family:'Inter',sans-serif;font-weight:800;font-size:40px;color:${theme.text};text-transform:uppercase;">${data.label}</div>
                                  <div class="news-comp-value" style="font-family:'Inter',sans-serif;font-weight:800;font-size:64px;color:${color}">${data.value}</div>`;
                return side;
            };
            
            const l = createSide(d.left, theme.accent);
            const vs = el('div', 'news-comp-vs', 'VS');
            applyNewsFonts(vs, 'headline');
            vs.style.fontSize = '40px';
            vs.style.color = theme.bg;
            vs.style.background = theme.text;
            vs.style.alignSelf = 'center';
            vs.style.padding = '8px 24px';
            
            const r = createSide(d.right, theme.secondary || theme.muted);
            
            w.appendChild(l); w.appendChild(vs); w.appendChild(r);
            c.appendChild(w);
        },
        animate(c, tl) {
            const w = c.querySelector('.news-comparison-wrapper');
            if (!w) return;
            tl.fromTo(w.children[0], { x: '-100%', opacity: 0 }, { x: '0%', opacity: 1, duration: 0.6, ease: 'power3.out' });
            tl.fromTo(w.children[2], { x: '100%', opacity: 0 }, { x: '0%', opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4');
            tl.fromTo(w.children[1], { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.2');
        }
    },
    {
        id: 'feature-list', name: 'Feature List', icon: '📋', desc: 'Title + bullet points',
        sampleData: { title: 'Tính năng nổi bật', bullets: ['AI tự động phân tích', 'Render real-time 4K', 'Export đa nền tảng', 'Chỉnh sửa không phá hủy'] },
        render(c, d, theme) {
            c.style.padding = '80px 40px';
            const lt = el('div', 'news-lt-header');
            lt.style.background = theme.accent;
            lt.style.padding = '20px 40px';
            lt.style.width = '100%';
            lt.style.marginBottom = '40px';
            
            const t = el('div', 'news-feature-title', d.title); t.style.color = theme.bg;
            applyNewsFonts(t, 'headline');
            t.style.fontSize = '48px';
            lt.appendChild(t);
            c.appendChild(lt);
            
            const list = el('div', 'news-feature-list');
            list.style.width = '100%';
            d.bullets.forEach((b: string) => {
                const item = el('div', 'news-feature-item');
                item.style.background = theme.surface;
                item.style.borderBottom = `2px solid ${theme.bg}`;
                item.style.padding = '30px 40px';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                
                const dot = el('div', 'news-feature-bullet'); 
                dot.style.background = theme.accent;
                dot.style.width = '16px'; dot.style.height = '16px';
                dot.style.marginRight = '24px';
                
                const txt = el('div', 'news-feature-text', b);
                applyNewsFonts(txt, 'headline');
                txt.style.fontSize = '36px';
                txt.style.color = theme.text;
                
                item.appendChild(dot); item.appendChild(txt);
                list.appendChild(item);
            });
            c.appendChild(list);
        },
        animate(c, tl) {
            const lt = c.querySelector('.news-lt-header');
            if (lt) tl.fromTo(lt, { x: '-100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
            c.querySelectorAll('.news-feature-item').forEach((it, i) => {
                tl.fromTo(it, { x: '-100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' }, `-=${i ? 0.25 : 0}`);
            });
        }
    },
    {
        id: 'callout', name: 'Callout', icon: '🔔', desc: 'Bold statement + tag',
        sampleData: { tag: 'CẢNH BÁO', statement: 'Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12' },
        render(c, d, theme) {
            const box = el('div', 'news-callout-box');
            box.style.width = '100%';
            
            if (d.tag) {
                const tag = el('div', 'news-callout-tag', d.tag); 
                tag.style.background = theme.accent;
                tag.style.color = theme.bg;
                tag.style.padding = '16px 40px';
                applyNewsFonts(tag, 'headline');
                tag.style.fontSize = '40px';
                box.appendChild(tag);
            }
            
            const stWrap = el('div', 'news-callout-statement-wrap');
            stWrap.style.background = theme.surface;
            stWrap.style.borderLeft = `16px solid ${theme.accent}`;
            stWrap.style.padding = '60px 40px';
            
            const st = el('div', 'news-callout-statement', d.statement); st.style.color = theme.text;
            applyNewsFonts(st, 'headline');
            st.style.fontSize = '56px';
            st.style.lineHeight = '1.3';
            
            stWrap.appendChild(st);
            box.appendChild(stWrap);
            c.appendChild(box);
        },
        animate(c, tl) {
            const tag = c.querySelector('.news-callout-tag');
            const stWrap = c.querySelector('.news-callout-statement-wrap');
            if (tag) tl.fromTo(tag, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
            if (stWrap) tl.fromTo(stWrap, { x: '-100%' }, { x: '0%', duration: 0.6, ease: 'power3.out' }, '-=0.2');
        }
    },
    {
        id: 'outro', name: 'Outro', icon: '🎬', desc: 'CTA + follow card',
        sampleData: { ctaTop: 'THEO DÕI NGAY', channelName: 'KNReup News', source: 'vnexpress.net' },
        render(c, d, theme) {
            c.style.padding = '0';
            c.style.justifyContent = 'flex-end';
            
            const panel = el('div', 'news-outro-panel');
            panel.style.background = theme.surface;
            panel.style.width = '100%';
            panel.style.padding = '80px 60px';
            panel.style.borderTop = `16px solid ${theme.accent}`;
            panel.style.marginBottom = '80px';
            
            const cta = el('div', 'news-outro-cta', d.ctaTop); cta.style.color = theme.accent;
            applyNewsFonts(cta, 'headline');
            cta.style.fontSize = '48px';
            cta.style.marginBottom = '20px';
            
            const ch = el('div', 'news-outro-channel', d.channelName);
            ch.style.color = theme.text;
            applyNewsFonts(ch, 'headline');
            ch.style.fontSize = '80px';
            ch.style.marginBottom = '40px';
            
            const src = el('div', 'news-outro-source', `NGUỒN: ${d.source}`); src.style.color = theme.muted;
            applyNewsFonts(src, 'headline');
            src.style.fontSize = '24px';
            
            panel.appendChild(cta); panel.appendChild(ch); panel.appendChild(src);
            c.appendChild(panel);
        },
        animate(c, tl) {
            const panel = c.querySelector('.news-outro-panel');
            if (panel) tl.fromTo(panel, { y: '100%' }, { y: '0%', duration: 0.6, ease: 'power3.out' });
        }
    },
    {
        id: 'quote', name: 'Quote', icon: '💬', desc: 'Citation / pull quote',
        sampleData: { text: 'Công nghệ tốt nhất là công nghệ mà bạn không nhận ra nó đang ở đó.', author: '— Tim Cook, CEO Apple' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            
            const txt = el('div', 'news-quote-text', `"${d.text}"`); txt.style.color = theme.text;
            applyNewsFonts(txt, 'headline');
            txt.style.fontSize = '64px';
            txt.style.lineHeight = '1.3';
            txt.style.padding = '40px';
            txt.style.background = theme.surface;
            txt.style.borderLeft = `12px solid ${theme.accent}`;
            txt.style.width = '100%';
            
            const auth = el('div', 'news-quote-author', d.author); auth.style.color = theme.bg;
            auth.style.background = theme.accent;
            auth.style.padding = '16px 40px';
            applyNewsFonts(auth, 'headline');
            auth.style.fontSize = '32px';
            auth.style.alignSelf = 'flex-end';
            auth.style.marginRight = '40px';
            
            c.appendChild(txt); c.appendChild(auth);
        },
        animate(c, tl) {
            const txt = c.querySelector('.news-quote-text');
            const auth = c.querySelector('.news-quote-author');
            if (txt) tl.fromTo(txt, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.5, ease: 'power3.out' });
            if (auth) tl.fromTo(auth, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
        }
    },
    {
        id: 'timeline', name: 'Timeline', icon: '📅', desc: 'Chronological events',
        sampleData: {
            title: 'Hành trình phát triển',
            events: [
                { year: '2020', event: 'Ra mắt phiên bản đầu tiên' },
                { year: '2022', event: 'Đạt 1 triệu người dùng' },
                { year: '2024', event: 'IPO thành công trên NASDAQ' },
                { year: '2025', event: 'Mở rộng sang Đông Nam Á' }
            ]
        },
        render(c, d, theme) {
            c.style.alignItems = 'flex-start';
            const t = el('div', 'news-tl-title', d.title); t.style.color = theme.bg;
            t.style.background = theme.accent;
            t.style.padding = '16px 40px';
            t.style.marginBottom = '60px';
            applyNewsFonts(t, 'headline');
            t.style.fontSize = '48px';
            c.appendChild(t);
            
            const wrapper = el('div', 'news-tl-wrapper');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.gap = '20px';
            wrapper.style.width = '100%';
            
            d.events.forEach((ev: any) => {
                const row = el('div', 'news-tl-row');
                row.style.display = 'flex';
                row.style.background = theme.surface;
                row.style.alignItems = 'center';
                row.style.width = '100%';
                
                const yr = el('div', 'news-tl-year', ev.year); 
                yr.style.color = theme.bg;
                yr.style.background = theme.text;
                yr.style.padding = '24px 32px';
                applyNewsFonts(yr, 'headline');
                yr.style.fontSize = '40px';
                
                const ev2 = el('div', 'news-tl-event', ev.event); 
                ev2.style.color = theme.text;
                ev2.style.padding = '24px 32px';
                applyNewsFonts(ev2, 'headline');
                ev2.style.fontSize = '32px';
                
                row.appendChild(yr); row.appendChild(ev2);
                wrapper.appendChild(row);
            });
            c.appendChild(wrapper);
        },
        animate(c, tl) {
            const title = c.querySelector('.news-tl-title');
            if (title) tl.fromTo(title, { x: '-100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
            c.querySelectorAll('.news-tl-row').forEach((r, i) => {
                tl.fromTo(r, { x: '-100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' }, `-=${i ? 0.2 : 0}`);
            });
        }
    },
    {
        id: 'countdown', name: 'Countdown', icon: '⏱️', desc: 'Big countdown number',
        sampleData: { label: 'Thời gian còn lại', number: '03', unit: 'NGÀY' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            const panel = el('div', 'news-cd-panel');
            panel.style.background = theme.surface;
            panel.style.border = `4px solid ${theme.accent}`;
            panel.style.padding = '60px';
            panel.style.textAlign = 'center';
            panel.style.width = '100%';
            
            const top = el('div');
            top.style.display = 'flex';
            top.style.alignItems = 'center';
            top.style.justifyContent = 'center';
            top.style.gap = '16px';
            top.style.marginBottom = '20px';
            
            const dot = el('div', 'news-cd-live-dot');
            dot.style.width = '24px'; dot.style.height = '24px';
            dot.style.background = theme.accent;
            dot.style.borderRadius = '50%';
            
            const lbl = el('div', 'news-cd-label', d.label); lbl.style.color = theme.text;
            applyNewsFonts(lbl, 'headline');
            lbl.style.fontSize = '36px';
            top.appendChild(dot); top.appendChild(lbl);
            
            const num = el('div', 'news-cd-number', d.number); num.style.color = theme.text;
            applyNewsFonts(num, 'headline');
            num.style.fontSize = '240px';
            num.style.lineHeight = '1';
            
            const unit = el('div', 'news-cd-unit', d.unit); unit.style.color = theme.bg;
            unit.style.background = theme.accent;
            unit.style.display = 'inline-block';
            unit.style.padding = '8px 32px';
            applyNewsFonts(unit, 'headline');
            unit.style.fontSize = '48px';
            unit.style.marginTop = '20px';
            
            panel.appendChild(top); panel.appendChild(num); panel.appendChild(unit);
            c.appendChild(panel);
        },
        animate(c, tl) {
            const panel = c.querySelector('.news-cd-panel');
            if (panel) tl.fromTo(panel, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' });
        }
    },
    {
        id: 'split-image', name: 'Split Image', icon: '🖼️', desc: 'Image + text split',
        sampleData: { headline: 'Trải nghiệm hoàn toàn mới', body: 'Giao diện được thiết kế lại từ đầu, tối ưu cho mọi thiết bị.' },
        render(c, d, theme) {
            c.style.padding = '0';
            const wrap = el('div', 'news-split-wrap');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.height = '100%';
            wrap.style.width = '100%';
            
            const img = el('div', 'news-split-img');
            img.style.flex = '1';
            img.style.background = theme.surface;
            img.style.display = 'flex';
            img.style.alignItems = 'center';
            img.style.justifyContent = 'center';
            const ph = el('div', 'news-split-img-placeholder', 'NEWS FEED');
            applyNewsFonts(ph, 'headline');
            ph.style.fontSize = '80px';
            ph.style.color = theme.muted;
            img.appendChild(ph);
            
            const textZone = createLowerThird(wrap, theme);
            textZone.style.marginBottom = '0';
            textZone.innerHTML = ''; // reset
            
            const h = el('div', 'news-split-headline', d.headline); h.style.color = theme.text;
            applyNewsFonts(h, 'headline');
            h.style.fontSize = '56px';
            h.style.marginBottom = '16px';
            
            const b = el('div', 'news-split-body', d.body); b.style.color = theme.text;
            applyNewsFonts(b, 'body');
            b.style.fontSize = '32px';
            b.style.lineHeight = '1.4';
            
            textZone.appendChild(h); textZone.appendChild(b);
            c.appendChild(wrap);
        },
        animate(c, tl) {
            const img = c.querySelector('.news-split-img');
            const lt = c.querySelector('.news-lower-third');
            if (img) tl.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.5 });
            if (lt) tl.fromTo(lt, { y: '100%' }, { y: '0%', duration: 0.5, ease: 'power3.out' });
        }
    },
    {
        id: 'data-grid', name: 'Data Grid', icon: '📈', desc: '2×2 metric cards',
        sampleData: {
            title: 'Hiệu suất Q4',
            cells: [
                { value: '2.1M', label: 'Lượt xem' },
                { value: '+340%', label: 'Tăng trưởng' },
                { value: '98.7%', label: 'Uptime' },
                { value: '4.9★', label: 'Đánh giá' }
            ]
        },
        render(c, d, theme) {
            const t = el('div', 'news-dg-title', d.title); t.style.color = theme.bg;
            t.style.background = theme.accent;
            t.style.padding = '16px 40px';
            t.style.alignSelf = 'flex-start';
            t.style.marginBottom = '40px';
            applyNewsFonts(t, 'headline');
            t.style.fontSize = '48px';
            c.appendChild(t);
            
            const grid = el('div', 'news-dg-grid');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '20px';
            grid.style.width = '100%';
            
            d.cells.forEach((cell: any) => {
                const ce = el('div', 'news-dg-cell');
                ce.style.background = theme.surface;
                ce.style.padding = '32px';
                ce.style.borderLeft = `8px solid ${theme.accent}`;
                const v = el('div', 'news-dg-cell-value', cell.value); v.style.color = theme.text;
                applyNewsFonts(v, 'headline');
                v.style.fontSize = '64px';
                const l = el('div', 'news-dg-cell-label', cell.label); l.style.color = theme.accent;
                applyNewsFonts(l, 'headline');
                l.style.fontSize = '24px';
                l.style.marginTop = '8px';
                ce.appendChild(v); ce.appendChild(l);
                grid.appendChild(ce);
            });
            c.appendChild(grid);
        },
        animate(c, tl) {
            const t = c.querySelector('.news-dg-title');
            if (t) tl.fromTo(t, { x: '-100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
            c.querySelectorAll('.news-dg-cell').forEach((cell, i) => {
                tl.fromTo(cell, { x: '-100%', opacity: 0 }, { x: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }, `-=${i ? 0.2 : 0}`);
            });
        }
    },
    {
        id: 'title-card', name: 'Title Card', icon: '🏷️', desc: 'Category + big title',
        sampleData: { category: 'CÔNG NGHỆ', title: 'THẾ GIỚI AI ĐANG THAY ĐỔI', date: '04 Tháng 5, 2025' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            
            const cat = el('div', 'news-tc-category', d.category); cat.style.color = theme.bg;
            cat.style.background = theme.accent;
            cat.style.padding = '12px 24px';
            cat.style.display = 'inline-block';
            applyNewsFonts(cat, 'headline');
            cat.style.fontSize = '32px';
            cat.style.marginBottom = '20px';
            cat.style.alignSelf = 'flex-start';
            
            const titleBox = el('div', 'news-tc-title-box');
            titleBox.style.background = theme.surface;
            titleBox.style.padding = '40px';
            titleBox.style.width = '100%';
            titleBox.style.borderLeft = `16px solid ${theme.accent}`;
            
            const title = el('div', 'news-tc-title', d.title); title.style.color = theme.text;
            applyNewsFonts(title, 'headline');
            title.style.fontSize = '80px';
            title.style.lineHeight = '1.1';
            
            titleBox.appendChild(title);
            
            const date = el('div', 'news-tc-date', d.date); date.style.color = theme.muted;
            applyNewsFonts(date, 'headline');
            date.style.fontSize = '28px';
            date.style.marginTop = '40px';
            date.style.alignSelf = 'flex-start';
            
            c.appendChild(cat); c.appendChild(titleBox); c.appendChild(date);
        },
        animate(c, tl) {
            const cat = c.querySelector('.news-tc-category');
            const titleBox = c.querySelector('.news-tc-title-box');
            const date = c.querySelector('.news-tc-date');
            if (cat) tl.fromTo(cat, { x: '-100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' });
            if (titleBox) tl.fromTo(titleBox, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.5, ease: 'power3.out' }, '-=0.2');
            if (date) tl.fromTo(date, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.1');
        }
    }
];

export const NEWS_BROADCAST_SET: TemplateSet = {
    id: 'news-broadcast',
    name: 'News Broadcast',
    description: 'TV news style — lower-thirds, ticker strips, breaking news bars',
    templates: NEWS_BROADCAST_TEMPLATES,
};
