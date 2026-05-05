import { SmartTemplate, el } from '../templateData';
import type { TemplateSet } from './index';

export const DEFAULT_TEMPLATES: SmartTemplate[] = [

    // ─── 1. HOOK ────────────────────────────────────────────
    {
        id: 'hook', name: 'Hook', icon: '⚡', desc: 'Headline + Ken Burns BG',
        sampleData: { headline: 'APPLE ĐÃ LÀM GÌ MÀ CẢ THẾ GIỚI SỐC?', subhead: 'Sự thật đằng sau thương vụ tỷ đô' },
        render(c, d, theme) {
            const h = el('div', 'hook-headline', d.headline); h.style.color = theme.text;
            c.appendChild(h);
            if (d.subhead) {
                const s = el('div', 'hook-subhead', d.subhead); s.style.color = theme.accent;
                c.appendChild(s);
            }
        },
        animate(c, tl) {
            const h = c.querySelector('.hook-headline');
            const s = c.querySelector('.hook-subhead');
            if (h) tl.to(h, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' });
            if (s) tl.to(s, { opacity: 1, duration: 0.7 }, '-=0.3');
        }
    },

    // ─── 2. STAT HERO ───────────────────────────────────────
    {
        id: 'stat-hero', name: 'Stat Hero', icon: '📊', desc: 'Big number highlight',
        sampleData: { value: '97%', label: 'Người dùng hài lòng', context: 'Khảo sát Q4 2025' },
        render(c, d, theme) {
            const v = el('div', 'stat-value', d.value); v.style.color = theme.accent;
            const l = el('div', 'stat-label', d.label); l.style.color = theme.text;
            c.appendChild(v); c.appendChild(l);
            if (d.context) {
                const ctx = el('div', 'stat-context', d.context); ctx.style.color = theme.muted;
                c.appendChild(ctx);
            }
        },
        animate(c, tl) {
            const v = c.querySelector('.stat-value');
            const l = c.querySelector('.stat-label');
            const ctx = c.querySelector('.stat-context');
            if (v) tl.to(v, { opacity: 1, scale: 1, duration: 1, ease: 'elastic.out(1,0.5)' });
            if (l) tl.to(l, { opacity: 1, duration: 0.5 }, '-=0.5');
            if (ctx) tl.to(ctx, { opacity: 1, duration: 0.4 }, '-=0.2');
        }
    },

    // ─── 3. COMPARISON ──────────────────────────────────────
    {
        id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'VS side-by-side',
        sampleData: { left: { label: 'iPhone 16', value: '$799' }, right: { label: 'Galaxy S25', value: '$749' } },
        render(c, d, theme) {
            const compFont = (val: string) => val.length <= 10 ? '88px' : val.length <= 25 ? '56px' : '40px';
            const lv = String(d.left.value);
            const rv = String(d.right.value);
            const w = el('div', 'comparison-wrapper');
            const l = el('div', 'comp-side');
            l.style.borderColor = theme.accent;
            l.innerHTML = `<div class="comp-label">${d.left.label}</div><div class="comp-value" style="color:${theme.accent};font-size:${compFont(lv)}">${lv}</div>`;
            const vs = el('div', 'comp-vs', 'VS');
            const r = el('div', 'comp-side');
            r.style.borderColor = theme.secondary || theme.muted;
            r.innerHTML = `<div class="comp-label">${d.right.label}</div><div class="comp-value" style="color:${theme.secondary || theme.muted};font-size:${compFont(rv)}">${rv}</div>`;
            w.appendChild(l); w.appendChild(vs); w.appendChild(r);
            c.appendChild(w);
        },
        animate(c, tl) {
            const w = c.querySelector('.comparison-wrapper');
            if (!w) return;
            tl.to(w, { opacity: 1, duration: 0.4 });
            tl.from(w.children[0], { y: 80, opacity: 0, duration: 0.7, ease: 'back.out(1.7)' }, '-=0.1');
            tl.from(w.children[2], { y: 80, opacity: 0, duration: 0.7, ease: 'back.out(1.7)' }, '-=0.5');
        }
    },

    // ─── 4. FEATURE LIST ────────────────────────────────────
    {
        id: 'feature-list', name: 'Feature List', icon: '📋', desc: 'Title + bullet points',
        sampleData: { title: 'Tính năng nổi bật', bullets: ['AI tự động phân tích', 'Render real-time 4K', 'Export đa nền tảng', 'Chỉnh sửa không phá hủy'] },
        render(c, d, theme) {
            const t = el('div', 'feature-title', d.title); t.style.color = theme.accent;
            c.appendChild(t);
            d.bullets.forEach((b: string) => {
                const item = el('div', 'feature-item');
                const dot = el('div', 'feature-bullet'); dot.style.background = theme.accent;
                const txt = document.createTextNode(b);
                item.appendChild(dot); item.appendChild(txt);
                item.style.color = theme.text;
                c.appendChild(item);
            });
        },
        animate(c, tl) {
            const t = c.querySelector('.feature-title');
            if (t) tl.to(t, { opacity: 1, duration: 0.5 });
            c.querySelectorAll('.feature-item').forEach((it, i) => {
                tl.to(it, { opacity: 1, x: 0, duration: 0.45 }, `-=${i ? 0.25 : 0}`);
            });
        }
    },

    // ─── 5. CALLOUT ─────────────────────────────────────────
    {
        id: 'callout', name: 'Callout', icon: '🔔', desc: 'Bold statement + tag',
        sampleData: { tag: 'CẢNH BÁO', statement: 'Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12' },
        render(c, d, theme) {
            const box = el('div', 'callout-box');
            box.style.background = `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark || theme.accent}88)`;
            if (d.tag) {
                const tag = el('div', 'callout-tag', d.tag); tag.style.color = 'rgba(255,255,255,0.7)';
                box.appendChild(tag);
            }
            const st = el('div', 'callout-statement', d.statement); st.style.color = '#fff';
            box.appendChild(st);
            c.appendChild(box);
        },
        animate(c, tl) {
            const box = c.querySelector('.callout-box');
            if (box) tl.to(box, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' });
        }
    },

    // ─── 6. OUTRO ───────────────────────────────────────────
    {
        id: 'outro', name: 'Outro', icon: '🎬', desc: 'CTA + follow card',
        sampleData: { ctaTop: 'THEO DÕI NGAY', channelName: 'KNReup News', source: 'vnexpress.net' },
        render(c, d, theme) {
            const cta = el('div', 'outro-cta', d.ctaTop); cta.style.color = theme.accent;
            const ch = el('div', 'outro-channel', d.channelName);
            ch.style.background = theme.text; ch.style.color = theme.bg;
            const src = el('div', 'outro-source', `Nguồn: ${d.source}`); src.style.color = theme.muted;
            c.appendChild(cta); c.appendChild(ch); c.appendChild(src);
        },
        animate(c, tl) {
            const cta = c.querySelector('.outro-cta');
            const ch = c.querySelector('.outro-channel');
            const src = c.querySelector('.outro-source');
            if (cta) tl.to(cta, { opacity: 1, duration: 0.5 });
            if (ch) tl.to(ch, { opacity: 1, scale: 1, duration: 0.7, ease: 'elastic.out(1,0.5)' }, '-=0.2');
            if (src) tl.to(src, { opacity: 1, duration: 0.4 }, '-=0.3');
        }
    },

    // ─── 7. QUOTE ───────────────────────────────────────────
    {
        id: 'quote', name: 'Quote', icon: '💬', desc: 'Citation / pull quote',
        sampleData: { text: 'Công nghệ tốt nhất là công nghệ mà bạn không nhận ra nó đang ở đó.', author: '— Tim Cook, CEO Apple' },
        render(c, d, theme) {
            const mark = el('div', 'quote-mark', '"'); mark.style.color = theme.accent;
            const txt = el('div', 'quote-text', d.text); txt.style.color = theme.text;
            const auth = el('div', 'quote-author', d.author); auth.style.color = theme.accent;
            c.appendChild(mark); c.appendChild(txt); c.appendChild(auth);
        },
        animate(c, tl) {
            const mark = c.querySelector('.quote-mark');
            const txt = c.querySelector('.quote-text');
            const auth = c.querySelector('.quote-author');
            if (mark) tl.to(mark, { opacity: 0.2, duration: 0.4 });
            if (txt) tl.to(txt, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2');
            if (auth) tl.to(auth, { opacity: 1, duration: 0.5 }, '-=0.3');
        }
    },

    // ─── 8. TIMELINE ────────────────────────────────────────
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
            const t = el('div', 'tl-title', d.title); t.style.color = theme.text;
            c.appendChild(t); c.style.alignItems = 'flex-start';
            d.events.forEach((ev: any, i: number) => {
                if (i > 0) {
                    const line = el('div', 'tl-line'); line.style.background = theme.accent;
                    c.appendChild(line);
                }
                const row = el('div', 'tl-row');
                const dot = el('div', 'tl-dot'); dot.style.background = theme.accent;
                const yr = el('div', 'tl-year', ev.year); yr.style.color = theme.accent;
                const ev2 = el('div', 'tl-event', ev.event); ev2.style.color = theme.text;
                row.appendChild(dot); row.appendChild(yr); row.appendChild(ev2);
                c.appendChild(row);
            });
        },
        animate(c, tl) {
            const title = c.querySelector('.tl-title');
            if (title) tl.to(title, { opacity: 1, duration: 0.5 });
            c.querySelectorAll('.tl-row').forEach((r, i) => {
                tl.to(r, { opacity: 1, x: 0, duration: 0.4 }, `-=${i ? 0.2 : 0}`);
            });
        }
    },

    // ─── 9. COUNTDOWN ───────────────────────────────────────
    {
        id: 'countdown', name: 'Countdown', icon: '⏱️', desc: 'Big countdown number',
        sampleData: { label: 'Thời gian còn lại', number: '03', unit: 'NGÀY' },
        render(c, d, theme) {
            const lbl = el('div', 'cd-label', d.label); lbl.style.color = theme.muted;
            const num = el('div', 'cd-number', d.number); num.style.color = theme.accent;
            const unit = el('div', 'cd-unit', d.unit); unit.style.color = theme.text;
            c.appendChild(lbl); c.appendChild(num); c.appendChild(unit);
        },
        animate(c, tl) {
            const lbl = c.querySelector('.cd-label');
            const num = c.querySelector('.cd-number');
            const unit = c.querySelector('.cd-unit');
            if (lbl) tl.to(lbl, { opacity: 1, duration: 0.3 });
            if (num) tl.to(num, { opacity: 1, scale: 1, duration: 1.2, ease: 'elastic.out(1,0.4)' }, '-=0.1');
            if (unit) tl.to(unit, { opacity: 1, duration: 0.4 }, '-=0.5');
        }
    },

    // ─── 10. SPLIT IMAGE ────────────────────────────────────
    {
        id: 'split-image', name: 'Split Image', icon: '🖼️', desc: 'Image + text split',
        sampleData: { headline: 'Trải nghiệm hoàn toàn mới', body: 'Giao diện được thiết kế lại từ đầu, tối ưu cho mọi thiết bị.' },
        render(c, d, theme) {
            c.style.padding = '0'; c.style.gap = '0';
            const wrap = el('div', 'split-wrap');
            const img = el('div', 'split-img');
            img.style.background = `linear-gradient(135deg, ${theme.accent}44, ${theme.accentDark || theme.accent}22)`;
            const ph = el('div', 'split-img-placeholder', '🎞️');
            img.appendChild(ph);
            const textZone = el('div', 'split-text-zone');
            const h = el('div', 'split-headline', d.headline); h.style.color = theme.text;
            const b = el('div', 'split-body', d.body); b.style.color = theme.muted;
            textZone.appendChild(h); textZone.appendChild(b);
            wrap.appendChild(img); wrap.appendChild(textZone);
            c.appendChild(wrap);
        },
        animate(c, tl) {
            const img = c.querySelector('.split-img');
            const h = c.querySelector('.split-headline');
            const b = c.querySelector('.split-body');
            if (img) tl.from(img, { y: -40, opacity: 0, duration: 0.7, ease: 'power3.out' });
            if (h) tl.to(h, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
            if (b) tl.to(b, { opacity: 1, duration: 0.5 }, '-=0.2');
        }
    },

    // ─── 11. DATA GRID ──────────────────────────────────────
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
            const t = el('div', 'dg-title', d.title); t.style.color = theme.text;
            c.appendChild(t);
            const grid = el('div', 'dg-grid');
            d.cells.forEach((cell: any) => {
                const ce = el('div', 'dg-cell');
                ce.style.borderColor = `${theme.accent}33`;
                const v = el('div', 'dg-cell-value', cell.value); v.style.color = theme.accent;
                const l = el('div', 'dg-cell-label', cell.label); l.style.color = theme.muted;
                ce.appendChild(v); ce.appendChild(l);
                grid.appendChild(ce);
            });
            c.appendChild(grid);
        },
        animate(c, tl) {
            const t = c.querySelector('.dg-title');
            if (t) tl.to(t, { opacity: 1, duration: 0.4 });
            c.querySelectorAll('.dg-cell').forEach((cell, i) => {
                tl.to(cell, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, `-=${i ? 0.3 : 0}`);
            });
        }
    },

    // ─── 12. TITLE CARD ─────────────────────────────────────
    {
        id: 'title-card', name: 'Title Card', icon: '🏷️', desc: 'Category + big title',
        sampleData: { category: 'CÔNG NGHỆ', title: 'THẾ GIỚI AI ĐANG THAY ĐỔI', date: '04 Tháng 5, 2025' },
        render(c, d, theme) {
            const cat = el('div', 'tc-category', d.category); cat.style.color = theme.accent;
            const title = el('div', 'tc-title', d.title); title.style.color = theme.text;
            const div = el('div', 'tc-divider'); div.style.background = theme.accent;
            const date = el('div', 'tc-date', d.date); date.style.color = theme.muted;
            c.appendChild(cat); c.appendChild(title); c.appendChild(div); c.appendChild(date);
        },
        animate(c, tl) {
            const cat = c.querySelector('.tc-category');
            const title = c.querySelector('.tc-title');
            const divider = c.querySelector('.tc-divider');
            const date = c.querySelector('.tc-date');
            if (cat) tl.to(cat, { opacity: 1, duration: 0.4 });
            if (title) tl.to(title, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, '-=0.2');
            if (divider) tl.to(divider, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' }, '-=0.4');
            if (date) tl.to(date, { opacity: 1, duration: 0.4 }, '-=0.2');
        }
    }
];

export const DEFAULT_SET: TemplateSet = {
    id: 'default',
    name: 'Default',
    description: 'Manrope/Anton fonts, rounded corners, elastic animations, film grain',
    templates: DEFAULT_TEMPLATES,
};
