# Phase 22: Full Mix Preview — Research

## RESEARCH COMPLETE

**Researched:** 2026-04-24
**Phase:** Full Mix Preview — Real-time audio mixing cho 3 nguồn (Original, TTS, BGM)

---

## 1. Hiện Trạng Hệ Thống Audio

### 1.1. Video (Original Audio)
- **File:** `src/components/editor/VideoPreview.tsx`
- Dùng `<video>` element gốc, **không có Web Audio API routing**
- Volume chưa được apply runtime — `original_volume` chỉ lưu trong store, chưa gắn vào `<video>.volume`
- `<video>` element truy cập qua `videoRef` local — không export ra ngoài

### 1.2. BGM Audio
- **File:** `src/components/editor/AudioLibrary.tsx`
- Dùng `<audio ref={audioRef}>` element với `controls` attribute
- Volume áp dụng trực tiếp qua `audioRef.current.volume = config.audio_volume` (HTMLMediaElement API)
- URL nguồn: online CDN URLs hoặc local file paths (convert qua `getMediaSrc()`)

### 1.3. TTS Segments
- **File:** `src/stores/useSubtitleStore.ts` (line 11: `tts_audio_path?: string`)
- Mỗi segment có `tts_audio_path` — đường dẫn local file `.wav`/`.mp3`
- **Chưa có playback system** — TTS chỉ generate file, chưa play lại trong timeline
- Preview voice test trong AudioTab dùng `new Audio(blobUrl).play()` (one-shot, không routing)

### 1.4. Volume State (useProjectStore)
| Field | Default | Mục đích |
|-------|---------|----------|
| `original_volume` | 0.1 | Volume audio gốc từ video |
| `volume` | (TTS master) | Master volume cho TTS |
| `audio_volume` | 0.5 | Volume BGM |
| `audio_mix_mode` | 'mix' | 'mix' hoặc 'replace' |
| `ducking_strength` | 0.2 | Giảm BGM khi có TTS |

---

## 2. Web Audio API Architecture

### 2.1. Routing Graph Đề Xuất

```
┌─────────────────┐
│  <video> element │──→ createMediaElementSource() ──→ GainNode (originalGain) ──┐
└─────────────────┘                                                               │
                                                                                  │
┌──────────────────┐                                                              │
│  TTS Segments    │──→ AudioBufferSourceNode.start(t) ──→ GainNode (ttsGain)────┼──→ AudioContext.destination
│  (AudioBuffer[]) │     (scheduled per segment)                                  │
└──────────────────┘                                                              │
                                                                                  │
┌──────────────────┐                                                              │
│  <audio> BGM     │──→ createMediaElementSource() ──→ GainNode (bgmGain) ───────┘
└──────────────────┘
```

### 2.2. Key Constraints

1. **`createMediaElementSource()` chỉ gọi 1 lần per element** — Nếu gọi lại sẽ throw error. Cần wrap trong singleton.
2. **`AudioContext` phải resume sau user gesture** — Browser policy chặn autoplay. Cần gọi `ctx.resume()` trên click/play.
3. **Cross-origin audio** — BGM từ CDN cần `crossorigin="anonymous"` attribute trên `<audio>` element, nếu không `createMediaElementSource()` sẽ fail.
4. **`MediaElementSourceNode` mutex** — Mỗi `HTMLMediaElement` chỉ connect được tới 1 `AudioContext`. Không thể share element giữa 2 contexts.
5. **Memory management** — Preload tất cả TTS segments vào `AudioBuffer` có thể tốn RAM. 100 segments × 10s × 44.1kHz × 2ch × Float32 = ~353MB. Cần lazy loading hoặc LRU cache.

### 2.3. TTS Segment Scheduling

