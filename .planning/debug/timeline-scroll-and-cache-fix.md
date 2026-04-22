---
status: investigating
trigger: "Timeline.tsx:473 Unable to preventDefault inside passive event listener invocation. Reset video cache on delete. Set default ruler interval to 5s on import."
created: 2026-04-22
updated: 2026-04-22
symptoms:
  expected: "Smooth scrolling without console errors; video re-added as completely new; timeline ruler defaults to 5s intervals on import."
  actual: "Error on wheel scroll; old video segments persist after re-adding; ruler interval is not 5s by default."
  error_messages: "Unable to preventDefault inside passive event listener invocation at Timeline.tsx:473"
  reproduction: "1. Scroll wheel on timeline. 2. Delete video from media and re-add. 3. Import new video and check ruler labels."
---

# Current Focus
hypothesis: "The wheel event listener in Timeline.tsx is registered as passive by default in some browsers, preventing preventDefault. Video state persistence is likely due to stale data in useSubtitleStore or useProjectStore not being cleared on deletion."
next_action: "Examine Timeline.tsx wheel listener and media deletion logic in Project Media/Store components."
reasoning_checkpoint: ""
tdd_checkpoint: ""

# Evidence
- timestamp: 2026-04-22
  observation: "User reported error at Timeline.tsx:473 during wheel scroll."

# Eliminated
(none)

# Resolution
root_cause: ""
fix: ""
verification: ""
files_changed: []
