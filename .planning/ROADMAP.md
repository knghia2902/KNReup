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
**Requirements**: M3-VS-01, M3-VS-02, M3-VS-03, M3-VS-04, M3-VS-05, M3-VS-06
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
**Requirements**: M3-VS-01, M3-VS-02, M3-VS-03, M3-VS-04, M3-VS-05, M3-VS-06
**Depends on:** Phase 07
**Plans:** 1/1 plans complete

Plans:
- [x] TBD (run /gsd-plan-phase 07.1 to break down) (completed 2026-04-17)
**Status**: ✅ Complete (2026-04-17)

## Phase 7.2: Advanced Timeline Interactions
> **Mục tiêu**: Kéo thả clip, snapping chuyên nghiệp và kéo thả từ library.
> **Output**: Timeline hoạt động mượt mà ngang tầm Capcut.

- **Clip Repositioning**: Kéo di chuyển clip (VID/BGM) on track.
- **Snapping Logic**: Tự động hít vào playhead/cạnh clip khi kéo.
- **Library Drag & Drop**: Kéo video/audio từ Media Bin/Audio Library thả xuống timeline.
- **Visual Feedback**: Hiện vạch snap, bóng mờ khi kéo thả.
- **Split Functionality**: Hỗ trợ Split, Split Left, Split Right tương tự Capcut.

**UAT**: Nắm thân clip kéo đi → clip tự hít vào playhead → kéo nhạc từ Audio Library thả vào timeline → Split clip thành công.

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

**Plans:** 2/5 plans executed
- [x] 08.0-01-PLAN.md — Sidecar TTS Integration (OmniVoice, ElevenLabs) & Piper Removal.
- [x] 08.0-02-PLAN.md — Frontend TTS UI, State & Per-segment config.
- [ ] 08.0-03-PLAN.md — Professional Timeline Interactions & Smart Snapping.
- [ ] 08.0-04-PLAN.md — AI Core Sidecar (Refiner, Masking, Diarization).
- [ ] 08.0-05-PLAN.md — Advanced Properties Panel & AI UI Integration.

## Phase 09: Home Launcher Redesign & Tools
> **Mục tiêu**: Xây dựng Home Launcher quản lý dự án và khởi chạy các cửa sổ độc lập cho Editor và Tools.
> **Requirements**: M3-HOME-01, M3-HOME-02, M3-HOME-03, M3-HOME-04
> **Output**: Home Launcher hoạt động + Multi-window architecture.

- **Multi-window Architecture**: Launcher, Editor và Tools chạy trong các cửa sổ riêng biệt (giống CapCut).
- **Guest Mode Auth**: Cho phép dùng app không cần login; yêu cầu login cho tính năng AI/Premium.
- **Recent Projects Grid**: Hiển thị danh sách dự án gần đây kèm Thumbnail tự động chụp từ video.
- **Standalone Tools**: Downloader và Voice Clone mở trong cửa sổ popup độc lập.

**UAT**: Mở App -> Launcher hiện ra -> Tạo dự án -> Mở cửa sổ Editor mới -> Chụp thumbnail thành công -> Quay lại Launcher thấy project.

**Plans:** 4 plans
- [x] 09-01-PLAN.md — Multi-window Architecture & Auth Store Foundation. (Completed 2026-04-23)
- [x] 09-02-PLAN.md — Home Launcher UI & Project Metadata. (Completed 2026-04-23)
- [x] 09-03-PLAN.md — Tool Popups & Feature Guards. (Completed 2026-04-23)
- [x] 09-04-PLAN.md — Polishing, Transitions & Final Wiring. (Completed 2026-04-23)

### Phase 08.2: Audio System Refactor & Local Import (INSERTED)
> **Mục tiêu**: Refactor hệ thống Audio để hỗ trợ đa track và import file cục bộ mượt mà.
> **Requirements**: M3-AU-01, M3-AU-02
> **Output**: Audio Engine mới, hỗ trợ mượt mà nhiều nguồn âm thanh.

- **Centralized Audio Manager**: Quản lý toàn bộ audio stream qua một hub duy nhất.
- **Local Asset Provider**: Hỗ trợ import audio/video từ local path thay vì chỉ qua upload.
- **Waveform Scaling**: Sửa lỗi hiển thị waveform khi zoom sâu timeline.

