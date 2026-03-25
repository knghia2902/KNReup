# Phase 3: NLE Editor UI — Research

## RESEARCH COMPLETE

**Phase:** 3 — NLE Editor UI — Preview + Subtitle Editor
**Date:** 2026-03-23 (re-researched)

---

## 1. Video Preview + Canvas Subtitle Overlay

### Approach: `<video>` + Canvas Overlay (2 Layers)
- HTML5 `<video>` element ở dưới, transparent `<canvas>` chồng phía trên
- `<video>` xử lý playback (play/pause/seek/volume) — browser handles decoding
- `<canvas>` chỉ vẽ subtitle text + position indicators (drag interactions defer Phase 5)
- Dùng `requestAnimationFrame` để sync canvas redraw với video timeupdate
- Tauri `convertFileSrc()` để load video từ local filesystem

### Responsive Sizing
- Preview panel là `flex:1` trong NLELayout → dùng ResizeObserver trên container
- Canvas dimensions = video aspect ratio, letterbox nếu container khác ratio
- Scale factor = canvas display size / video native resolution (cho coordinate mapping)

### Playback Controls (36px bar)
- Custom controls: Play/Pause, seek bar, timestamp (MM:SS/MM:SS), volume, speed selector (0.5x-2x)
- `<video>` element API: `.play()`, `.pause()`, `.currentTime`, `.duration`, `.playbackRate`
- Custom controls over native — native controls không tùy biến được và che mất subtitle

### Risks
- Video format support phụ thuộc vào Chromium webview (Tauri) — MP4/H.264 OK, H.265 có thể không
- Large video files (>1GB) có thể lag seek — cần test
- Canvas và video timing có thể lệch nhẹ (<16ms) — acceptable cho preview

---

## 2. Font Rendering tiếng Việt trên Canvas

### FontFaceObserver Pattern
```javascript
import FontFaceObserver from 'fontfaceobserver';

// Load font trước khi render
const font = new FontFaceObserver('Be Vietnam Pro');
await font.load('Ẩặẫậ'); // Test string với diacritics
// Sau đó mới ctx.fillText()
```

### Vietnamese-Optimized Fonts
- **Be Vietnam Pro** — Google Font, thiết kế riêng cho tiếng Việt, diacritics chuẩn
- **Roboto** — Phổ biến nhưng Vietnamese diacritics không tối ưu bằng
- **Montserrat** — Tốt cho tiêu đề nhưng diacritics nhỏ
- Nên bundle Be Vietnam Pro làm default, cho user load thêm từ Google Fonts API

### Font Picker Implementation
- Dùng Google Fonts API (`https://fonts.googleapis.com/css2`) để load font theo tên
- Kiểm tra font có Vietnamese subset (param `&subset=vietnamese`)
- Fallback: local font files qua Tauri file system access
- Preview text: "Xin chào Việt Nam — Ẩặẫậ" để test diacritics

### Canvas Text Rendering Best Practices
- `ctx.font = '50px "Be Vietnam Pro"'` — quote font name
- `ctx.textBaseline = 'top'` cho consistent positioning
- `ctx.fillText()` + `ctx.strokeText()` cho text + outline effect
- Measure text width: `ctx.measureText(text).width` cho centering
- Line height cần extra ~20% cho Vietnamese diacritics (dấu trên cao)

---

## 3. taste-skill — Design System Rules cho Phase 3

### Đã chốt từ Phase 1 (PHẢI tuân thủ)
Từ `design-system.css` và `NLELayout.css`, các rules đã áp dụng:

| Rule | Mô tả | Áp dụng Phase 3 |
|------|--------|------------------|
| **ANTI-EMOJI** | Chỉ dùng Phosphor Icons, KHÔNG emoji | Tất cả icon trong tabs/controls |
| **Cockpit Mode** | Dense layout, monospace numbers, 1px dividers | Properties panel, sliders, timecodes |
| **Liquid Glass** | `rgba()` borders + inner shadow refraction | Tất cả panels mới, dropdowns, dialogs |
| **Tactile Feedback** | `scale(0.97)` on `:active` | Tất cả buttons, tabs, interactive elements |
| **Geist Font** | Inter BANNED, dùng Geist sans + JetBrains Mono | Tất cả UI text mới |
| **Emerald Accent** | Purple/lila BANNED, dùng `#10b981` | Active states, focus rings, slider thumbs |
| **VISUAL_DENSITY=8** | Compact spacing, small font sizes (10-13px) | Properties controls, segment list |
| **MOTION_INTENSITY=4** | Subtle transitions `0.15s-0.25s` cubic-bezier | Hover/focus/expand animations |

