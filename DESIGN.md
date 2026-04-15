# Design System: KNReup — Video Reupload Studio

## 1. Visual Theme & Atmosphere

A cockpit-dense, warm-neutral NLE interface with the precision of DaVinci Resolve and the minimalism of Linear. Professional yet approachable — every pixel earns its place through function.

**Density: 8** — Information-rich panels with tight spacing.
**Variance: 5** — Structured asymmetry in panel splits.
**Motion: 4** — Restrained, functional transitions. Every motion serves feedback.

---

## 2. Color Palette & Roles

### Light Mode (Default)

| Token | Name | Value | Role |
|-------|------|-------|------|
| `--bg-primary` | Warm Ivory | `#f3f1ed` | Primary background |
| `--bg-secondary` | Linen White | `#faf9f7` | Panel backgrounds |
| `--bg-surface` | Pure Surface | `#ffffff` | Input/card fill |
| `--bg-deep` | Soft Sand | `#e8e5df` | Recessed areas |
| `--text-primary` | Deep Espresso | `#1c1917` | Primary text |
| `--text-secondary` | Roasted Umber | `#2c2926` | Secondary text |
| `--text-muted` | Ash Driftwood | `#7a746c` | Labels, hints |
| `--text-disabled` | Faded Pebble | `#a8a096` | Disabled states |
| `--border` | Muted Clay | `#d8d4cc` | Borders, dividers |
| `--accent` | Burnt Sienna | `#b85c38` | CTAs, active tabs |
| `--accent-hover` | Ember Orange | `#e06c42` | Accent hover |
| `--success` | Forest Moss | `#4d8f68` | Success states |

### Dark Mode (`body.dark`)

| Token | Name | Value | Role |
|-------|------|-------|------|
| `--bg-primary` | Charcoal | `#171615` | Primary background |
| `--bg-secondary` | Obsidian | `#0f0e0d` | Panel backgrounds |
| `--bg-surface` | Smoked Iron | `#1f1e1c` | Input/card fill |
| `--bg-deep` | Void | `#0a0908` | Recessed areas |
| `--text-primary` | Bleached Linen | `#f0eeeb` | Primary text |
| `--text-secondary` | Parchment | `#dddbd7` | Secondary text |
| `--text-muted` | Silver Sage | `#8a857e` | Labels, hints |
| `--text-disabled` | Iron Patina | `#656059` | Disabled states |
| `--border` | Scorched Earth | `#2a2927` | Borders, dividers |
| `--accent` | Copper Flame | `#d67a54` | CTAs, active tabs |
| `--accent-hover` | Peach Ember | `#e48e6c` | Accent hover |
| `--success` | Jade Glow | `#6abf8a` | Success states |

> **Banned:** Pure black (`#000000`), purple/neon glows, oversaturated accents (>80% saturation).

---

## 3. Typography Rules

| Use | Font | Spec |
|-----|------|------|
| **All UI Text** | `Geist` | 9-17px, weight 300-700. Clean geometric sans. |
| **Data/Mono** | `Geist Mono` | 7-10px, weight 400-500. Timestamps, versions, timecodes. |
| **Vietnamese** | `Be Vietnam Pro` | 400-700 weight. Subtitle display fallback. |

> **Banned:** `Inter`, `DM Sans`, `Instrument Serif`, generic system fonts. No serif fonts anywhere.

---

## 4. Component Stylings

* **Buttons:** Flat, no outer glow. Primary: accent fill. Active: `scale(0.97)` tactile push.
* **Inputs:** `--bg-surface` fill, `--border` ring. Focus: border → `--accent`.
* **Toggle:** 28x15px pill. Off: `--border`. On: `--accent`.
* **Cards:** Used only in Media Bin. Transparent border → hover reveals `--border`.
* **Loaders:** Progress bar with accent fill. No circular spinners.

---

## 5. Layout Principles

* 4-panel NLE: Media Bin (204px) | Preview (flex) | Properties (264px) | Timeline (116px bottom).
* Sidebar: 48px icon rail. Active = accent-subtle fill.
* Titlebar: 44px, draggable. Tabs with 2px accent bottom-border.
* All panel dividers: 1px solid `--border`. No card shadows.

---

## 6. Motion & Interaction

* Base: `0.15s` for hover/focus/active. No spring physics — instant tactile response.
* Tactile: `scale(0.92-0.97)` on `:active`.
* Theme: `transition: background-color .3s, color .3s` for smooth switch.
* Hardware: Only `transform` and `opacity`. Never `width`, `height`, `top`, `left`.

---

## 7. Dark Mode Switching

* Toggle via `body.dark` class.
* All colors reference CSS custom properties.
* Dark mode overrides ONLY variable values — zero structural changes.

---

## 8. Anti-Patterns (Banned)

* No pure black (`#000000`)
* No `Inter` or `DM Sans` font
* No serif fonts in UI
* No neon/outer glow shadows
* No oversaturated accents (saturation < 80%)
* No 3-column equal card grids
* No circular loading spinners
* No custom mouse cursors
* No overlapping elements
* No `h-screen` — use `100dvh`
* No AI copywriting cliches
