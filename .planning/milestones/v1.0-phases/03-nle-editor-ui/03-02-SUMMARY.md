# Plan 03-02: Properties Panel, Media Bin & Controls (Wave 2)

## What was expected
- Systematize controls: Toggle, Select, Slider, ChipGroup, Number inputs (Cockpit style).
- Build the 4-tab Properties Panel (STYLE, TTS, SUB, OUT) mimicking HTML perfectly.
- Replace `UploadPanel` with the `MediaBin` HTML structural model.

## What was built
- ✅ Crafted `ToggleControl`, `SelectControl`, `SliderControl`, `ChipGroup`, `NumberControl`, `ColorPickerControl`.
- ✅ Demolished old Properties Panel to reconstruct the exact `.pp` / `.ptabs` / `.pbody` logic.
- ✅ Overhauled `UploadPanel.tsx` to render the exact `.mbin` layout with thumbnails, badges (`.mthumb-badge`), and dropzone.

## File Architecture Changes
```json
{
  "key-files": {
    "created": [
      "src/components/controls/ToggleControl.tsx",
      "src/components/controls/SelectControl.tsx",
      "src/components/controls/SliderControl.tsx",
      "src/components/controls/ChipGroup.tsx",
      "src/components/controls/NumberControl.tsx",
      "src/components/controls/ColorPickerControl.tsx"
    ],
    "modified": [
      "src/components/properties/PropertiesPanel.tsx",
      "src/components/properties/StyleTab.tsx",
      "src/components/properties/TTSTab.tsx",
      "src/components/properties/SubTab.tsx",
      "src/components/properties/OutTab.tsx",
      "src/components/editor/UploadPanel.tsx"
    ],
    "deleted": []
  }
}
```

## Decisions & Workarounds
- Re-used `UploadPanel` as the `.mbin` structural layout component rather than creating a new file, to maintain existing wiring in `App.tsx`.
- Implemented static UI states first. Dynamic bindings will be tackled in Wave 4.

## Next Up
- Wave 3: **Video Preview & Canvas Subtitle Overlay** (Solving the WebView2 positioning bug once and for all).

## Self-Check: PASSED
