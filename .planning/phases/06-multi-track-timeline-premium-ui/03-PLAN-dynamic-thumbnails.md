---
wave: 2
depends_on: [01-PLAN-timeline-scaffold]
files_modified:
  - python-sidecar/app/routes/pipeline.py
  - src/components/editor/VideoTrack.tsx
autonomous: true
gap_closure: false
requirements: [M2-13]
---

# 03-PLAN: Dynamic Video Thumbnails

<objective>
Implement dynamic thumbnail fetching via FFmpeg backend, optimizing disk/VRAM and tracking zoom width appropriately. Use a Semaphore limiter to prevent CPU bombs as determined in RESEARCH.
</objective>

<tasks>
<task>
<action>
1. **Backend** `python-sidecar/app/routes/pipeline.py`:
   - Add a new endpoint `GET /api/thumbnail?time={time}&project_dir={dir}`.
   - Implement `asyncio.Semaphore(2)` to queue incoming concurrent thumbnail requests instead of overwhelming CPU.
   - Use `ffmpeg` to extract a single frame (`-vframes 1`) to a cache path. Return `FileResponse`.
2. **Frontend** `src/components/editor/VideoTrack.tsx`:
   - Calculate total blocks needed based on `videoDuration` and a fixed block time (e.g. 1 block = 10s of video).
   - Use `IntersectionObserver` or simple bounded logic so only blocks currently visible in the timeline viewport trigger a `fetch` / `convertFileSrc` to the backend.
   - Once fetched, cache URL locally to prevent re-fetching when scrolling left/right.
   - Keep a 10px transparent top padding inside the `VideoTrack` block for overlaying the dynamic video name (`name.mp4`).
</action>
<read_first>
- python-sidecar/app/routes/pipeline.py
- .planning/phases/06-multi-track-timeline-premium-ui/06-RESEARCH.md
</read_first>
<acceptance_criteria>
- Video track populates with dynamic un-stretched thumbnails matching the zoom level.
- CPU does not spike past 100% when zooming wildly.
</acceptance_criteria>
</task>
</tasks>
