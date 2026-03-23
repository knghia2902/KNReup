# Phase 3: NLE Editor UI — Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 biến layout skeleton thành editor chuyên nghiệp hoạt động thật:
- Video Preview panel với playback controls và WYSIWYG subtitle overlay (Canvas API)
- 4 Properties tabs hoạt động (STYLE/TTS/SUB/OUT) với interactive controls
- Subtitle editor: inline edit, split/merge, SRT import/export, re-TTS per segment
- Style presets (7+), font picker, drag & drop video import
- Sidebar state switching

**Deliverable**: Mở video → subtitle overlay trên preview → chỉnh text/style/TTS/output → preview WYSIWYG khớp

</domain>

<decisions>
## Implementation Decisions

### Video Preview & Canvas Subtitle
- **Claude's Discretion**: Chọn cách render video (video element + canvas overlay hoặc full canvas)
- **Claude's Discretion**: Playback controls level (cơ bản → NLE đầy đủ)
- **Font picker cho user chọn**: User tự chọn font cho subtitle, hỗ trợ Google Fonts API hoặc local font file. Phải dùng FontFaceObserver để đảm bảo dấu tiếng Việt render đúng
- **Hardsub strategy đã chốt từ Phase 2**: Canvas = preview, ASS = export — không cố 1:1 giống nhau
- **Claude's Discretion**: Empty state cho preview khi chưa có video

### Properties Tabs — Interactive Controls
- **Claude's Discretion**: State management cho config (20+ fields từ videotransai-config.md)
- Tab STYLE: 5 sections (ngôn ngữ, subtitle style, video ratio, blur regions, logo/watermark) + preset chips
- Tab TTS: dubbing toggle, engine select, voice dropdown, speed/vol/pitch sliders, vol gốc, fallback chain
- Tab SUB: segment list, timecode input, split/merge/del, source + translated text, re-TTS per segment
- Tab OUT: codec H264/H265/VP9, CRF slider, resolution, audio mix mode, export queue
- **Claude's Discretion**: Style presets scope và behavior (subtitle-only vs full config, custom save/delete)
- **Claude's Discretion**: Color picker approach cho màu chữ/viền subtitle

### Subtitle Editor (tab SUB)
- **Claude's Discretion**: Re-TTS tự động hay thủ công khi sửa text
- **Claude's Discretion**: SRT import behavior (thay thế hay merge) khi đã có subtitle
- SRT import/export capability
- Whisper confidence badge per segment

### Drag Interactions trên Preview
- **Claude's Discretion**: Include drag interactions (logo/watermark drag, blur region drawing) trong Phase 3 hay defer sang Phase 5

### Design
- **BẮT BUỘC dùng taste-skill** cho tất cả UI components — đảm bảo design premium
- DESIGN_VARIANCE=5, MOTION_INTENSITY=4, VISUAL_DENSITY=8 (từ Phase 1)
- Dark theme mặc định, glassmorphism, micro-animations
- Phosphor Icons (đã dùng từ Phase 1)

### Claude's Discretion (tổng hợp)
- Video render approach
- Playback controls complexity
- Preview empty state
- State management library/pattern
- Style presets scope
- Color picker library
- Re-TTS trigger behavior
- SRT import conflict resolution
- Drag interactions phân bổ Phase 3 vs Phase 5

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST đọc trước khi planning hoặc implementing.**

### Layout & UI
- `.planning/references/layout-spec.md` — Layout chốt: sizing, 4 modules, sidebar states, 4 properties tabs chi tiết
- `.planning/references/videotransai-config.md` — 6 nhóm config, 20+ fields, default values, tham khảo cho controls

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Architecture decisions, UI framework, taste-skill settings
- `.planning/phases/02-core-pipeline/02-CONTEXT.md` — ASR/Translation/TTS/FFmpeg decisions, abstract interfaces, hardsub strategy

### Current Architecture
- `src/components/layout/NLELayout.tsx` — Layout skeleton, PropertiesPanel, Section/Row components, TimelinePanel
- `src/components/layout/NLELayout.css` — Styling hiện tại
- `src/App.tsx` — App shell, module/sidebar state, useSidecar/usePipeline hooks
- `src/hooks/useSidecar.ts` — Frontend sidecar bridge
- `src/hooks/usePipeline.ts` — Pipeline processing hook
- `python-sidecar/app/routes/pipeline.py` — Pipeline API endpoints

### Project
- `.planning/PROJECT.md` — Vision, constraints, key decisions
- `.planning/ROADMAP.md` — Phase scope, kỹ thuật notes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NLELayout.tsx` — PropertiesPanel component (4 tabs, collapsible Section, Row): cần upgrade từ static → interactive
- `Section` component: collapsible sections với icon, có thể tái sử dụng cho tất cả tabs
- `Row` component: label-value display, cần mở rộng thành editable controls
- `UploadPanel.tsx`: drag & drop file handling, có thể tái sử dụng pattern cho video import
- `ProcessingOverlay.tsx`: overlay pattern, tái sử dụng cho progress states
- `useSidecar.ts`: API bridge, dùng cho mọi API calls mới
- `usePipeline.ts`: pipeline state management, reference cho async operation patterns

### Established Patterns
- Phosphor Icons cho tất cả icons (đã consistent trong NLELayout)
- CSS design system: `design-system.css` với variables, dark theme
- taste-skill integration từ Phase 1
- React hooks pattern: custom hooks cho logic (useSidecar, usePipeline)
- Collapsible Section pattern cho properties panels

### Integration Points
- `NLELayout.videoPreview` prop: nhận ReactNode cho video preview component mới
- `NLELayout.properties` prop: nhận ReactNode cho properties panel upgrade
- `NLELayout.mediaBin` prop: hiện dùng UploadPanel, cần mở rộng cho media list
- `python-sidecar/app/routes/`: cần thêm endpoints cho SRT import/export, re-TTS, subtitle management

</code_context>

<specifics>
## Specific Ideas

- Font picker phải hỗ trợ tiếng Việt — dùng FontFaceObserver kiểm tra dấu render đúng
- Tham khảo VideoTransAI config fields và defaults cho controls (videotransai-config.md)
- NLE layout giống CapCut/Premiere Pro — Properties panel cuộn nội bộ, không resize
- Subtitle position 1-5 (trên → dưới) + font_size + color + outline_color (từ VideoTransAI)
- Voice presets tự động apply rate/pitch khi chọn giọng (VOICE_PRESETS từ VideoTransAI)

</specifics>

<deferred>
## Deferred Ideas

- Multi-track timeline logic (waveform, playhead, zoom) → Phase 6
- Audio FX Pipeline (highpass, lowpass, EQ, compressor) → Phase 4
- Multiple engine fallback chain → Phase 4
- PaddleOCR cho hardsub cứng → Phase 5
- Dark/Light theme toggle → Phase 6
- Keyboard shortcuts → Phase 6

</deferred>

---

*Phase: 03-nle-editor-ui*
*Context gathered: 2026-03-23*
