import { SmartTemplate, el } from '../templateData';
import type { TemplateSet } from './index';

// Helper to add letterbox bars
function addLetterbox(c: HTMLElement) {
    c.style.padding = '100px 40px'; // Give space for letterbox
    const topBar = el('div', 'cine-letterbox-top');
    topBar.style.position = 'absolute';
    topBar.style.top = '0';
    topBar.style.left = '0';
    topBar.style.right = '0';
    topBar.style.height = '80px';
    topBar.style.background = '#000';
    topBar.style.zIndex = '10';
    
    const botBar = el('div', 'cine-letterbox-bot');
    botBar.style.position = 'absolute';
    botBar.style.bottom = '0';
    botBar.style.left = '0';
    botBar.style.right = '0';
    botBar.style.height = '80px';
    botBar.style.background = '#000';
    botBar.style.zIndex = '10';
    
    c.appendChild(topBar);
    c.appendChild(botBar);
}

// Default font overrides for cinematic style
function applyCineFonts(el: HTMLElement, type: 'headline' | 'body') {
    if (type === 'headline') {
        el.style.fontFamily = "'Bebas Neue', sans-serif";
        el.style.letterSpacing = '2px';
        el.style.textTransform = 'uppercase';
    } else {
        el.style.fontFamily = "'Inter', sans-serif";
        el.style.fontWeight = '300';
    }
}

