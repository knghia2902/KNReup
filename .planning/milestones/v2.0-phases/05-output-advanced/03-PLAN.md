---
wave: 1
depends_on: []
files_modified:
  - src/components/properties/OutTab.tsx
  - src/components/properties/StyleTab.tsx
autonomous: true
---

# 03-PLAN-UAT-FIXES

## Objective
Fix user interaction issues and layout misplacement for Output Advanced features (BGM, Watermark, Blur, Crop). The UAT expected all these features in `OutTab.tsx` (tab "OUT"), but 3 of them were incorrectly placed in `StyleTab.tsx`, and BGM's ToggleControl was unclickable.

## Tasks

<task>
<read_first>
- src/components/properties/OutTab.tsx
- src/components/properties/StyleTab.tsx
- .planning/phases/05-output-advanced/05-UAT.md
</read_first>
<action>
1. Remove "Video ratio" (Crop), "Blur regions", and "Logo & watermark" sections entirely from `src/components/properties/StyleTab.tsx`.
2. Insert these three sections into `src/components/properties/OutTab.tsx`, just below the Format section or wherever fits best logically (e.g. above Audio Mix).
3. Ensure the CSS of the moved elements works correctly inside `OutTab.tsx`.
</action>
<acceptance_criteria>
- `cat src/components/properties/StyleTab.tsx` does NOT contain `config.blur_enabled` or `config.video_ratio` or `config.watermark_enabled`.
- `cat src/components/properties/OutTab.tsx` CONTAINS `config.blur_enabled`, `config.video_ratio`, and `config.watermark_enabled`.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/properties/OutTab.tsx
- src/components/controls/ToggleControl.tsx
- src/index.css
</read_first>
<action>
1. Fix the "BGM Ducking" unclickable issue in `OutTab.tsx`: The `ToggleControl` for "Enable custom BGM" and its child sliders may be blocked by CSS. Add `style={{ pointerEvents: 'auto', userSelect: 'auto', position: 'relative', zIndex: 10 }}` to the container div to ensure it's on top and clickable.
2. Fix the Watermark text input unselectable issue in `OutTab.tsx` (previously in StyleTab): Add `userSelect: 'text'` and `pointerEvents: 'auto'` to the input style `style={{ width: '100%', boxSizing: 'border-box', background: 'var(--c-bg2)', border: '1px solid var(--c-bg3)', color: 'white', padding: '4px 8px', borderRadius: '4px', userSelect: 'text', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}`.
</action>
<acceptance_criteria>
- `grep "pointerEvents: 'auto', userSelect: 'auto'" src/components/properties/OutTab.tsx` returns a match or verifies the inline styles are applied correctly to the unclickable areas.
- `grep "userSelect: 'text'" src/components/properties/OutTab.tsx` returns a match for the watermark input.
</acceptance_criteria>
</task>

## Verification
- Run `npm run tauri dev` and click on OutTab.
- Verify that Video Ratio, Blur, and Watermark panels are present in OutTab.
- Verify that "Enable custom BGM" can be toggled.
- Verify that Watermark text input allows typing characters.
- Verify that Blur sliders can be adjusted.
