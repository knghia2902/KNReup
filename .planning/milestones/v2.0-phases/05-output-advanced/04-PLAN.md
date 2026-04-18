---
wave: 1
depends_on: []
files_modified:
  - python-sidecar/app/engines/output.py
  - src/components/editor/VideoPreview.tsx
  - src/components/properties/OutTab.tsx
autonomous: false
gap_closure: true
requirements: []
---

# 04-PLAN: Fix UAT Gaps (Audio, Blur, Crop, Preview)

<objective>
Close the 5 UAT gaps regarding Audio Mix (preview, low volume, temp files), Blur edge smudging, Crop coordinates misalignment, and Video Preview overlay accuracy.
</objective>

<tasks>
<task>
<action>
Modify `python-sidecar/app/engines/output.py`:
1. In `generate_ass_file`, the `ass_path` should be deleted after FFmpeg finishes. Add a try/finally block in the `build()` method to read `self._ass_file` and call `os.remove` to clean it up.
2. In `build()`, append `normalize=0` to the `amix` audio filter (e.g., `amix=inputs={len}:duration=first:normalize=0[aout]`) to prevent the original audio and dubbed audio volumes from dropping.
3. Change the Blur filter from `delogo` to a `crop` + `boxblur` + `overlay` pipeline to prevent edge smudging ("lem").
   Instead of `delogo=x={bx}:y={by}:w={bw}:h={bh}[vblur{i}]`
   Use: `split=2[bm{i}][bb{i}];[bb{i}]crop={bw}:{bh}:{bx}:{by},boxblur=20:5[bp{i}];[bm{i}][bp{i}]overlay={bx}:{by}[vblur{i}]`
4. Reorder the complex filter logic: Apply the `Blur` and `Watermark` blocks BEFORE the `Crop 9:16` block. This ensures that coordinates provided by the frontend (which are based on the original 16:9 frame) match correctly without misalignment.
</action>
<read_first>
- python-sidecar/app/engines/output.py
</read_first>
<acceptance_criteria>
- `amix` string contains `normalize=0`
- `boxblur` replaces `delogo`
- Crop filter logic comes chronologically after Blur and Watermark in `build()`.
- `os.remove(self._ass_file)` is called (with checking if exists) before returning from `build()`.
</acceptance_criteria>
</task>

<task>
<action>
Modify `src/components/editor/VideoPreview.tsx`:
1. Render a dummy Subtitle overlay block (using the current subConfig settings) constantly visible whenever `projectConfig.watermark_enabled` or `blur_enabled` is true. Include a placeholder like "Subtitles will appear here" so the user has a visual reference to prevent overlap with logo/blur.
2. Fix the VideoRatio 9:16 math for overlays:
   - Calculate scaled `left`, `top`, `width`, `height` for Blur and Watermark div overlays. 
   - If `videoRatio === '9:16'`, the video visually uses `objectFit: 'contain'` but acts letterboxed in the frontend. We must adjust the X/Y math. Instead of naive `(x / w) * 100%`, we must calculate the actual dimensions of the video on screen (ignoring the black bars), and offset the overlays by the size of the black bars.
   - Example math: The `vinner` container has certain bounds. You need to calculate the actual letterboxed video width/height and add `marginLeft` / `marginTop`.
</action>
<read_first>
- src/components/editor/VideoPreview.tsx
</read_first>
<acceptance_criteria>
- A dummy subtitle box renders if watermark or blur is active.
- The `left` and `top` inline styles of the blur/watermark overlays incorporate actual letterbox bound calculations when deriving pixel offsets.
</acceptance_criteria>
</task>

<task>
<action>
Modify `src/components/properties/OutTab.tsx`:
1. In the "BGM Music" section, add an `<audio controls src={...} />` element right below the file selector so the user can preview the track.
2. Import `convertFileSrc` from `@tauri-apps/api/core` and use it to safely obtain a playable `asset://` URL for the `projectConfig.bgm_file`.
</action>
<read_first>
- src/components/properties/OutTab.tsx
</read_first>
<acceptance_criteria>
- `<audio>` element is rendered when `bgm_file` exists, utilizing `convertFileSrc`.
</acceptance_criteria>
</task>
</tasks>
