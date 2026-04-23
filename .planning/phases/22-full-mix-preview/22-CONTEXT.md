# Phase 22: Full Mix Preview - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time audio mix preview trong Editor — mixing 3 nguồn âm thanh (Original Video Audio, TTS Segments, BGM) với live volume controls, cho phép user nghe kết quả mix trực tiếp mà không cần render.

</domain>

<decisions>
## Implementation Decisions

### Audio Engine Architecture
- **D-01:** Sử dụng **Web Audio API** (`AudioContext` + `GainNode` + `MediaElementSource`) — không dùng `HTMLMediaElement.volume`.
- **D-02:** 1 `AudioContext` singleton quản lý toàn bộ audio routing graph.
- **D-03:** 3 `GainNode` riêng biệt cho 3 nguồn: Original Audio, TTS, BGM.
- **D-04:** Kiến trúc giống CapCut: per-track gain nodes connected to destination.

### TTS Segment Playback
- **D-05:** **On-the-fly scheduling** — Preload tất cả TTS segment files vào `AudioBuffer` (in-memory), dùng `AudioBufferSourceNode.start(time)` để schedule phát theo timestamp.
- **D-06:** Không merge segments thành 1 file — giữ nguyên per-segment, giống CapCut.
- **D-07:** Khi subtitle thay đổi hoặc TTS regenerate → chỉ cần reload buffer của segment đó, không cần re-merge.

### Volume Control UX
- **D-08:** **Cả hai**: AudioTab chi tiết (3 sliders: Original/TTS/BGM) + Mini volume indicator trên mỗi track header trong timeline.
- **D-09:** AudioTab là primary control (sliders đầy đủ). Timeline mini mixer là quick-access indicator.

### Seek & Scrub Sync
- **D-10:** **Hybrid approach** (giống CapCut): Scrub nhanh (kéo liên tục) → audio im lặng. Click seek + Play → recalculate segments và phát audio mix đồng bộ ngay.
- **D-11:** Dùng `AudioContext.currentTime` đồng bộ với `<video>.currentTime` khi play.

### Agent's Discretion
- AudioContext lifecycle management (resume/suspend khi tab ẩn/hiện)
- Buffer memory management strategy cho nhiều segments
- Latency optimization (<40ms target)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audio System
- `src/components/properties/AudioTab.tsx` — Current TTS engine + voice + modulation controls
- `src/components/editor/AudioLibrary.tsx` — BGM library + volume slider + `<audio>` playback
- `src/components/editor/VideoPreview.tsx` — Video `<video>` element (source of original audio)
- `src/stores/useProjectStore.ts` — `original_volume`, `volume`, `audio_volume`, `audio_mix_mode` state

### Timeline
- `src/components/editor/Timeline.tsx` — Track headers where mini mixer would go
- `src/components/editor/AudioTrack.tsx` — Existing audio track component

### Subtitle/TTS
- `src/stores/useSubtitleStore.ts` — `tts_audio_path` per segment

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useProjectStore`: Already has `original_volume`, `volume` (master TTS), `audio_volume` (BGM), `audio_mix_mode` — can be wired directly to `GainNode.gain.value`
- `AudioLibrary.tsx`: Has `<audio>` element + volume slider — pattern to follow for mixer UI
- `SliderControl` component: Reusable for volume faders
- `getMediaSrc()` utility: Converts local paths to asset URLs for Tauri

### Established Patterns
- Volume state lives in `useProjectStore` (Zustand) — consistent with existing approach
- Properties panel uses section groups (`ps`, `pshd`, `pr` CSS classes)
- Timeline track headers use fixed-width left column

### Integration Points
- `VideoPreview.tsx` → Route `<video>` element through `AudioContext.createMediaElementSource()`
- `AudioLibrary.tsx` → Route BGM `<audio>` through `AudioContext.createMediaElementSource()`
- `useSubtitleStore.segments[].tts_audio_path` → Source for TTS `AudioBuffer` preloading
- `Timeline.tsx` track headers → Add mini volume indicators

</code_context>

<specifics>
## Specific Ideas

- Tham khảo kiến trúc CapCut: per-track `GainNode`, `AudioBufferSourceNode` scheduling, hybrid seek/scrub
- User muốn nghe được TTS volume vs Original volume trực tiếp mà không cần render
- Mini mixer trên timeline header nên gọn nhẹ — chỉ icon + progress bar, không chiếm quá nhiều space

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-full-mix-preview*
*Context gathered: 2026-04-24*
