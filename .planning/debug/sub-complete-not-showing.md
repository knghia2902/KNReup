---
slug: sub-complete-not-showing
status: investigating
trigger: "Analyze button shows 'Complete' but no subtitles appear on the timeline. No console errors reported."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: Subtitles Complete but Not Showing

## Symptoms
- User clicks Analyze.
- The process finishes and button says "Complete".
- No subtitle segments appear on the timeline track.
- No error messages in the browser console.
- Regression: Happened after previous fixes for memory/long-paths.

## Current Focus
- **Hypothesis:** 
    1. The analyze task might be returning an empty result or a successful status without the actual data path.
    2. The frontend might not be correctly polling or receiving the final JSON/SRT payload.
    3. The sidecar might be saving the output file in a location that the frontend cannot find or access due to recent path-handling changes.
    4. `useSubtitleStore` might not be getting updated with the new segments.
- **Next Action:** 
    1. Trace the `analyze` command response in `usePipeline.ts`.
    2. Check the sidecar `pipeline_runner.py` to see where it saves the output and what it returns.
    3. Verify if the `SubtitleStore` receives any data after completion.

## Evidence
- 2026-04-22: User reported success status but zero visibility on timeline.

## Resolution
- **root_cause:** TBD
- **fix:** TBD
