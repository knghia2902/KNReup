# Roadmap — KNReup

> Thiết kế lại hoàn toàn từ tonghop.md, tối ưu cho flow phát triển thực tế.
> Cập nhật 2026-03-23: bổ sung feedback từ tech review, chốt layout, thêm notes kỹ thuật.

## Layout đã chốt
> Xem chi tiết: `.planning/references/layout-spec.md`
> Sơ đồ: `.planning/references/layout-overview.png`, `layout-states.png`
>
> - Titlebar tabs: Editor / Downloader / Monitor / Settings
> - Sidebar 44px + Media Bin 210px + Video Preview flex:1 + Properties 268px (4 tabs: STYLE/TTS/SUB/OUT)
> - Timeline 120px (4 tracks: VIDEO/AUDIO/SUB/BGM) + Status bar 22px
> - Logic ẩn/hiện theo module + sidebar state

## Milestones

- ✅ **v1.0 MVP Release** — Phase 1 đến 3.1 (Shipped 2026-03-25)

## Các Phase Đã Hoàn Thành

<details>
<summary>✅ v1.0 MVP Release (Phases 1-3.1) — SHIPPED</summary>

- [x] Phase 1: Foundation (Tauri + Sidecar Bridge)
- [x] Phase 2: Core Pipeline MVP (Whisper + Dịch + TTS + Render)
- [x] Phase 3: NLE Editor UI (Layout, Preview, Subtitle Editor)
- [x] Phase 3.1: Analyze & Render (Tách luồng Frontend/Backend)

*Xem chi tiết lịch sử tại `.planning/milestones/v1.0-ROADMAP.md`*
</details>


## Phase 4: Multi-Engine + Advanced Features
> **Mục tiêu**: Đa dạng engine, audio FX, batch processing
> **Requirements**: M2-01, M2-02, M2-03, M2-04, M2-05
> **Output**: 4 engine dịch + 4 engine TTS + audio processing

- Translation engine #3: Google Gemini API
- Translation engine #4: OpenAI API
- TTS engine #3: gTTS (Google)
- TTS engine #4: SmartVoice (kiểm tra ali33.site API — **API không chính thức, có rủi ro**)
- **Circuit breaker pattern** cho fallback chain (cool-down period khi engine bị lỗi liên tục)
- Auto fallback chain + key rotation (round-robin)
- Custom prompt presets (nhiều slot, context-aware)
- Audio FX Pipeline (highpass, lowpass, EQ, compressor, loudness, speed, pitch, fade)
- Batch processing + job queue
- Cancel / Pause pipeline

**UAT**: Chọn engine → dịch thành công → bật circuit breaker khi lỗi → fallback tự động → Audio FX rõ khác biệt

---

## Phase 5: Output Advanced — Watermark + Blur + Crop + Audio Mix
> **Mục tiêu**: Professional output với đầy đủ effects
> **Requirements**: M2-06, M2-07, M2-08, M2-09, M2-10
> **Output**: Video export chất lượng cao với mọi tùy chỉnh

- Watermark text + logo (drag dot positioning trên preview — đã có từ layout)
- PaddleOCR + auto blur phụ đề cứng — **model ~500MB, chậm trên CPU, cân nhắc easyocr alternative**
- Manual blur regions (vẽ trên preview zone)
- BGM (nhạc nền): auto loop, gain, trim — track BGM trên timeline
- Audio denoise (afftdn)
- Smart Crop/Resize (16:9, 9:16 — **AI subject detection để experimental/optional**)
- Encoding presets (H.264/H.265/VP9, CRF, resolution) — đã có tab OUT
- Font tùy chỉnh (Google Fonts), bold/italic, nền phụ đề, text shadow

**UAT**: Export video 9:16 với watermark + blur sub cũ + nhạc nền + H.265

---

## Phase 6: Multi-Track Timeline + Premium UI
> **Mục tiêu**: Timeline 4 tracks, UI đẹp hoàn thiện
> **Requirements**: M2-11, M2-12, M2-13, M2-14
> **Output**: Timeline hoạt động + polished UI

- 4-track timeline cố định: VIDEO / AUDIO / SUB / BGM
- **Dùng `wavesurfer.js`** cho waveform thay vì tự render
- Thumbnail generation bằng FFmpeg ở background, cache ra disk
- Playhead, zoom controls
- **Simplified version trước**: không cần snap-to-grid, collision detection ngay v1
- Merge/Split subtitle segments từ timeline
- Dark/Light theme toggle + accent color
- Micro-animations, hover effects, panel transitions
- Keyboard shortcuts (Space, ←→, C, V, Ctrl+S, Ctrl+Z)
- Multi API key management + rotation + usage tracking

**UAT**: Play video → waveform hiển thị → kéo playhead → zoom timeline → merge subtitle → toggle theme

---

### Phase 06.1: OCR Subtitle Extraction (INSERTED)

**Goal:** [Urgent work - to be planned]
**Requirements**: TBD
**Depends on:** Phase 6
**Plans:** 1/1 plans complete

