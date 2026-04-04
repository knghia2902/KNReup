---
wave: 2
depends_on: [01-PLAN-timeline-scaffold]
files_modified:
  - src/components/editor/SubtitleTrack.tsx
  - src/stores/useProjectStore.ts
autonomous: true
gap_closure: false
requirements: [M2-11]
---

# 04-PLAN: Subtitle Track Interaction (Split/Merge/Trim)

<objective>
Implement specific interactive controls for the SUB track matching 06-CONTEXT rules: Normal Trim edge-dragging, Proportional Split (Shortcut C), and Enter-Merge.
</objective>

<tasks>
<task>
<action>
1. Update `useProjectStore`:
   - Create functions: `splitSubtitle(index, timeRatio)`, `mergeSubtitle(index1, index2)`, and `trimSubtitle(index, newStart, newEnd)`.
2. Create `src/components/editor/SubtitleTrack.tsx`:
   - Bind `react-rnd` or simple `useRef/onPointerDown` handles to the left/right edges of each subtitle segment.
   - Enforce Minimum limit (e.g. `width >= 5px` or `0.5s`) for trim actions (No blocks disappearing into 0s).
   - "Normal Trim": Ensure modifying `start/end` times of a segment doesn't shift the array of elements around it.
3. Keyboard Events `Timeline.tsx` or global store:
   - Listen for `keydown` (key `C`). If a block is active/selected and C is pressed, fire `splitSubtitle`.
   - `splitSubtitle` logic: Calculate text length. Slice text string in half based on the ratio of the split point.
   - Listen for Merge Context Menu / shortcut. Combine text with `\n` line break.
</action>
<read_first>
- src/stores/useProjectStore.ts
- .planning/phases/06-multi-track-timeline-premium-ui/06-CONTEXT.md
</read_first>
<acceptance_criteria>
- User can edge-drag subtitle segments.
- Segments do not collapse into 0 duration.
- Pressing 'C' splits the highlighted segment and text accurately.
</acceptance_criteria>
</task>
</tasks>
