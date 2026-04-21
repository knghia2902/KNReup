---
status: investigating
trigger: "Tauri dev crash with exit code 0xe0000008"
created: 2026-04-20
updated: 2026-04-20
---

# Symptoms
- **Expected**: App opens and displays the interface.
- **Actual**: Window appears briefly then disappears.
- **Terminal Error**: `error: process didn't exit successfully: target\debug\knreup-app.exe (exit code: 0xe0000008)`
- **Context**: Occurs even without a specific video file being opened. Started after adding Timeline interactions and the Ruler component.

# Evidence
- [x] Timeline.tsx contains a `TimelineRuler` component that uses a `for` loop to generate ticks.
- [x] Zoom limits were lowered to 0.01x.
- [x] Identified 60fps re-render loop of the entire Timeline component as major OOM risk.

# Hypotheses
- **Hypothesis 1**: Unhandled exception or OOM due to 60fps re-rendering of entire timeline tracks and ruler. (Validated & Fixed)
- **Hypothesis 2**: `TimelineRuler` is still too heavy even with 2000 ticks during initialization. (Mitigated by Memoization)
- **Hypothesis 3**: Drag/Drop syntax error. (Checked, looks OK)

# Current Focus
- **Fix Applied**: Memoized `TimelineRuler`, decoupled playhead/timestamp updates from React state, used refs for direct DOM updates.
- **Next Action**: User verification.