export const CINEMATIC_TEMPLATES: SmartTemplate[] = [
    {
        id: 'hook', name: 'Hook', icon: '⚡', desc: 'Headline + Ken Burns BG',
        sampleData: { headline: 'APPLE ĐÃ LÀM GÌ MÀ CẢ THẾ GIỚI SỐC?', subhead: 'Sự thật đằng sau thương vụ tỷ đô' },
        render(c, d, theme) {
            addLetterbox(c);
            c.style.justifyContent = 'center';
            if (d.bgSrc) {
                const bgHtml = `<div class="bg-blur" style="position: absolute; inset: 0; background-image: url('${d.bgSrc}'); background-size: cover; background-position: center; filter: blur(35px); opacity: 0.35; transform: scale(1.1); z-index: -2;"></div>
                   <div class="bg" style="background-image: url('${d.bgSrc}'); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1040px; height: 585px; background-size: cover; background-position: center; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); opacity: 0.9; z-index: -1;"></div>`;
                c.insertAdjacentHTML('afterbegin', bgHtml);
            }
            const h = el('div', 'cine-headline', d.headline); h.style.color = theme.text;
            applyCineFonts(h, 'headline');
            h.style.fontSize = '80px';
            h.style.textAlign = 'center';
            h.style.lineHeight = '1.1';
            c.appendChild(h);
            if (d.subhead) {
                const s = el('div', 'cine-subhead', d.subhead); s.style.color = theme.accent;
                applyCineFonts(s, 'body');
                s.style.fontSize = '32px';
                s.style.marginTop = '20px';
                s.style.textAlign = 'center';
                c.appendChild(s);
            }
        },
        animate(c, tl) {
            const h = c.querySelector('.cine-headline');
            const s = c.querySelector('.cine-subhead');
            if (h) tl.fromTo(h, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.5, ease: 'power2.inOut' });
            if (s) tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '-=0.5');
        }
    },
    {
        id: 'stat-hero', name: 'Stat Hero', icon: '📊', desc: 'Big number highlight',
        sampleData: { value: '97%', label: 'Người dùng hài lòng', context: 'Khảo sát Q4 2025' },
        render(c, d, theme) {
            addLetterbox(c);
            const v = el('div', 'cine-stat-value', d.value); v.style.color = theme.accent;
            applyCineFonts(v, 'headline');
            v.style.fontSize = '180px';
            const l = el('div', 'cine-stat-label', d.label); l.style.color = theme.text;
            applyCineFonts(l, 'body');
            l.style.fontSize = '40px';
            c.appendChild(v); c.appendChild(l);
            if (d.context) {
                const ctx = el('div', 'cine-stat-context', d.context); ctx.style.color = theme.muted;
                applyCineFonts(ctx, 'body');
                ctx.style.fontSize = '24px';
                ctx.style.marginTop = '16px';
                c.appendChild(ctx);
            }
        },
        animate(c, tl) {
            const v = c.querySelector('.cine-stat-value');
            const l = c.querySelector('.cine-stat-label');
            const ctx = c.querySelector('.cine-stat-context');
            if (v) tl.fromTo(v, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.0, ease: 'power2.inOut' });
            if (l) tl.fromTo(l, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=1.0');
            if (ctx) tl.fromTo(ctx, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '-=0.8');
        }
    },
    {
        id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'VS side-by-side',
        sampleData: { left: { label: 'iPhone 16', value: '$799' }, right: { label: 'Galaxy S25', value: '$749' } },
        render(c, d, theme) {
            addLetterbox(c);
            const w = el('div', 'cine-comparison-wrapper');
            w.style.display = 'flex';
            w.style.width = '100%';
            w.style.alignItems = 'center';
            w.style.justifyContent = 'space-between';
            w.style.marginTop = 'auto';
            w.style.marginBottom = 'auto';
            
            const createSide = (data: any, color: string, align: string) => {
                const side = el('div', 'cine-comp-side');
                side.style.textAlign = align;
                side.innerHTML = `<div class="cine-comp-label" style="font-family:'Inter',sans-serif;font-weight:300;font-size:32px;color:${theme.text}">${data.label}</div>
                                  <div class="cine-comp-value" style="font-family:'Bebas Neue',sans-serif;font-size:80px;color:${color}">${data.value}</div>`;
                return side;
            };
            const l = createSide(d.left, theme.accent, 'left');
            const r = createSide(d.right, theme.secondary || theme.muted, 'right');
            const vs = el('div', 'cine-comp-vs', 'VS');
            applyCineFonts(vs, 'headline');
            vs.style.fontSize = '64px';
            vs.style.color = theme.muted;
            
            w.appendChild(l); w.appendChild(vs); w.appendChild(r);
            c.appendChild(w);
        },
        animate(c, tl) {
            const w = c.querySelector('.cine-comparison-wrapper');
            if (!w) return;
            tl.fromTo(w.children[0], { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: 'power2.out' });
            tl.fromTo(w.children[2], { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: 'power2.out' }, '-=1.5');
            tl.fromTo(w.children[1], { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '-=1.0');
        }
    },
    {
        id: 'feature-list', name: 'Feature List', icon: '📋', desc: 'Title + bullet points',
        sampleData: { title: 'Tính năng nổi bật', bullets: ['AI tự động phân tích', 'Render real-time 4K', 'Export đa nền tảng', 'Chỉnh sửa không phá hủy'] },
        render(c, d, theme) {
            addLetterbox(c);
            c.style.alignItems = 'flex-start';
            c.style.justifyContent = 'center';
            const t = el('div', 'cine-feature-title', d.title); t.style.color = theme.accent;
            applyCineFonts(t, 'headline');
            t.style.fontSize = '72px';
            t.style.marginBottom = '40px';
            c.appendChild(t);
            d.bullets.forEach((b: string) => {
                const item = el('div', 'cine-feature-item');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '20px';
                item.style.marginBottom = '24px';
                const dot = el('div', 'cine-feature-bullet'); 
                dot.style.background = theme.accent;
                dot.style.width = '8px'; dot.style.height = '8px';
                const txt = el('div', 'cine-feature-text', b);
                applyCineFonts(txt, 'body');
                txt.style.fontSize = '36px';
                item.appendChild(dot); item.appendChild(txt);
                item.style.color = theme.text;
                c.appendChild(item);
            });
        },
        animate(c, tl) {
            const t = c.querySelector('.cine-feature-title');
            if (t) tl.fromTo(t, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut' });
            c.querySelectorAll('.cine-feature-item').forEach((it, i) => {
                tl.fromTo(it, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.inOut' }, `-=${i ? 0.4 : 0}`);
            });
        }
    },
    {
        id: 'callout', name: 'Callout', icon: '🔔', desc: 'Bold statement + tag',
        sampleData: { tag: 'CẢNH BÁO', statement: 'Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12' },
        render(c, d, theme) {
            addLetterbox(c);
            const box = el('div', 'cine-callout-box');
            box.style.background = '#0a0a0a';
            box.style.border = `2px solid ${theme.accent}`;
            box.style.padding = '60px 40px';
            box.style.width = '100%';
            box.style.textAlign = 'center';
            if (d.tag) {
                const tag = el('div', 'cine-callout-tag', d.tag); 
                tag.style.color = theme.accent;
                applyCineFonts(tag, 'headline');
                tag.style.fontSize = '32px';
                tag.style.marginBottom = '20px';
                box.appendChild(tag);
            }
            const st = el('div', 'cine-callout-statement', d.statement); st.style.color = '#fff';
            applyCineFonts(st, 'body');
            st.style.fontSize = '48px';
            st.style.lineHeight = '1.4';
            box.appendChild(st);
            c.appendChild(box);
        },
        animate(c, tl) {
            const box = c.querySelector('.cine-callout-box');
            if (box) tl.fromTo(box, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out' });
        }
    },
    {
        id: 'outro', name: 'Outro', icon: '🎬', desc: 'CTA + follow card',
        sampleData: { ctaTop: 'THEO DÕI NGAY', channelName: 'KNReup News', source: 'vnexpress.net' },
        render(c, d, theme) {
            addLetterbox(c);
            const cta = el('div', 'cine-outro-cta', d.ctaTop); cta.style.color = theme.accent;
            applyCineFonts(cta, 'headline');
            cta.style.fontSize = '48px';
            cta.style.marginBottom = '32px';
            
            const ch = el('div', 'cine-outro-channel', d.channelName);
            ch.style.background = theme.text; ch.style.color = theme.bg;
            ch.style.padding = '20px 40px';
            applyCineFonts(ch, 'headline');
            ch.style.fontSize = '64px';
            ch.style.marginBottom = '40px';
            
            const src = el('div', 'cine-outro-source', `Nguồn: ${d.source}`); src.style.color = theme.muted;
            applyCineFonts(src, 'body');
            src.style.fontSize = '24px';
            
            c.appendChild(cta); c.appendChild(ch); c.appendChild(src);
        },
        animate(c, tl) {
            const cta = c.querySelector('.cine-outro-cta');
            const ch = c.querySelector('.cine-outro-channel');
            const src = c.querySelector('.cine-outro-source');
            if (cta) {
                // Typewriter effect approximation via stagger or simple wipe
                tl.fromTo(cta, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut' });
            }
            if (ch) tl.fromTo(ch, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=0.6');
            if (src) tl.fromTo(src, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, '-=0.8');
        }
    },
    {
        id: 'quote', name: 'Quote', icon: '💬', desc: 'Citation / pull quote',
        sampleData: { text: 'Công nghệ tốt nhất là công nghệ mà bạn không nhận ra nó đang ở đó.', author: '— Tim Cook, CEO Apple' },
        render(c, d, theme) {
            addLetterbox(c);
            const mark = el('div', 'cine-quote-mark', '"'); mark.style.color = theme.accent;
            applyCineFonts(mark, 'headline');
            mark.style.fontSize = '160px';
            mark.style.lineHeight = '1';
            mark.style.marginBottom = '-40px';
            
            const txt = el('div', 'cine-quote-text', d.text); txt.style.color = theme.text;
            applyCineFonts(txt, 'body');
            txt.style.fontSize = '56px';
            txt.style.fontStyle = 'italic';
            txt.style.textAlign = 'center';
            txt.style.lineHeight = '1.3';
            
            const auth = el('div', 'cine-quote-author', d.author); auth.style.color = theme.accent;
            applyCineFonts(auth, 'headline');
            auth.style.fontSize = '32px';
            auth.style.marginTop = '40px';
            
            c.appendChild(mark); c.appendChild(txt); c.appendChild(auth);
        },
        animate(c, tl) {
            const mark = c.querySelector('.cine-quote-mark');
            const txt = c.querySelector('.cine-quote-text');
            const auth = c.querySelector('.cine-quote-author');
            if (mark) tl.fromTo(mark, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 0.3, duration: 1.5, ease: 'power2.out' });
            if (txt) tl.fromTo(txt, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.5, ease: 'power2.inOut' }, '-=1.0');
            if (auth) tl.fromTo(auth, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, '-=0.5');
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
            addLetterbox(c);
            c.style.alignItems = 'flex-start';
            c.style.justifyContent = 'center';
            const t = el('div', 'cine-tl-title', d.title); t.style.color = theme.text;
            applyCineFonts(t, 'headline');
            t.style.fontSize = '64px';
            t.style.marginBottom = '60px';
            c.appendChild(t);
            
            const wrapper = el('div', 'cine-tl-wrapper');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.gap = '30px';
            wrapper.style.position = 'relative';
            
            // Connecting line background
            const lineBg = el('div', 'cine-tl-line-bg');
            lineBg.style.position = 'absolute';
            lineBg.style.left = '11px';
            lineBg.style.top = '10px';
            lineBg.style.bottom = '10px';
            lineBg.style.width = '2px';
            lineBg.style.background = '#333';
            wrapper.appendChild(lineBg);
            
            // Animated line foreground
            const lineFg = el('div', 'cine-tl-line-fg');
            lineFg.style.position = 'absolute';
            lineFg.style.left = '11px';
            lineFg.style.top = '10px';
            lineFg.style.bottom = '10px';
            lineFg.style.width = '2px';
            lineFg.style.background = theme.accent;
            lineFg.style.transformOrigin = 'top';
            wrapper.appendChild(lineFg);

            d.events.forEach((ev: any) => {
                const row = el('div', 'cine-tl-row');
                row.style.display = 'flex';
                row.style.alignItems = 'flex-start';
                row.style.gap = '30px';
                row.style.position = 'relative';
                row.style.zIndex = '2';
                
                const dot = el('div', 'cine-tl-dot'); 
                dot.style.background = theme.accent;
                dot.style.width = '12px'; dot.style.height = '12px';
                dot.style.marginTop = '16px'; // Align with text
                
                const content = el('div');
                const yr = el('div', 'cine-tl-year', ev.year); yr.style.color = theme.accent;
                applyCineFonts(yr, 'headline');
                yr.style.fontSize = '40px';
                
                const ev2 = el('div', 'cine-tl-event', ev.event); ev2.style.color = theme.text;
                applyCineFonts(ev2, 'body');
                ev2.style.fontSize = '28px';
                
                content.appendChild(yr); content.appendChild(ev2);
                row.appendChild(dot); row.appendChild(content);
                wrapper.appendChild(row);
            });
            c.appendChild(wrapper);
        },
        animate(c, tl) {
            const title = c.querySelector('.cine-tl-title');
            const line = c.querySelector('.cine-tl-line-fg');
            if (title) tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' });
            if (line) tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 2.0, ease: 'power2.inOut' }, '-=0.5');
            
            c.querySelectorAll('.cine-tl-row').forEach((r, i) => {
                tl.fromTo(r, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 1.0, ease: 'power2.out' }, `-=${1.8 - (i * 0.4)}`);
            });
        }
    },
    {
        id: 'countdown', name: 'Countdown', icon: '⏱️', desc: 'Big countdown number',
        sampleData: { label: 'Thời gian còn lại', number: '03', unit: 'NGÀY' },
        render(c, d, theme) {
            addLetterbox(c);
            const lbl = el('div', 'cine-cd-label', d.label); lbl.style.color = theme.muted;
            applyCineFonts(lbl, 'headline');
            lbl.style.fontSize = '48px';
            lbl.style.letterSpacing = '8px';
            
            const num = el('div', 'cine-cd-number', d.number); num.style.color = theme.accent;
            applyCineFonts(num, 'headline');
            num.style.fontSize = '320px';
            num.style.lineHeight = '1';
            
            const unit = el('div', 'cine-cd-unit', d.unit); unit.style.color = theme.text;
            applyCineFonts(unit, 'headline');
            unit.style.fontSize = '64px';
            
            c.appendChild(lbl); c.appendChild(num); c.appendChild(unit);
        },
        animate(c, tl) {
            const lbl = c.querySelector('.cine-cd-label');
            const num = c.querySelector('.cine-cd-number');
            const unit = c.querySelector('.cine-cd-unit');
            if (lbl) tl.fromTo(lbl, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' });
            if (num) tl.fromTo(num, { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.0, ease: 'power2.out' }, '-=0.8');
            if (unit) tl.fromTo(unit, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '-=1.0');
        }
    },
    {
        id: 'split-image', name: 'Split Image', icon: '🖼️', desc: 'Image + text split',
        sampleData: { headline: 'Trải nghiệm hoàn toàn mới', body: 'Giao diện được thiết kế lại từ đầu, tối ưu cho mọi thiết bị.' },
        render(c, d, theme) {
            c.style.padding = '0';
            const wrap = el('div', 'cine-split-wrap');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.height = '100%';
            wrap.style.width = '100%';
            
            const img = el('div', 'cine-split-img');
            img.style.flex = '1';
            img.style.background = `linear-gradient(to bottom, #111, ${theme.bg})`;
            img.style.display = 'flex';
            img.style.alignItems = 'center';
            img.style.justifyContent = 'center';
            const ph = el('div', 'cine-split-img-placeholder', '🎞️');
            ph.style.fontSize = '120px';
            img.appendChild(ph);
            
            const textZone = el('div', 'cine-split-text-zone');
            textZone.style.padding = '80px 60px';
            textZone.style.textAlign = 'center';
            const h = el('div', 'cine-split-headline', d.headline); h.style.color = theme.text;
            applyCineFonts(h, 'headline');
            h.style.fontSize = '64px';
            h.style.marginBottom = '24px';
            
            const b = el('div', 'cine-split-body', d.body); b.style.color = theme.muted;
            applyCineFonts(b, 'body');
            b.style.fontSize = '32px';
            b.style.lineHeight = '1.4';
            
            textZone.appendChild(h); textZone.appendChild(b);
            wrap.appendChild(img); wrap.appendChild(textZone);
            c.appendChild(wrap);
            
            // Add letterbox OVER the split wrap
            addLetterbox(c);
            c.style.padding = '0'; // reset padding after addLetterbox to keep layout tight
        },
        animate(c, tl) {
            const img = c.querySelector('.cine-split-img');
            const h = c.querySelector('.cine-split-headline');
            const b = c.querySelector('.cine-split-body');
            if (img) tl.fromTo(img, { y: '-100%' }, { y: '0%', duration: 1.5, ease: 'power2.out' });
            if (h) tl.fromTo(h, { y: '100%', opacity: 0 }, { y: '0%', opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=1.0');
            if (b) tl.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, '-=0.6');
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
            addLetterbox(c);
            const t = el('div', 'cine-dg-title', d.title); t.style.color = theme.text;
            applyCineFonts(t, 'headline');
            t.style.fontSize = '80px';
            t.style.marginBottom = '60px';
            c.appendChild(t);
            
            const grid = el('div', 'cine-dg-grid');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '40px';
            grid.style.width = '100%';
            
            d.cells.forEach((cell: any) => {
                const ce = el('div', 'cine-dg-cell');
                ce.style.background = '#0a0a0a';
                ce.style.border = `1px solid ${theme.muted}33`;
                ce.style.padding = '40px';
                ce.style.textAlign = 'center';
                const v = el('div', 'cine-dg-cell-value', cell.value); v.style.color = theme.accent;
                applyCineFonts(v, 'headline');
                v.style.fontSize = '80px';
                const l = el('div', 'cine-dg-cell-label', cell.label); l.style.color = theme.muted;
                applyCineFonts(l, 'body');
                l.style.fontSize = '24px';
                l.style.marginTop = '12px';
                ce.appendChild(v); ce.appendChild(l);
                grid.appendChild(ce);
            });
            c.appendChild(grid);
        },
        animate(c, tl) {
            const t = c.querySelector('.cine-dg-title');
            if (t) tl.fromTo(t, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' });
            c.querySelectorAll('.cine-dg-cell').forEach((cell, i) => {
                // Diagonal reveal stagger
                tl.fromTo(cell, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, `-=${i ? 1.0 : 0}`);
            });
        }
    },
    {
        id: 'title-card', name: 'Title Card', icon: '🏷️', desc: 'Category + big title',
        sampleData: { category: 'CÔNG NGHỆ', title: 'THẾ GIỚI AI ĐANG THAY ĐỔI', date: '04 Tháng 5, 2025' },
        render(c, d, theme) {
            addLetterbox(c);
            c.style.justifyContent = 'center';
            const cat = el('div', 'cine-tc-category', d.category); cat.style.color = theme.accent;
            applyCineFonts(cat, 'headline');
            cat.style.fontSize = '36px';
            cat.style.letterSpacing = '6px';
            cat.style.marginBottom = '24px';
            
            const title = el('div', 'cine-tc-title', d.title); title.style.color = theme.text;
            applyCineFonts(title, 'headline');
            title.style.fontSize = '120px';
            title.style.textAlign = 'center';
            title.style.lineHeight = '1.1';
            
            const div = el('div', 'cine-tc-divider'); div.style.background = theme.accent;
            div.style.width = '120px';
            div.style.height = '4px';
            div.style.margin = '40px 0';
            
            const date = el('div', 'cine-tc-date', d.date); date.style.color = theme.muted;
            applyCineFonts(date, 'body');
            date.style.fontSize = '28px';
            date.style.textTransform = 'uppercase';
            date.style.letterSpacing = '2px';
            
            c.appendChild(cat); c.appendChild(title); c.appendChild(div); c.appendChild(date);
        },
        animate(c, tl) {
            const cat = c.querySelector('.cine-tc-category');
            const title = c.querySelector('.cine-tc-title');
            const divider = c.querySelector('.cine-tc-divider');
            const date = c.querySelector('.cine-tc-date');
            if (cat) tl.fromTo(cat, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'power2.out' });
            if (title) tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, '-=0.8');
            if (divider) tl.fromTo(divider, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, '-=1.0');
            if (date) tl.fromTo(date, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '-=0.5');
        }
    }
];

export const CINEMATIC_SET: TemplateSet = {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Dark dramatic style — slow reveals, letterbox bars, trailer feel',
    templates: CINEMATIC_TEMPLATES,
};
