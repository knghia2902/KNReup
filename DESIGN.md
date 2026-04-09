# Design System: KNReup — Video Reupload Studio

## 1. Visual Theme & Atmosphere

A cockpit-dense, warm-neutral NLE interface that channels the precision of DaVinci Resolve and the minimalism of Linear. The atmosphere is professional yet approachable — like a well-organized editing studio with warm wood tones and matte metal surfaces. 

**Density: 8** — Information-rich panels with tight spacing; every pixel earns its place.  
**Variance: 5** — Structured asymmetry in panel splits; no centered hero layouts.  
**Motion: 4** — Restrained, functional transitions. No decorative animation. Every motion serves feedback (hover, active, toggle).

---

## 2. Color Palette & Roles

### Light Mode (Default)

| Token | Name | Hex | Role |
|-------|------|-----|------|
| `--w0` | Linen White | `#FAF9F7` | Primary background, panels |
| `--w1` | Warm Ivory | `#F3F1ED` | Secondary background, preview area |
| `--w2` | Soft Sand | `#E8E5DF` | Borders, dividers, section separators |
| `--w3` | Muted Clay | `#D8D4CC` | Inactive borders, track separators |
| `--w4` | Dusty Stone | `#C4BFB5` | Disabled UI elements, scrollbar track |
| `--w5` | Weathered Khaki | `#AAA49A` | Placeholder text |
| `--i0` | Deep Espresso | `#1C1917` | Primary text, active controls |
| `--i1` | Roasted Umber | `#2C2926` | Secondary text, hover states |
| `--i2` | Walnut Bark | `#4A4540` | Tertiary text, labels |
| `--i3` | Ash Driftwood | `#7A746C` | Muted labels, property names |
| `--i4` | Faded Pebble | `#A8A096` | Disabled text, timestamps |
| `--ac` | Burnt Sienna | `#B85C38` | **Single accent** — CTAs, active tabs, progress |
| `--ac-hover` | Ember Orange | `#E06C42` | Accent hover state |
| `--green` | Forest Moss | `#4D8F68` | Success states, system healthy LED |

### Dark Mode (`body.dark`)

| Token | Name | Hex | Role |
|-------|------|-----|------|
| `--w0` | Obsidian | `#121110` | Primary background |
| `--w1` | Charred Oak | `#1A1918` | Secondary background |
| `--w2` | Smoked Iron | `#242220` | Borders, dividers |
| `--w3` | Scorched Earth | `#32302E` | Section separators |
| `--w4` | Graphite Dust | `#484542` | Inactive borders |
| `--w5` | Storm Ash | `#605C58` | Placeholder text |
| `--i0` | Bleached Linen | `#F5F4F1` | Primary text |
| `--i1` | Parchment | `#E6E4DF` | Secondary text |
| `--i2` | Warm Fog | `#CCC8C2` | Tertiary text |
| `--i3` | Silver Sage | `#A39E98` | Muted labels |
| `--i4` | Iron Patina | `#75716C` | Disabled text |
| `--ac` | Copper Flame | `#D67A54` | Accent (brighter for contrast) |
| `--ac-hover` | Peach Ember | `#E48E6C` | Accent hover |
| `--green` | Jade Glow | `#6ABF8A` | Success states |

> **Banned:** Pure black (`#000000`), purple/neon glows, oversaturated accents (>80% saturation), warm/cool gray mixing within one mode.

---

## 3. Typography Rules

| Use | Font | Spec |
|-----|------|------|
| **Display/Section Headers** | `Instrument Serif` (italic) | 12–19px, italic, letter-spacing -0.02em. Used for panel titles and wordmark only. |
| **Body/UI Labels** | `DM Sans` | 9–12px, weight 400–500. Relaxed leading. Max 65ch on full-width text. |
| **Mono/Data** | `DM Mono` | 7–10px, weight 400. All timestamps, versions, file sizes, timecodes, property values. |
| **Vietnamese Body** | `Be Vietnam Pro` | 400–700 weight. Fallback for Vietnamese subtitle display. |

> **Banned:** `Inter`, generic system sans-serif for any visible text. Serif fonts banned in all panel/dashboard contexts — `Instrument Serif` used ONLY for decorative section headers and brand wordmark.