**Plans:** 1/1 plans executed
- [x] 08.2-01-PLAN.md — Audio Refactor & Local Import implementation.

### Phase 08.3: Main Track Timeline Refactor (INSERTED)
> **Mục tiêu**: Tạo ra một Phase riêng biệt tiếp theo chỉ để đập đi xây lại cấu trúc Timeline thành Main Track
> **Output**: Cấu trúc Timeline mới hỗ trợ Main Track giống CapCut và cho phép add trên 2 thành phần (drag-drop đa luồng).

**Depends on:** Phase 08.0

**Plans:** 3/3 plans complete
- [x] 08.3-01-PLAN.md — Data Foundation: Clip Model & useTimelineStore. (completed 2026-04-27)
- [x] 08.3-02-PLAN.md — Component Decomposition: Timeline Layout & Track Components. (completed 2026-04-27)
- [x] 08.3-03-PLAN.md — Behavior Migration: Drag/Drop, Snap, Playhead & Keyboard. (completed 2026-04-27)
**Status**: ✅ Complete (2026-04-27)

### Phase 11: Voice Studio Full Features

**Goal:** Nâng cấp công cụ Voice Clone thành Voice Studio toàn diện với TTS đa engine và hệ thống quản lý lịch sử âm thanh cục bộ.
**Requirements**: M3-VS-01, M3-VS-02, M3-VS-03, M3-VS-04, M3-VS-05, M3-VS-06
**Depends on:** Phase 10
**Plans:** 3 plans

---

## Phase 24: Integrated Project Hub
> **Mục tiêu**: Tích hợp module Downloader với Editor thông qua cấu trúc Project-Centric.
> **Requirements**: INT-01, INT-02
> **Output**: Hệ thống quản lý media theo dự án, tự động load media vào Editor.

- **Backend Migration**: Cập nhật SQLite để lưu `project_id` trong downloads.
- **Home Launcher**: Bổ sung nút "Mở Downloader" và "Mở Editor" vào card dự án.
- **Downloader Integration**: Lưu file vào folder theo project, gắn `project_id` vào record.
- **Editor Auto-Load**: Tự động load media liên kết với project vào Media Bin khi khởi chạy.

**UAT**: Home -> Click Downloader dự án A -> Tải video -> Video lưu vào folder dự án A -> Mở Editor dự án A -> Video đã có sẵn trong Media Bin.

**Plans:** 3 plans
- [x] 24-01-PLAN.md — Infrastructure & Integration Foundation (Backend & Store).
- [x] 24-02-PLAN.md — Project Hub Experience (Editor Load & Launcher UI).
- [x] 24-03-PLAN.md — Downloader History Refinement (Project-specific filtering).

### Phase 25: Social Media Crawlers (TikTok, Bilibili, Facebook, Hybrid)

**Goal:** Native no-watermark crawlers for TikTok, Bilibili, Facebook with yt-dlp hybrid fallback.
**Requirements**: DL-TT-01, DL-BL-01, DL-FB-01, DL-HY-01
**Depends on:** Phase 24
**Plans:** 3/3 plans complete

Plans:
- [x] 25-01-PLAN.md — TikTok No-Watermark Crawler (completed 2026-04-25)
- [x] 25-02-PLAN.md — Bilibili & Facebook Crawlers (completed 2026-04-25)
- [x] 25-03-PLAN.md — Facebook & Hybrid Fallback Crawlers (completed 2026-04-25)
**Status**: ✅ Complete (2026-04-25)


---

## Phase 10: Voice Clone - OmniVoice Integration
> **Mục tiêu**: Tích hợp Voice Clone sử dụng model OmniVoice, mở dưới dạng standalone popup từ Home Launcher với thiết kế tương tự Downloader.
> **Requirements**: M3-VS-01, M3-VS-02, M3-VS-03, M3-VS-04, M3-VS-05, M3-VS-06
> **Output**: Tool Voice Clone riêng biệt + Tích hợp API.

**Depends on:** Phase 09.

**Plans:** 3/3 plans complete
- [x] TBD (run /gsd-plan-phase 10 to break down) (completed 2026-04-23)
