---
wave: 1
depends_on: []
files_modified: ["src/App.tsx", "src/components/editor/Timeline.tsx", "src/components/editor/SubtitleTrack.tsx", "src/styles/design-system.css"]
autonomous: true
---

# Gap Closure Plan: UAT Phase 6

<objective>
Fix the 6 issues identified in UAT for Phase 6 (Playhead smoothness, Drag-Drop Tauri API, Zoom Minimum Limit, Subtitle Trim Bounds, Playhead Dragging, and Settings Save command).
</objective>

<task>
<read_first>
- src/App.tsx
</read_first>
<action>
1. Import `listen` from `@tauri-apps/api/event` and `writeTextFile` from `@tauri-apps/plugin-fs`.
2. Add a global `useEffect` calling `listen('tauri://file-drop', ...)` to trigger `handleFileSelected(event.payload.paths[0])`.
3. Add a global window `keydown` listener for `Ctrl+S` (or `Cmd+S`). On execution, call Tauri's dialog `save({ filters: [{ name: 'Project', extensions: ['kn']}] })`.
4. If a save path is selected, serialize `useProjectStore` state + `useSubtitleStore` segments to a JSON string and use Tauri `writeTextFile` to save the `.kn` project state to disk. Show success message (or just print to console).
</action>
<acceptance_criteria>
`src/App.tsx` contains `listen('tauri://file-drop'`
`src/App.tsx` contains command logic for `Ctrl+s` resolving to `.kn`
`src/App.tsx` contains `writeTextFile` logic
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/editor/Timeline.tsx
- src/components/editor/SubtitleTrack.tsx
</read_first>
<action>
1. In `Timeline.tsx`, change `Math.max(1, timelineZoom - 0.5)` to `Math.max(0.1, timelineZoom - 0.5)` for zoomOut function.
2. In `Timeline.tsx`, implement `requestAnimationFrame` loop to continuously check `document.querySelector('video')?.currentTime`. If it changed, recalculate `xPos` and apply it to `playheadRef.current.style.transform`. Stop relying strictly on the laggy `video.onTimeUpdate` event for smooth 60fps playhead tracing.
3. Make the red playhead line `<div className="playhead">` draggable: Add `onPointerDown`/`onPointerMove` globally so the user can drag the red line across the timeline. When dragged, recalculate percentage and update `video.currentTime` explicitly.
4. Set a global fallback for `<div className="playhead">`'s exact time location.
5. In `SubtitleTrack.tsx`, when handling Split by `C` shortcut, use `document.querySelector('video')?.currentTime` correctly since it will now perfectly match the Playhead value (as dragging the playhead seeks the video).
</action>
<acceptance_criteria>
`Timeline.tsx` contains `requestAnimationFrame`
`Timeline.tsx` contains pointer events binding for dragging the `playheadRef`
`Timeline.tsx` contains `Math.max(0.1, timelineZoom - 0.5)`
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/editor/SubtitleTrack.tsx
- src/styles/design-system.css
</read_first>
<action>
1. Define `--ac-hover: #e06c42;` under `:root` in `src/styles/design-system.css`. Also define `--ac-hover` in `body.dark` with an adjusted color `#e48e6c`.
2. In `SubtitleTrack.tsx`, update the `handlePointerMove` inside the `SubtitleBlock` component. To prevent overlapping, look up `segments` array (available via store or passing as prop). Wait, the block only takes `segment`. Pass `segments` to it or get from store. Calculate:
`minAllowableStart` = `prevSegment ? prevSegment.end : 0`
`maxAllowableEnd` = `nextSegment ? nextSegment.start : videoDuration (or Infinity)`.
Use these variables to limit `newStart` and `newEnd` when user triggers `isDraggingLeft`, `isDraggingRight`, or `isDraggingCenter`. (Center drag needs to slide without going out of bounds of the neighbors).
</action>
<acceptance_criteria>
`src/styles/design-system.css` contains `--ac-hover`
`SubtitleTrack.tsx` contains clamping logic restricting start/end with adjacent neighbors.
</acceptance_criteria>
</task>
