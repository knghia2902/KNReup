# Plan 03-03: Video Preview & Subtitle Canvas Overlay (Wave 3)

## What was expected
- Eliminate absolute positioning bugs in Tauri Webview2 for HTML5 `<video>` and Canvas.
- Translate `VideoPreview.tsx` and `VideoControls.tsx` to match HTML mockups (`.vframe`, `.vinner`, `.cb.play`).
- Maintain Canvas subtitle overlay drawing sync with `requestAnimationFrame`.

## What was built
- ✅ Re-implemented Video Layering using `display: grid; place-items: center` with `grid-area: 1 / 1` injected into `.vinner`.
- ✅ Deleted outdated `VideoPreview.css` in favor of Global `design-system.css`.
- ✅ Replaced Video Controls layout with the hyper-minimalist Cockpit design pattern.

## File Architecture Changes
```json
{
  "key-files": {
    "created": [],
    "modified": [
      "src/components/editor/VideoPreview.tsx",
      "src/components/editor/VideoControls.tsx"
    ],
    "deleted": [
      "src/components/editor/VideoPreview.css"
    ]
  }
}
```

## Decisions & Workarounds
- Replaced `ResizeObserver` math calculation with native CSS Grid container scaling for Canvas. `canvas.width` and `canvas.height` simply follow `videoDimensions` mapped to `video.videoWidth`. The browser engine perfectly scales the overlapping `1 / 1` grid cells containing `<video>` and `<canvas>`.
- Scrub bar calculates position statically via `e.clientX - rect.left` over total duration, dropping complex library dependencies.

## Next Up
- Wave 4: **State Management & Pipeline Integration**. Binding Zustand stores and ensuring interactions match mock API behavior.

## Self-Check: PASSED
