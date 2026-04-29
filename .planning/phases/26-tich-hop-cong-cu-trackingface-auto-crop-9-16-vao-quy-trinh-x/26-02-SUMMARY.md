---
status: complete
---

# Plan 26-02 Summary: Frontend Smart Crop UI

## What was built
- **SmartCropWindow.tsx** — Root component: file picker, SSE progress consumer, GPU badge, Before/After preview, xử lý export flow
- **SmartCropLayout.tsx** — Dual panel layout: 16:9 (Before) + 9:16 (After) với video elements
- **SmartCropControls.tsx** — Toolbar: Alpha slider, Dead Zone, Detect Every, Fallback Center toggle, Export + Open Editor buttons
- **smart-crop.css** — Full CSS theo design-system.css tokens, dark mode support, animations, progress bar, dropzone
- **Launcher integration** — Thêm "Smart Crop" tool card (icon Scissors) vào HomeLauncher tools grid
- **Routing** — Thêm `smart-crop` case vào main.tsx tool routing
- **Window config** — Đăng ký `smart-crop` window (1200x800) vào windowManager.ts

## Key files
- `src/components/SmartCrop/SmartCropWindow.tsx`
- `src/components/SmartCrop/SmartCropLayout.tsx`
- `src/components/SmartCrop/SmartCropControls.tsx`
- `src/styles/smart-crop.css`
- `src/main.tsx`
- `src/components/setup/HomeLauncher.tsx`
- `src/utils/windowManager.ts`

## Self-Check: PASSED
- [x] Dual preview panels (16:9 + 9:16) render correctly
- [x] Controls slider reactive
- [x] Tool card in launcher with icon
- [x] Window opens from launcher
