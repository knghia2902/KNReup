import { SmartTemplate, el } from '../templateData';
import type { TemplateSet } from './index';

// Helper to apply Social fonts
function applySocialFonts(el: HTMLElement, type: 'headline' | 'body') {
    if (type === 'headline') {
        el.style.fontFamily = "'Manrope', sans-serif";
        el.style.fontWeight = '900';
    } else {
        el.style.fontFamily = "'Manrope', sans-serif";
        el.style.fontWeight = '600';
    }
}

// Helper to add neon text glow
function addTextGlow(el: HTMLElement, color: string) {
    el.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}50`;
}

// Helper to add neon box glow
function addBoxGlow(el: HTMLElement, color: string) {
    el.style.boxShadow = `0 0 20px ${color}40, inset 0 0 20px ${color}10`;
}

export const SOCIAL_MEDIA_TEMPLATES: SmartTemplate[] = [
    {
        id: 'hook', name: 'Hook', icon: '⚡', desc: 'Headline + Ken Burns BG',
        sampleData: { headline: 'APPLE ĐÃ LÀM GÌ MÀ CẢ THẾ GIỚI SỐC?', subhead: 'Sự thật đằng sau thương vụ tỷ đô' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.padding = '60px';
            if (d.bgSrc) {
                const bgHtml = `<div class="bg-blur" style="position: absolute; inset: 0; background-image: url('${d.bgSrc}'); background-size: cover; background-position: center; filter: blur(35px); opacity: 0.35; transform: scale(1.1); z-index: -2;"></div>
                   <div class="bg" style="background-image: url('${d.bgSrc}'); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1040px; height: 585px; background-size: cover; background-position: center; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); opacity: 0.9; z-index: -1;"></div>`;
                c.insertAdjacentHTML('afterbegin', bgHtml);
            }
            
            const h = el('div', 'social-headline', d.headline); 
            h.style.color = '#fff';
            applySocialFonts(h, 'headline');
            h.style.fontSize = '80px';
            h.style.textAlign = 'center';
            h.style.lineHeight = '1.1';
            h.style.textTransform = 'uppercase';
            addTextGlow(h, theme.accent);
            
            c.appendChild(h);
            
            if (d.subhead) {
                const s = el('div', 'social-subhead', d.subhead); 
                s.style.color = theme.accent;
                applySocialFonts(s, 'body');
                s.style.fontSize = '36px';
                s.style.marginTop = '24px';
                s.style.textAlign = 'center';
                s.style.background = '#00000080';
                s.style.padding = '12px 24px';
                s.style.borderRadius = '24px';
                c.appendChild(s);
            }
        },
        animate(c, tl) {
            const h = c.querySelector('.social-headline');
            const s = c.querySelector('.social-subhead');
            if (h) tl.fromTo(h, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
            if (s) tl.fromTo(s, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.3');
        }
    },
    {
        id: 'stat-hero', name: 'Stat Hero', icon: '📊', desc: 'Big number highlight',
        sampleData: { value: '97%', label: 'Người dùng hài lòng', context: 'Khảo sát Q4 2025' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            
            const v = el('div', 'social-stat-value', d.value); v.style.color = '#fff';
            applySocialFonts(v, 'headline');
            v.style.fontSize = '200px';
            addTextGlow(v, theme.accent);
            
            const lWrap = el('div', 'social-stat-label-wrap');
            lWrap.style.background = theme.surface;
            lWrap.style.padding = '20px 40px';
            lWrap.style.borderRadius = '40px';
            lWrap.style.marginTop = '20px';
            lWrap.style.border = `2px solid ${theme.accent}`;
            addBoxGlow(lWrap, theme.accent);
            
            const l = el('div', 'social-stat-label', `🔥 ${d.label}`); l.style.color = theme.text;
            applySocialFonts(l, 'headline');
            l.style.fontSize = '40px';
            lWrap.appendChild(l);
            
            c.appendChild(v); c.appendChild(lWrap);
            
            if (d.context) {
                const ctx = el('div', 'social-stat-context', d.context); 
                ctx.style.color = theme.muted;
                applySocialFonts(ctx, 'body');
                ctx.style.fontSize = '24px';
                ctx.style.marginTop = '24px';
                c.appendChild(ctx);
            }
        },
        animate(c, tl) {
            const v = c.querySelector('.social-stat-value');
            const l = c.querySelector('.social-stat-label-wrap');
            const ctx = c.querySelector('.social-stat-context');
            if (v) tl.fromTo(v, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
            if (l) tl.fromTo(l, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.4');
            if (ctx) tl.fromTo(ctx, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.2');
        }
    },
    {
        id: 'comparison', name: 'Comparison', icon: '⚖️', desc: 'VS side-by-side',
        sampleData: { left: { label: 'iPhone 16', value: '$799' }, right: { label: 'Galaxy S25', value: '$749' } },
        render(c, d, theme) {
            c.style.padding = '60px 40px';
            const w = el('div', 'social-comparison-wrapper');
            w.style.display = 'flex';
            w.style.flexDirection = 'column';
            w.style.gap = '40px';
            w.style.width = '100%';
            w.style.alignItems = 'center';
            w.style.justifyContent = 'center';
            w.style.height = '100%';
            
            const createSide = (data: any, color: string) => {
                const side = el('div', 'social-comp-side');
                side.style.background = `linear-gradient(135deg, ${theme.surface}, #111)`;
                side.style.border = `4px solid ${color}`;
                side.style.borderRadius = '24px';
                side.style.padding = '40px';
                side.style.width = '100%';
                side.style.textAlign = 'center';
                addBoxGlow(side, color);
                
                side.innerHTML = `<div class="social-comp-label" style="font-family:'Manrope',sans-serif;font-weight:900;font-size:40px;color:${theme.text};">${data.label}</div>
                                  <div class="social-comp-value" style="font-family:'Manrope',sans-serif;font-weight:900;font-size:72px;color:${color}">${data.value}</div>`;
                return side;
            };
            
            const l = createSide(d.left, theme.accent);
            const vs = el('div', 'social-comp-vs', 'VS');
            applySocialFonts(vs, 'headline');
            vs.style.fontSize = '48px';
            vs.style.color = '#fff';
            vs.style.background = '#000';
            vs.style.padding = '16px';
            vs.style.borderRadius = '50%';
            vs.style.border = `2px solid ${theme.text}`;
            vs.style.position = 'absolute';
            vs.style.top = '50%';
            vs.style.left = '50%';
            vs.style.transform = 'translate(-50%, -50%)';
            vs.style.zIndex = '10';
            
            const r = createSide(d.right, theme.secondary || '#888');
            
            w.appendChild(l); w.appendChild(r);
            c.appendChild(w); c.appendChild(vs);
        },
        animate(c, tl) {
            const w = c.querySelector('.social-comparison-wrapper');
            const vs = c.querySelector('.social-comp-vs');
            if (!w) return;
            tl.fromTo(w.children[0], { x: -60, opacity: 0, rotation: -5 }, { x: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.2)' });
            tl.fromTo(w.children[1], { x: 60, opacity: 0, rotation: 5 }, { x: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.2)' }, '-=0.3');
            if (vs) tl.fromTo(vs, { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, '-=0.2');
        }
    },
    {
        id: 'feature-list', name: 'Feature List', icon: '📋', desc: 'Title + bullet points',
        sampleData: { title: 'Tính năng nổi bật', bullets: ['AI tự động phân tích', 'Render real-time 4K', 'Export đa nền tảng', 'Chỉnh sửa không phá hủy'] },
        render(c, d, theme) {
            c.style.padding = '60px 40px';
            c.style.justifyContent = 'center';
            const t = el('div', 'social-feature-title', d.title); t.style.color = '#fff';
            applySocialFonts(t, 'headline');
            t.style.fontSize = '64px';
            t.style.marginBottom = '40px';
            t.style.textAlign = 'center';
            addTextGlow(t, theme.accent);
            c.appendChild(t);
            
            const emojis = ['✨', '🚀', '🔥', '💎', '🎯'];
            
            d.bullets.forEach((b: string, i: number) => {
                const item = el('div', 'social-feature-item');
                item.style.background = theme.surface;
                item.style.borderRadius = '24px';
                item.style.padding = '24px 32px';
                item.style.marginBottom = '20px';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.border = `2px solid transparent`;
                
                const emoji = emojis[i % emojis.length];
                const dot = el('div', 'social-feature-bullet', emoji); 
                dot.style.fontSize = '40px';
                dot.style.marginRight = '20px';
                
                const txt = el('div', 'social-feature-text', b);
                applySocialFonts(txt, 'headline');
                txt.style.fontSize = '32px';
                txt.style.color = theme.text;
                
                item.appendChild(dot); item.appendChild(txt);
                c.appendChild(item);
            });
        },
        animate(c, tl) {
            const t = c.querySelector('.social-feature-title');
            if (t) tl.fromTo(t, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
            c.querySelectorAll('.social-feature-item').forEach((it, i) => {
                tl.fromTo(it, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.2)' }, `-=${i ? 0.15 : 0}`);
            });
        }
    },
    {
        id: 'callout', name: 'Callout', icon: '🔔', desc: 'Bold statement + tag',
        sampleData: { tag: 'CẢNH BÁO', statement: 'Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.padding = '40px';
            const box = el('div', 'social-callout-box');
            box.style.background = theme.surface;
            box.style.borderRadius = '32px';
            box.style.border = `4px solid ${theme.accent}`;
            box.style.padding = '60px 40px';
            box.style.width = '100%';
            box.style.textAlign = 'center';
            addBoxGlow(box, theme.accent);
            
            if (d.tag) {
                const tag = el('div', 'social-callout-tag', d.tag); 
                tag.style.color = theme.accent;
                applySocialFonts(tag, 'headline');
                tag.style.fontSize = '36px';
                tag.style.marginBottom = '24px';
                addTextGlow(tag, theme.accent);
                box.appendChild(tag);
            }
            
            const st = el('div', 'social-callout-statement', d.statement); st.style.color = theme.text;
            applySocialFonts(st, 'headline');
            st.style.fontSize = '56px';
            st.style.lineHeight = '1.3';
            
            box.appendChild(st);
            c.appendChild(box);
        },
        animate(c, tl) {
            const box = c.querySelector('.social-callout-box');
            if (box) tl.fromTo(box, { scale: 0.5, rotation: -10, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.7)' });
        }
    },
    {
        id: 'outro', name: 'Outro', icon: '🎬', desc: 'CTA + follow card',
        sampleData: { ctaTop: 'THEO DÕI NGAY', channelName: 'KNReup News', source: 'vnexpress.net' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.alignItems = 'center';
            
            const cta = el('div', 'social-outro-cta', d.ctaTop); cta.style.color = theme.accent;
            applySocialFonts(cta, 'headline');
            cta.style.fontSize = '64px';
            cta.style.marginBottom = '40px';
            addTextGlow(cta, theme.accent);
            
            const ch = el('div', 'social-outro-channel', d.channelName);
            ch.style.background = theme.text; ch.style.color = theme.bg;
            ch.style.padding = '24px 60px';
            ch.style.borderRadius = '60px';
            applySocialFonts(ch, 'headline');
            ch.style.fontSize = '56px';
            ch.style.marginBottom = '40px';
            
            const src = el('div', 'social-outro-source', `❤️ Nguồn: ${d.source}`); src.style.color = theme.muted;
            applySocialFonts(src, 'body');
            src.style.fontSize = '28px';
            
            c.appendChild(cta); c.appendChild(ch); c.appendChild(src);
        },
        animate(c, tl) {
            const cta = c.querySelector('.social-outro-cta');
            const ch = c.querySelector('.social-outro-channel');
            const src = c.querySelector('.social-outro-source');
            if (cta) tl.fromTo(cta, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
            if (ch) tl.fromTo(ch, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, '-=0.3');
            if (src) tl.fromTo(src, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.2');
        }
    },
    {
        id: 'quote', name: 'Quote', icon: '💬', desc: 'Citation / pull quote',
        sampleData: { text: 'Công nghệ tốt nhất là công nghệ mà bạn không nhận ra nó đang ở đó.', author: '— Tim Cook, CEO Apple' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.padding = '60px';
            
            const mark = el('div', 'social-quote-mark', '❝'); mark.style.color = theme.accent;
            applySocialFonts(mark, 'headline');
            mark.style.fontSize = '120px';
            mark.style.lineHeight = '1';
            mark.style.marginBottom = '20px';
            addTextGlow(mark, theme.accent);
            
            const txt = el('div', 'social-quote-text', d.text); txt.style.color = theme.text;
            applySocialFonts(txt, 'headline');
            txt.style.fontSize = '64px';
            txt.style.fontStyle = 'italic';
            txt.style.lineHeight = '1.3';
            
            const auth = el('div', 'social-quote-author', d.author); auth.style.color = theme.bg;
            auth.style.background = theme.accent;
            auth.style.padding = '12px 24px';
            auth.style.borderRadius = '20px';
            applySocialFonts(auth, 'headline');
            auth.style.fontSize = '32px';
            auth.style.marginTop = '40px';
            auth.style.alignSelf = 'flex-end';
            
            c.appendChild(mark); c.appendChild(txt); c.appendChild(auth);
        },
        animate(c, tl) {
            const mark = c.querySelector('.social-quote-mark');
            const txt = c.querySelector('.social-quote-text');
            const auth = c.querySelector('.social-quote-author');
            if (mark) tl.fromTo(mark, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
            if (txt) tl.fromTo(txt, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
            if (auth) tl.fromTo(auth, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.1');
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
            c.style.padding = '60px 40px';
            c.style.justifyContent = 'center';
            const t = el('div', 'social-tl-title', d.title); t.style.color = '#fff';
            applySocialFonts(t, 'headline');
            t.style.fontSize = '56px';
            t.style.marginBottom = '60px';
            t.style.textAlign = 'center';
            addTextGlow(t, theme.accent);
            c.appendChild(t);
            
            const wrapper = el('div', 'social-tl-wrapper');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.gap = '32px';
            wrapper.style.position = 'relative';
            
            const line = el('div', 'social-tl-line');
            line.style.position = 'absolute';
            line.style.left = '23px';
            line.style.top = '10px';
            line.style.bottom = '10px';
            line.style.width = '4px';
            line.style.background = theme.accent;
            addBoxGlow(line, theme.accent);
            wrapper.appendChild(line);
            
            d.events.forEach((ev: any) => {
                const row = el('div', 'social-tl-row');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '32px';
                row.style.position = 'relative';
                row.style.zIndex = '2';
                
                const dot = el('div', 'social-tl-dot'); 
                dot.style.background = theme.bg;
                dot.style.border = `4px solid ${theme.accent}`;
                dot.style.width = '24px'; dot.style.height = '24px';
                dot.style.borderRadius = '50%';
                addBoxGlow(dot, theme.accent);
                
                const content = el('div');
                content.style.background = theme.surface;
                content.style.padding = '20px 32px';
                content.style.borderRadius = '24px';
                content.style.width = '100%';
                
                const yr = el('div', 'social-tl-year', ev.year); yr.style.color = theme.accent;
                applySocialFonts(yr, 'headline');
                yr.style.fontSize = '32px';
                
                const ev2 = el('div', 'social-tl-event', ev.event); ev2.style.color = theme.text;
                applySocialFonts(ev2, 'body');
                ev2.style.fontSize = '32px';
                
                content.appendChild(yr); content.appendChild(ev2);
                row.appendChild(dot); row.appendChild(content);
                wrapper.appendChild(row);
            });
            c.appendChild(wrapper);
        },
        animate(c, tl) {
            const title = c.querySelector('.social-tl-title');
            if (title) tl.fromTo(title, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            
            c.querySelectorAll('.social-tl-row').forEach((r, i) => {
                tl.fromTo(r, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.2)' }, `-=${i ? 0.15 : 0}`);
            });
        }
    },
    {
        id: 'countdown', name: 'Countdown', icon: '⏱️', desc: 'Big countdown number',
        sampleData: { label: 'Thời gian còn lại', number: '03', unit: 'NGÀY' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            const lbl = el('div', 'social-cd-label', d.label); lbl.style.color = theme.text;
            applySocialFonts(lbl, 'headline');
            lbl.style.fontSize = '40px';
            lbl.style.background = theme.surface;
            lbl.style.padding = '16px 32px';
            lbl.style.borderRadius = '32px';
            lbl.style.marginBottom = '20px';
            
            const num = el('div', 'social-cd-number', d.number); num.style.color = '#fff';
            applySocialFonts(num, 'headline');
            num.style.fontSize = '320px';
            num.style.lineHeight = '1';
            addTextGlow(num, theme.accent);
            
            const unit = el('div', 'social-cd-unit', d.unit); unit.style.color = theme.accent;
            applySocialFonts(unit, 'headline');
            unit.style.fontSize = '64px';
            
            c.appendChild(lbl); c.appendChild(num); c.appendChild(unit);
        },
        animate(c, tl) {
            const lbl = c.querySelector('.social-cd-label');
            const num = c.querySelector('.social-cd-number');
            const unit = c.querySelector('.social-cd-unit');
            if (lbl) tl.fromTo(lbl, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' });
            if (num) tl.fromTo(num, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' }, '-=0.2');
            if (unit) tl.fromTo(unit, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.4');
        }
    },
    {
        id: 'split-image', name: 'Split Image', icon: '🖼️', desc: 'Image + text split',
        sampleData: { headline: 'Trải nghiệm hoàn toàn mới', body: 'Giao diện được thiết kế lại từ đầu, tối ưu cho mọi thiết bị.' },
        render(c, d, theme) {
            c.style.padding = '0';
            const wrap = el('div', 'social-split-wrap');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.height = '100%';
            wrap.style.width = '100%';
            
            const img = el('div', 'social-split-img');
            img.style.flex = '1';
            img.style.background = `linear-gradient(to bottom, transparent, ${theme.bg})`;
            img.style.display = 'flex';
            img.style.alignItems = 'center';
            img.style.justifyContent = 'center';
            img.style.position = 'relative';
            const ph = el('div', 'social-split-img-placeholder', '✨');
            ph.style.fontSize = '120px';
            img.appendChild(ph);
            
            const textZone = el('div', 'social-split-text-zone');
            textZone.style.padding = '40px 60px 80px 60px';
            textZone.style.textAlign = 'center';
            textZone.style.background = theme.bg;
            textZone.style.position = 'relative';
            textZone.style.zIndex = '2';
            
            const h = el('div', 'social-split-headline', d.headline); h.style.color = '#fff';
            applySocialFonts(h, 'headline');
            h.style.fontSize = '64px';
            h.style.marginBottom = '24px';
            addTextGlow(h, theme.accent);
            
            const b = el('div', 'social-split-body', d.body); b.style.color = theme.text;
            applySocialFonts(b, 'body');
            b.style.fontSize = '32px';
            b.style.lineHeight = '1.4';
            
            textZone.appendChild(h); textZone.appendChild(b);
            wrap.appendChild(img); wrap.appendChild(textZone);
            c.appendChild(wrap);
        },
        animate(c, tl) {
            const ph = c.querySelector('.social-split-img-placeholder');
            const h = c.querySelector('.social-split-headline');
            const b = c.querySelector('.social-split-body');
            if (ph) tl.fromTo(ph, { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' });
            if (h) tl.fromTo(h, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.3');
            if (b) tl.fromTo(b, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');
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
            c.style.justifyContent = 'center';
            const t = el('div', 'social-dg-title', d.title); t.style.color = '#fff';
            applySocialFonts(t, 'headline');
            t.style.fontSize = '64px';
            t.style.marginBottom = '40px';
            addTextGlow(t, theme.accent);
            c.appendChild(t);
            
            const grid = el('div', 'social-dg-grid');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '24px';
            grid.style.width = '100%';
            
            d.cells.forEach((cell: any) => {
                const ce = el('div', 'social-dg-cell');
                ce.style.background = theme.surface;
                ce.style.borderRadius = '32px';
                ce.style.padding = '40px 20px';
                ce.style.textAlign = 'center';
                ce.style.border = `2px solid ${theme.accent}40`;
                
                const v = el('div', 'social-dg-cell-value', cell.value); v.style.color = theme.accent;
                applySocialFonts(v, 'headline');
                v.style.fontSize = '72px';
                const l = el('div', 'social-dg-cell-label', cell.label); l.style.color = theme.text;
                applySocialFonts(l, 'body');
                l.style.fontSize = '28px';
                l.style.marginTop = '12px';
                ce.appendChild(v); ce.appendChild(l);
                grid.appendChild(ce);
            });
            c.appendChild(grid);
        },
        animate(c, tl) {
            const t = c.querySelector('.social-dg-title');
            if (t) tl.fromTo(t, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            c.querySelectorAll('.social-dg-cell').forEach((cell, i) => {
                tl.fromTo(cell, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'elastic.out(1, 0.7)' }, `-=${i ? 0.2 : 0}`);
            });
        }
    },
    {
        id: 'title-card', name: 'Title Card', icon: '🏷️', desc: 'Category + big title',
        sampleData: { category: 'CÔNG NGHỆ', title: 'THẾ GIỚI AI ĐANG THAY ĐỔI', date: '04 Tháng 5, 2025' },
        render(c, d, theme) {
            c.style.justifyContent = 'center';
            c.style.alignItems = 'center';
            
            const cat = el('div', 'social-tc-category', d.category); cat.style.color = theme.bg;
            cat.style.background = `linear-gradient(45deg, ${theme.accent}, #ff00ff)`;
            cat.style.padding = '16px 32px';
            cat.style.borderRadius = '40px';
            applySocialFonts(cat, 'headline');
            cat.style.fontSize = '32px';
            cat.style.marginBottom = '40px';
            
            const title = el('div', 'social-tc-title', d.title); title.style.color = '#fff';
            applySocialFonts(title, 'headline');
            title.style.fontSize = '100px';
            title.style.textAlign = 'center';
            title.style.lineHeight = '1.1';
            addTextGlow(title, theme.accent);
            
            const date = el('div', 'social-tc-date', d.date); date.style.color = theme.muted;
            applySocialFonts(date, 'headline');
            date.style.fontSize = '28px';
            date.style.marginTop = '40px';
            date.style.background = theme.surface;
            date.style.padding = '12px 24px';
            date.style.borderRadius = '20px';
            
            c.appendChild(cat); c.appendChild(title); c.appendChild(date);
        },
        animate(c, tl) {
            const cat = c.querySelector('.social-tc-category');
            const title = c.querySelector('.social-tc-title');
            const date = c.querySelector('.social-tc-date');
            if (cat) tl.fromTo(cat, { y: -40, opacity: 0, rotation: -5 }, { y: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.5)' });
            if (title) tl.fromTo(title, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }, '-=0.3');
            if (date) tl.fromTo(date, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');
        }
    }
];

export const SOCIAL_MEDIA_SET: TemplateSet = {
    id: 'social-media',
    name: 'Social Media',
    description: 'TikTok/Reels style — neon glow, fast bounces, emoji markers',
    templates: SOCIAL_MEDIA_TEMPLATES,
};