Plans:
- [x] TBD (run /gsd-plan-phase 06.1 to break down) (completed 2026-04-08)

## Phase 7: Video Downloader
> **Mục tiêu**: Download video đa nền tảng, no-watermark
> **Output**: Module Downloader trong titlebar tab

- Douyin downloader (f2 + no-watermark extraction)
- TikTok / YouTube / Facebook (yt-dlp)
- Paste link + batch URL import (URL Queue panel trong Downloader module)
- SQLite state tracking + dedup protection
- Async batch download pipeline
- Download Panel UI (progress, queue, history) — Downloader module layout
- Folder organization by user/platform

**UAT**: Chuyển tab Downloader → paste Douyin URL → download no-watermark 1080p → tổ chức folder

---

### Phase 07.1: Refactor Stitch UI and Implement Tauri WebView Auth (INSERTED)

**Goal:** [Urgent work - to be planned]
**Requirements**: TBD
**Depends on:** Phase 07
**Plans:** 1/1 plans complete

Plans:
- [x] TBD (run /gsd-plan-phase 07.1 to break down) (completed 2026-04-17)
**Status**: ✅ Complete (2026-04-17)

## Phase 7.2: Advanced Timeline Interactions
> **Mục tiêu**: Kéo thả clip, snapping chuyên nghiệp và kéo thả từ library.
> **Output**: Timeline hoạt động mượt mà ngang tầm Capcut.

- **Clip Repositioning**: Kéo di chuyển clip (VID/BGM) trên track.
- **Snapping Logic**: Tự động hít vào playhead/cạnh clip khi kéo.
- **Library Drag & Drop**: Kéo video/audio từ Media Bin/Audio Library thả xuống timeline.
- **Visual Feedback**: Hiện vạch snap, bóng mờ khi kéo thả.
- **Split Functionality**: Hỗ trợ Split, Split Left, Split Right tương tự Capcut.

**UAT**: Nắm thân clip kéo đi → clip tự hít vào playhead → kéo nhạc từ Audio Library thả vào timeline → Split clip thành công.

Plans:
- [x] 07.2-01-PLAN.md — Magnetic snapping, dragging and basic split.
- [x] 07.2-02-PLAN.md — Timeline Header Refactor, Trash Icon, BGM Deletion and Time Display fixes.

---

### Phase 08.1: UI Adjustments & Time Format Fix (INSERTED)
> **Mục tiêu**: Fix UI feedback và cập nhật format thời gian mm:ss:ff.
> **Requirements**: UI-FIX-01, UI-FIX-02, TIME-FIX-01
> **Output**: UI tinh gọn và format thời gian chuẩn frame.

- VideoControls time display width adjustment (minWidth: 100).
- Timeline Header cleanup (remove center time display).
- Time format update to `mm:ss:ff`.

**UAT**: Preview time display cân đối → Timeline Header không còn thời gian ở giữa → Độ dài video hiển thị theo mm:ss:ff.

---

## Phase 08.0: Editor Upgrade & AI Enhancement
> **Mục tiêu**: Nâng cấp toàn diện UX Editor — Timeline tương tác chi tiết, Properties Panel nâng cao, và AI tối ưu nội dung.
> **Requirements**: M3-ED-01, M3-ED-02, M3-ED-03, M3-ED-04
> **Output**: Editor chuyên nghiệp ngang cấp CapCut/Premiere.

- **Interactive Timeline Tracks**: Tất cả 4 track (VID/TTS/SUB/BGM) đều chỉnh sửa trực tiếp.
- **Timeline Snapping**: Magnetic timeline — hút giữa các track khi kéo.
- **Advanced Properties Panels**:
  - STYLE: Preset phong cách phụ đề (Cinematic, Minimal...).
  - TTS: OmniVoice (Offline) & ElevenLabs (Cloud) integration, Piper removal.
  - SUB: Bulk edit, tìm kiếm/thay thế, AI Refine button.
  - OUT: Batch Export Presets (lưu/tải cấu hình export).
- **AI Subtitle Refiner**: Gọi LLM (Gemini/DeepSeek) hiệu đính phụ đề tự động.
- **AI Subtitle Masking**: OCR phát hiện hardsub cũ → auto Blur zone.
- **Speaker Diarization**: Nhận diện người nói và gán giọng đọc tự động.

**UAT**: Trim VID track → kéo BGM offset → AI Refine phụ đề → lưu Export Preset → Auto-mask sub cũ.

**Plans:** 1/5 plans executed
- [x] 08.0-01-PLAN.md — Sidecar TTS Integration (OmniVoice, ElevenLabs) & Piper Removal.
- [ ] 08.0-02-PLAN.md — Frontend TTS UI, State & Per-segment config.
- [ ] 08.0-03-PLAN.md — Professional Timeline Interactions & Smart Snapping.
- [ ] 08.0-04-PLAN.md — AI Core Sidecar (Refiner, Masking, Diarization).
- [ ] 08.0-05-PLAN.md — Advanced Properties Panel & AI UI Integration.

---

### Phase 08.2: Audio System Refactor & Local Import (INSERTED)
... (rest of the file remains same)
