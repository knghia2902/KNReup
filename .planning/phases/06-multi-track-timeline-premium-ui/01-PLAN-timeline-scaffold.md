---
wave: 1
depends_on: []
files_modified:
  - src/components/editor/Timeline.tsx
  - src/stores/useProjectStore.ts
autonomous: true
gap_closure: false
requirements: [M2-11]
---

# 01-PLAN: Timeline Scaffold & Performance Playhead

<objective>
Build the core Timeline foundation with a 60FPS-safe playhead using bypassed React state, zoom controls, and structural layout for the 4 tracks (Video, Audio, Sub, BGM).
</objective>

<tasks>
<task>
<action>
1. Update `useProjectStore.ts`: Add `timelineZoom` (default 1, max 10), `timelineScrollX` (default 0). (Avoid placing `currentTime` updating 60FPS here; use transient updates or direct DOM manipulation instead).
2. Create/Update `src/components/editor/Timeline.tsx`:
   - Setup a flex/grid container for 4 fixed-height tracks: `VIDEO` (30px), `AUDIO` (30px), `SUB` (30px), `BGM` (30px). Total height 120px limit as per Roadmap.
   - Implement `playheadRef`—a vertical red line absolute positioned over the tracks.
   - Attach `onTimeUpdate` to the main `<video>` player in `VideoPreview.tsx` to directly modify `playheadRef.current.style.transform = \`translateX(...)\`` across a React Context or an Event Bus to prevent global re-renders.
   - Add Zoom In/Out slider or bind `Ctrl + Scroll` to adjust `timelineZoom`.
</action>
<read_first>
- src/components/editor/Timeline.tsx
- src/stores/useProjectStore.ts
- .planning/phases/06-multi-track-timeline-premium-ui/06-RESEARCH.md
</read_first>
<acceptance_criteria>
- 4 labeled tracks visible in Timeline panel.
- Playhead scrubs smoothly without stutter and without triggering unnecessary React renders.
</acceptance_criteria>
</task>
</tasks>