```typescript
// Pseudo-code cho segment scheduling
function playTTSFromTime(startTime: number) {
  const ctx = audioContext;
  const now = ctx.currentTime;
  
  segments.forEach(seg => {
    if (!seg.tts_audio_path || seg.end < startTime) return;
    const buffer = bufferCache.get(seg.tts_audio_path);
    if (!buffer) return;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ttsGainNode);
    
    const segDelay = seg.start - startTime;
    if (segDelay > 0) {
      source.start(now + segDelay);
    } else {
      // Segment đã bắt đầu, play từ offset
      const offset = startTime - seg.start;
      source.start(now, offset);
    }
    activeSourceNodes.push(source); // Track để cancel khi seek
  });
}
```

### 2.4. Seek/Scrub Behavior (CapCut-style)

- **Scrub (kéo nhanh):** Cancel tất cả `AudioBufferSourceNode`, im lặng
- **Click seek:** Cancel + re-schedule từ vị trí mới
- **Play from position:** Schedule tất cả segments sau current time, sync với `<video>.currentTime`

---

## 3. Integration Points

### 3.1. VideoPreview.tsx Changes
- Cần expose `videoRef` hoặc dùng global ref pattern để `AudioMixer` access `<video>` element
- Hiện tại `videoRef` là local `useRef` — cần lift up hoặc forward

### 3.2. AudioLibrary.tsx Changes  
- `<audio>` element cần `crossorigin="anonymous"` cho CDN URLs
- Cần route qua `createMediaElementSource()` thay vì set `.volume` trực tiếp
- **Breaking change:** Khi connect qua Web Audio API, `HTMLMediaElement.volume` không còn tác dụng trực tiếp nữa (volume chỉ control qua GainNode)

### 3.3. Timeline.tsx Changes
- Track headers (70px width) — thêm mini volume icon + indicator
- Cần thêm TTS track header nếu chưa có visual cho TTS
- Hiện tại chỉ có 3 tracks: VID, SUB, AUDIO — cần xác nhận có thêm track TTS hay gắn vào SUB

### 3.4. AudioTab.tsx Changes
- Connect SliderControl values trực tiếp tới GainNode.gain.value
- `original_volume` slider → `originalGain.gain.value`
- `volume` (TTS master) slider → `ttsGain.gain.value`
- `audio_volume` slider → `bgmGain.gain.value`

---

## 4. Validation Architecture

### 4.1. Unit-level
- AudioMixer singleton tạo/destroy đúng cách
- GainNode values map đúng từ store (0-1 range → gain value)
- TTS buffer cache load/evict đúng

### 4.2. Integration-level
- Play video → hear original audio through Web Audio pipeline
- Add BGM → hear BGM mixed with original
- TTS segments play at correct timestamps
- Seek → audio re-syncs

### 4.3. UX-level
- Slider changes → instant volume response (< 40ms)
- Scrub: silent. Play: audio resumes
- Tab hide/show: AudioContext suspend/resume

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `createMediaElementSource` chỉ gọi 1 lần | High | Singleton pattern + ref tracking |
| Cross-origin CORS blocking BGM CDN | Medium | Add `crossorigin` attribute |
| Memory bloat từ TTS buffer cache | Medium | LRU cache, lazy load visible segments |
| AudioContext resume policy | Low | Resume on first play interaction |
| `<video>` ref không accessible | Medium | Global ref hoặc context provider |

---

## 6. File Impact Summary

| File | Change Type | Effort |
|------|-------------|--------|
| `src/lib/audioMixer.ts` | **NEW** — AudioContext singleton + routing | High |
| `src/components/editor/VideoPreview.tsx` | MODIFY — expose video ref, connect MediaElementSource | Medium |
| `src/components/editor/AudioLibrary.tsx` | MODIFY — route BGM through AudioContext, add `crossorigin` | Medium |
| `src/components/properties/AudioTab.tsx` | MODIFY — wire sliders to GainNode | Low |
| `src/components/editor/Timeline.tsx` | MODIFY — mini volume indicators in track headers | Medium |
| `src/stores/useProjectStore.ts` | MINOR — no new fields needed, existing state sufficient | Low |