### taste-skill Tokens (từ design-system.css)
```css
/* Sử dụng cho tất cả components mới */
--bg-surface:    #222233;     /* Control backgrounds */
--bg-hover:      #2a2a3d;     /* Hover states */
--border:        #2d2d44;     /* Input borders */
--border-focus:  #34d399;     /* Focus rings */
--text-secondary: #94a3b8;    /* Labels */
--font-xs:       11px;        /* Control labels */
--font-sm:       12px;        /* Control values */
--sp-2:          8px;         /* Standard gap */
--duration-fast: 0.15s;       /* Transitions */
--ease-out: cubic-bezier(0.19, 1, 0.22, 1); /* Easing */
```

### Reusable Control Patterns (taste-skill compliant)
Tất cả controls mới PHẢI tuân thủ pattern:

**Slider Control:**
- Track: `height: 4px`, `background: var(--border)`, `border-radius: 2px`
- Thumb: `14px` circle, `background: var(--accent)`, hover `scale(1.2)`
- Label + value trên 1 row, compact `min-height: 22px`
- Value dùng `font-mono` (cockpit mode)

**Dropdown Control:**
- Background: `var(--bg-surface)`, border: `1px solid var(--border)`
- Hover: `var(--bg-hover)`, border: `var(--border-hover)`
- Options: glass panel popup, dividers between items
- Icon: Phosphor `CaretDown` size 12

**Toggle Control:**
- Track: `24px × 12px`, `background: var(--border)`, rounded
- Thumb: `10px` circle, translate on toggle
- Active: `background: var(--accent)`
- Transition: `0.15s cubic-bezier(0.16, 1, 0.3, 1)`

**Color Picker Control:**
- Swatch: `14px × 14px`, `border-radius: 3px`, border `rgba(255,255,255,0.15)`
- Popup: react-colorful `HexColorPicker` in glass panel overlay
- Label + swatch on 1 row, click swatch to open picker

---

## 4. Component Libraries

### Color Picker: react-colorful
- **2.8KB gzipped**, zero dependencies, tree-shakeable
- `HexColorPicker` cho hex color
- WAI-ARIA accessible, mobile-friendly touch support
- TypeScript built-in
- Install: `npm i react-colorful`

### SRT Parser: subsrt-ts
- TypeScript rewrite, ESM syntax
- Supports SRT, VTT, ASS formats
- Parse, build, convert, timeshift operations
- Install: `npm i subsrt-ts`

### State Management: Zustand
- ~1KB gzipped, hooks-based, no boilerplate
- TypeScript-first with explicit interfaces
- Persist middleware cho localStorage save/restore
- Sliced stores: `useProjectStore` cho config, `useSubtitleStore` cho segment data

```typescript
interface ProjectConfig {
  // Language & Translation
  language: string;
  translation_style: string;
  custom_prompt: string;
  // Subtitle Style
  subtitle_enabled: boolean;
  subtitle_position: number; // 1-5
  subtitle_font_size: number;
  subtitle_font: string;
  subtitle_color: string;
  subtitle_outline_color: string;
  // TTS
  dubbing_enabled: boolean;
  tts_engine: string;
  voice: string;
  speed: number;
  volume: number;
  pitch: number;
  original_volume: number;
  // Output
  codec: 'h264' | 'h265' | 'vp9';
  crf: number;
  resolution: string;
  audio_mix_mode: string;
}
```

### FontFaceObserver
- ~1.5KB gzipped, font load detection
- Install: `npm i fontfaceobserver`
- Type defs: `npm i @types/fontfaceobserver`

---

## 5. Subtitle Data Model

### Segment Structure
```typescript
interface SubtitleSegment {
  id: number;
  start: number;     // seconds
  end: number;       // seconds
  source_text: string;   // original (ZH/EN)
  translated_text: string; // translated (VI)
  confidence: number;     // Whisper confidence 0-1
  tts_status: 'pending' | 'generated' | 'error';
  tts_audio_path?: string;
}
```

