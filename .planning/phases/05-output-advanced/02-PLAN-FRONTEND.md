---
phase: 05
wave: 1
depends_on: ["01-PLAN-BACKEND.md"]
files_modified:
  - src/store/pipelineStore.ts
  - src/components/Editor/PropertiesPanel/OutputTab.tsx
  - src/components/Editor/Preview/VideoPreview.tsx
autonomous: false
---

# Phase 05: Frontend — Output Advanced UI

<objective>
Update the NLE React UI to expose controls for Watermark, Blur, Crop, and BGM configuration, and bind them to the Zustand store. The video preview should show approximations of these effects (like drawing a blur box or cropping the video frame).
</objective>

<requirements>
- M2-07
- M2-08
- M2-09
- M2-10
</requirements>

<must_haves>
- Zustand store state `outputConfig` contains `blur`, `watermark`, `crop`, `bgm`
- OUT tab has inputs/sliders to configure these settings
- Preview displays a dashed box for blur positioning
</must_haves>

## Tasks

<task>
<id>05-02-01</id>
<title>Update Zustand outputConfig Store</title>
<read_first>
- src/store/pipelineStore.ts
</read_first>
<action>
Update the interface `OutputConfig` or `PipelineConfig` in `src/store/pipelineStore.ts` to match the backend fields:
- `watermark_enabled`, `watermark_text`, `watermark_x`, `watermark_y`, `watermark_opacity`
- `blur_enabled`, `blur_x`, `blur_y`, `blur_w`, `blur_h`
- `crop_enabled`
- `bgm_enabled`, `bgm_file`, `bgm_volume`, `ducking_strength`
Create an action `setOutputConfig(partialConfig)` if it doesn't already exist.
</action>
<acceptance_criteria>
- `pipelineStore.ts` exports an interface containing `blur_enabled`, `watermark_enabled`, `crop_enabled`, `bgm_enabled`
- State update function is present
</acceptance_criteria>
</task>

<task>
<id>05-02-02</id>
<title>Build OutputTab UI Controls</title>
<read_first>
- src/components/Editor/PropertiesPanel/OutputTab.tsx
</read_first>
<action>
Modify `OutputTab.tsx` to include expandable sections (using `details/summary` or glassmorphism panels) for:
1. **Watermark**: Toggle switch + Text input + Sliders for X, Y, Opacity.
2. **Effects**: Toggle switch for "Enable Blur" + Number inputs for X/Y/W/H.
3. **Crop**: Toggle switch for "Enable 9:16 Smart Crop".
4. **BGM & Ducking**: Toggle switch + File picker input (saves absolute path to `bgm_file`) + Sliders for Volume and Ducking Strength.
Bind all inputs to `pipelineStore`'s `setOutputConfig`.
</action>
<acceptance_criteria>
- `OutputTab.tsx` renders toggles and inputs for Watermark, Blur, Crop, and BGM
- Changing an input correctly updates the Zustand store state via React DevTools/Console
</acceptance_criteria>
</task>

<task>
<id>05-02-03</id>
<title>Render Blur Box in VideoPreview</title>
<read_first>
- src/components/Editor/Preview/VideoPreview.tsx
</read_first>
<action>
Modify `VideoPreview.tsx` to read `pipelineStore`.
If `blur_enabled` is true, render an absolutely positioned `div` over the video element with `border: 2px dashed red` and `backdrop-filter: blur(10px)` (or semi-transparent gray) to simulate the blur box.
The `left/top/width/height` of the `div` should be mapped from video dimensions to the current canvas dimensions:
For now, standard CSS percentages or calculated pixels relative to `videoWidth` and `videoHeight` (if needed, use a ResizeObserver or existing preview scaling math).
</action>
<acceptance_criteria>
- A dashed box appears on the preview when `blur_enabled` is true in the OUT tab
- Box correctly reflects `blur_x`, `blur_y`, `blur_w`, `blur_h` visually
</acceptance_criteria>
</task>
