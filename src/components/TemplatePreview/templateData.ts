/* ═══════════════════════════════════════════════════════════
   KNReup — Template Data (TypeScript)
   12 Smart Templates + 6 Themes + 3 Layouts
   ═══════════════════════════════════════════════════════════ */

export interface ThemePalette {
    name: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentDark: string;
    secondary: string;
    dot: string;
}

export interface LayoutPreset {
    name: string;
    bodyFont: string;
    headlineFont: string;
    serifFont: string;
    dotColor: string;
    borderRadius: string;
    grain: boolean;
}

export interface SmartTemplate {
    id: string;
    name: string;
    icon: string;
    desc: string;
    sampleData: Record<string, any>;
    render: (container: HTMLElement, data: any, theme: ThemePalette) => void;
    animate: (container: HTMLElement, tl: gsap.core.Timeline) => void;
}

// ── Helper ──────────────────────────────────────────────
export function el(tag: string, className?: string, text?: string): HTMLElement {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

// ═════════════════════════════════════════════════════════
// 6 THEME PALETTES
// ═════════════════════════════════════════════════════════

export const THEME_PALETTES: Record<string, ThemePalette> = {
    'tech-blue': {
        name: 'Tech Blue',
        bg: '#0a0e1a', surface: '#111827', text: '#f0f4ff',
        muted: '#64748b', accent: '#3b82f6', accentDark: '#1d4ed8',
        secondary: '#8b5cf6', dot: '#3b82f6'
    },
    'growth-green': {
        name: 'Growth Green',
        bg: '#061210', surface: '#0a1f1c', text: '#ecfdf5',
        muted: '#6b8f85', accent: '#10b981', accentDark: '#059669',
        secondary: '#34d399', dot: '#10b981'
    },
    'finance-gold': {
        name: 'Finance Gold',
        bg: '#110f07', surface: '#1c1a0f', text: '#fef9e7',
        muted: '#a39770', accent: '#f59e0b', accentDark: '#d97706',
        secondary: '#fbbf24', dot: '#f59e0b'
    },
    'warning-red': {
        name: 'Warning Red',
        bg: '#120808', surface: '#1e0f0f', text: '#fef2f2',
        muted: '#a07070', accent: '#ef4444', accentDark: '#dc2626',
        secondary: '#f87171', dot: '#ef4444'
    },
    'creator-purple': {
        name: 'Creator Purple',
        bg: '#0d0a14', surface: '#1a1425', text: '#f5f0ff',
        muted: '#8878a0', accent: '#a855f7', accentDark: '#9333ea',
        secondary: '#c084fc', dot: '#a855f7'
    },
    'news-mono': {
        name: 'News Mono',
        bg: '#0f0f0f', surface: '#1a1a1a', text: '#e8e8e8',
        muted: '#777777', accent: '#ffffff', accentDark: '#cccccc',
        secondary: '#aaaaaa', dot: '#ffffff'
    }
};

// ═════════════════════════════════════════════════════════
// 3 LAYOUT PRESETS
// ═════════════════════════════════════════════════════════

export const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
    'default': {
        name: 'Default',
        bodyFont: "'Manrope', sans-serif",
        headlineFont: "'Anton', sans-serif",
        serifFont: "'Lora', serif",
        dotColor: '#3b82f6',
        borderRadius: '32px',
        grain: true
    },
    'minimalist': {
        name: 'Minimalist',
        bodyFont: "'Inter', sans-serif",
        headlineFont: "'Playfair Display', serif",
        serifFont: "'Playfair Display', serif",
        dotColor: '#a78bfa',
        borderRadius: '8px',
        grain: false
    },
    'brutalist': {
        name: 'Brutalist',
        bodyFont: "'Space Mono', monospace",
        headlineFont: "'Bebas Neue', sans-serif",
        serifFont: "'Space Mono', monospace",
        dotColor: '#ffeb3b',
        borderRadius: '0px',
        grain: true
    }
};

// ═════════════════════════════════════════════════════════
// 12 SMART TEMPLATES
// ═════════════════════════════════════════════════════════

import { DEFAULT_SET } from './sets/defaultSet';

// Backward compatible — giữ SMART_TEMPLATES cho code cũ
export const SMART_TEMPLATES = DEFAULT_SET.templates;

// ── Layout Override Helper ──────────────────────────────
export function applyLayoutOverrides(container: HTMLElement, viewport: HTMLElement, layout: LayoutPreset, theme: ThemePalette): void {
    // Override headline fonts based on layout
    container.querySelectorAll<HTMLElement>('.hook-headline, .outro-cta, .cd-number, .tc-title, .callout-tag').forEach(el => {
        el.style.fontFamily = layout.headlineFont;
    });
    container.querySelectorAll<HTMLElement>('.quote-text, .hook-subhead').forEach(el => {
        el.style.fontFamily = layout.serifFont;
    });
    // Border radius
    container.querySelectorAll<HTMLElement>('.comp-side, .callout-box, .dg-cell, .outro-channel').forEach(el => {
        el.style.borderRadius = layout.borderRadius;
    });

    // Brutalist special
    if (layout === LAYOUT_PRESETS.brutalist) {
        container.querySelectorAll<HTMLElement>('.callout-box').forEach(el => {
            el.style.background = 'none';
            el.style.border = `8px solid ${theme.accent}`;
            el.style.boxShadow = 'none';
        });
        container.querySelectorAll<HTMLElement>('.dg-cell').forEach(el => {
            el.style.border = `4px solid ${theme.accent}`;
            el.style.background = 'none';
        });
    }

    // Minimalist special
    if (layout === LAYOUT_PRESETS.minimalist) {
        viewport.style.backgroundColor = '#f8fafc';
        viewport.style.color = '#1e293b';
        container.querySelectorAll<HTMLElement>('.stat-label, .comp-label, .tl-event, .split-body, .quote-text').forEach(el => {
            el.style.color = '#475569';
        });
        container.querySelectorAll<HTMLElement>('.stat-value, .hook-headline, .tc-title, .feature-title, .dg-title, .tl-title, .prog-title').forEach(el => {
            el.style.color = '#0f172a';
        });
    }
}