### Operations
- **Edit**: Inline edit translated_text → mark tts_status = 'pending'
- **Split**: Split segment at cursor → 2 new segments with adjusted timecodes
- **Merge**: Merge 2 adjacent segments → combine text + extend timecode
- **Delete**: Remove segment, don't adjust others
- **Re-TTS**: Call backend `/api/pipeline/tts-segment` → regenerate audio for 1 segment
- **SRT Import**: Parse SRT → create segments (replace existing if confirmed)
- **SRT Export**: Build SRT string from segments → save file

### Backend Endpoints Needed
- `POST /api/subtitles/import` — upload SRT file, parse, return segments
- `GET /api/subtitles/export` — generate SRT from current segments
- `POST /api/pipeline/tts-segment` — re-TTS single segment
- `GET /api/pipeline/voices` — list available voices for selected engine (đã có)

---

## 6. Architecture Decisions

### State Management Pattern
- **Zustand** with 2 stores:
  1. `useProjectStore` — all config fields (subtitle style, TTS, output settings)
  2. `useSubtitleStore` — segments array, selected segment, edit operations
- Persist `useProjectStore` to localStorage for session restore
- `useSubtitleStore` is ephemeral — rebuilt from pipeline output or SRT import

### Component Architecture
- Upgrade existing `PropertiesPanel` → split into 4 tab components
- Each tab is a separate file: `StyleTab.tsx`, `TTSTab.tsx`, `SubTab.tsx`, `OutTab.tsx`
- Reuse `Section` + `Row` from NLELayout but extend with editable controls
- New reusable controls: `SliderControl`, `DropdownControl`, `ColorPickerControl`, `ToggleControl`

### File Organization
```
src/components/
  editor/
    VideoPreview.tsx       — video + canvas overlay
    VideoPreview.css       — preview styling (taste-skill compliant)
    VideoControls.tsx      — playback controls bar
    FontPicker.tsx         — font selection dialog
  properties/
    PropertiesPanel.tsx    — tab switcher (extracted from NLELayout)
    StyleTab.tsx           — STYLE tab content
    TTSTab.tsx             — TTS tab content
    SubTab.tsx             — SUB tab content
    OutTab.tsx             — OUT tab content
    properties.css         — shared properties styles
  controls/
    SliderControl.tsx      — reusable slider with label
    DropdownControl.tsx    — reusable dropdown
    ColorPickerControl.tsx — color picker with swatch
    ToggleControl.tsx      — toggle switch
    controls.css           — shared control styles
  layout/
    NLELayout.tsx          — existing (minimal changes)
    NLELayout.css          — existing (add new control styles)
src/stores/
  useProjectStore.ts       — Zustand config store
  useSubtitleStore.ts      — Zustand subtitle store
python-sidecar/app/routes/
  subtitles.py             — SRT import/export, subtitle management endpoints
```

### Drag Interactions Decision
- Logo/watermark drag + blur region drawing → **defer to Phase 5**
- Phase 3 scope: config fields in Properties panel (position %, size %)
- Phase 5 will add interactive preview drag overlay
- Reason: reduces Phase 3 complexity, drag requires coordinate mapping + resize logic

---

## Validation Architecture

### Dimension 1: Functional Correctness
- Video loads and plays in preview panel
- Canvas subtitle overlay shows text at correct timecodes
- Properties controls update Zustand store
- SRT import/export produces valid files

### Dimension 2: Integration
- Properties config → Canvas rendering (font, size, color, position)
- Subtitle edit → re-TTS trigger → backend call → updated audio
- Zustand store persist → session restore

### Dimension 3: Edge Cases
- Empty video state
- Very long subtitles (text wrapping on canvas)
- Rapid segment switching during playback
- Font load failure fallback
- SRT with invalid timecodes

### Dimension 4: taste-skill Compliance
- Tất cả controls dùng design-system tokens (KHÔNG hardcode colors/sizes)
- Phosphor Icons only (KHÔNG emoji, KHÔNG FontAwesome)
- Monospace cho numbers/timecodes (JetBrains Mono)
- Tactile feedback (:active scale) trên tất cả interactive elements
- Liquid Glass styling cho panels/dropdowns/dialogs
- Cockpit dense spacing (min-height 22px rows, 10-12px fonts)

---

*Research complete: 2026-03-23 (re-researched with taste-skill focus)*
