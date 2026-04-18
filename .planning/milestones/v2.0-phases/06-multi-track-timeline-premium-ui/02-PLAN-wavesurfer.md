---
wave: 1
depends_on: [01-PLAN-timeline-scaffold]
files_modified:
  - src/components/editor/AudioTrack.tsx
  - package.json
autonomous: true
gap_closure: false
requirements: [M2-12]
---

# 02-PLAN: Wavesurfer Context Integration

<objective>
Integrate `wavesurfer.js` v7 to visualize the Audio and BGM tracks. Render waveform strictly once from original media to avoid re-render loops on volume adjustments.
</objective>

<tasks>
<task>
<action>
1. Run `npm install wavesurfer.js`.
2. Create `src/components/editor/AudioTrack.tsx`.
3. Inside `AudioTrack`, initialize `WaveSurfer.create()` targeting a `useRef` container.
   - Set `height: 30`, `waveColor: '#4f4f4f'`, `progressColor: '#007acc'`, `interact: true`.
   - Apply strict-mode safeguard checks (`if (!wavesurfer.current)`) as discovered in `06-RESEARCH.md`.
4. Ensure the wavesurfer instance `load()`s the source audio (`config.audio_file` or `config.bgm_file`) exactly once. Volume changes (Ducking) should NOT trigger re-rendering of the wave.
5. Sync Wavesurfer's internal playhead with the main `VideoPreview` player. When `VideoPreview` plays, Wavesurfer tracks along.
</action>
<read_first>
- src/components/editor/Timeline.tsx
- .planning/phases/06-multi-track-timeline-premium-ui/06-CONTEXT.md
</read_first>
<acceptance_criteria>
- User sees static audio waveform reflecting the media.
- Strict mode does not result in double overlapping wave drawings.
</acceptance_criteria>
</task>
</tasks>