---

## 4. Component Stylings

### Buttons
- **Primary (`.btn.pri`):** Flat fill with `--i0`, no shadow, no glow. Hover brightens to `--i1`. Active: `transform: scale(0.97)` tactile push.
- **Secondary (`.btn`):** Ghost border with `--w3`. Hover: border darkens to `--i2`.
- **Danger (`.btn.danger`):** Ghost, hover reveals `--ac` border + text.
- **Export (`.expbtn`):** Full-width, `--i0` fill → hover transitions to `--ac`. Single CTA pattern.

### Inputs & Controls
- **Text/Number (`.pinp`, `.pnum`):** Flat `--w1` fill, 1px `--w3` border, `--r4` radius. Focus: border → `--i3`. No floating labels.
- **Select (`.psel`):** Custom SVG chevron. Same fill/border pattern.
- **Toggle (`.tog`):** 28×15px pill. Off: `--w3` fill. On: `--i0` fill. Thumb slides with `--tr` transition.
- **Slider (`.pslider`):** Thin 2px track, accent color on filled portion.
- **Color Picker (`.cinp`):** 20×20px swatch, 1px border.

### Cards
- **Media Items (`.mitem`):** Used ONLY in Media Bin. 1.5px transparent border → hover reveals `--w3`. Active: `--i0` border. No shadow.
- **Engine Cards (`.ecard`):** 2-column grid. Ghost border → active inverts to `--i0` fill with white text.

### Loading States
- **Progress Bar (`.proctrack`):** Skeletal 2px track with `--ac` fill. Percentage in monospace.
- No circular spinners. Processing overlay uses opaque dark backdrop with inline progress.

### Empty States
- Centered serif italic placeholder text at very low opacity. No generic icons.

---

## 5. Layout Principles

- **Grid Architecture:** 4-panel NLE split — Media Bin (204px) | Preview (flex) | Properties (264px) | Timeline (116px bottom).
- **Sidebar:** 48px icon rail, vertical. Active = inverted fill. Tooltip on hover.
- **Titlebar:** 44px, draggable. Navigation tabs with 2px bottom-border active indicator.
- **Panel Borders:** 1px solid `--w3` dividers. No card shadows for panel separation — structural lines only.
- **Max Density:** All panels use tight 3–12px padding. No wasted whitespace.
- **Resizable Panels:** Drag handles with 8px hit area, 1px visual line → accent highlight on drag.

---

## 6. Motion & Interaction

- **Base Transition:** `0.13s` (`--tr`) for all hover/focus/active states. No spring physics — tool UI demands instant tactile response.
- **Tactile Feedback:** All clickable elements use `transform: scale(0.92–0.97)` on `:active`.
- **Toggle Animation:** Thumb slides via `transform: translateX(13px)` with `--tr` duration.
- **Progress Fill:** `transition: width 0.3s` for smooth progress bar updates.
- **System LED Pulse:** `@keyframes pulse` — 2s ease-in-out infinite for warning states only.
- **Hardware Acceleration:** All animations use `transform` and `opacity` exclusively. Never animate `width`, `height`, `top`, `left`.

---

## 7. Dark Mode Switching

- Toggle via `body.dark` class on `<body>` element.
- All colors reference CSS custom properties (`--w0` through `--i4`, `--ac`, `--green`).
- Dark mode overrides ONLY the variable values — zero structural CSS changes needed.
- Transition: `body { transition: background-color 0.3s, color 0.3s; }` for smooth theme switch.

---

## 8. Anti-Patterns (Banned)

- No emojis in UI
- No `Inter` font
- No pure black (`#000000`) — always use `--i0` (Espresso/Obsidian)
- No neon/outer glow shadows
- No oversaturated accents (saturation < 80%)
- No 3-column equal card grids
- No centered hero layouts
- No circular loading spinners
- No custom mouse cursors
- No overlapping elements — clean spatial zones
- No `h-screen` — use `100vh` or `100dvh`
- No AI copywriting clichés ("Elevate", "Seamless", "Next-Gen")
- No scroll-to-explore text or bouncing chevrons
- No broken placeholder images — use solid color fills or SVG
