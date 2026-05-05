# Phase 30: Template Sets Library — Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Mở rộng hệ thống template từ 1 bộ Default lên 4 bộ giao diện (template sets/skins). Mỗi bộ có `render()` + `animate()` riêng hoàn toàn cho cùng 12 template types, dùng chung data schema (Pydantic `TemplateUnion`). User chọn bộ template trước khi generate video trong Lab.

**Không thuộc phase này:**
- Thay đổi data schema (12 template types giữ nguyên)
- Scene editor / inline editing
- Thêm template types mới (ngoài 12 hiện có)

</domain>

<decisions>
## Implementation Decisions

### Kiến trúc Template Sets
- **D-01:** Mỗi template set là 1 bộ đầy đủ 12 templates với `render()` + `animate()` riêng hoàn toàn. Không phải override CSS — mà là DOM structure + animation khác biệt thực sự giữa các set.
- **D-02:** Tất cả sets dùng chung `SmartTemplate` interface hiện có (`id`, `name`, `icon`, `desc`, `sampleData`, `render()`, `animate()`). Chỉ khác implementation bên trong.
- **D-03:** Tất cả sets dùng chung 6 Theme Palettes + data schema. Set chỉ quyết render/animate, không quyết màu sắc.

### Số lượng & Phong cách
- **D-04:** Tổng cộng 4 bộ template sets:
  1. **Default** (hiện có) — Manrope/Anton fonts, rounded corners 32px, elastic animations, film grain
  2. **Cinematic** — Dark dramatic, slow reveals, chữ lớn bold, letterbox bars, fade transitions, epic scale feel
  3. **News Broadcast** — Thanh tiêu đề kiểu TV news, ticker style, slide-in transitions, lower-third overlays, breaking news aesthetic
  4. **Social Media** — TikTok/Reels style, neon glow effects, fast cuts, bounce animations, emoji-friendly, vertical-native

### UI chọn Template Set
- **D-05:** Dropdown "Template Set" trong Config panel (tab ⚙️ Config) ở Video Gen Lab, đặt phía trên Template grid (12 templates). Khi đổi set, các thumbnails/preview trong grid có thể cập nhật theo.
- **D-06:** Giá trị set đã chọn được truyền cho pipeline để HyperFrames render đúng bộ. Không ảnh hưởng đến LLM prompt — LLM vẫn sinh cùng `templateData` schema, chỉ khác render output.

### Agent's Discretion
- Cấu trúc file / tổ chức code cho nhiều template sets — agent tự quyết approach phù hợp nhất
- Chi tiết visual design cho từng template trong mỗi set (fonts, sizes, decorations, animation timing) — agent tự quyết dựa trên phong cách mô tả
- Cách truyền set ID xuống HyperFrames renderer — agent chọn pattern phù hợp với pipeline hiện có

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template System hiện có
- `src/components/TemplatePreview/templateData.ts` — SmartTemplate interface, 12 templates Default, 6 themes, 3 layouts, applyLayoutOverrides helper
- `src/components/TemplatePreview/TemplatePreviewStudio.tsx` — Preview studio (tham khảo render pattern)

### Backend Schema
- `python-sidecar/app/engines/video_generator/schema.py` — 12 template Pydantic models, TemplateUnion, VideoScript schema
- `python-sidecar/app/engines/video_generator/hyperframes/build_composition.py` — HyperFrames composition builder
- `python-sidecar/app/engines/video_generator/hyperframes/renderer.py` — HyperFrames renderer

### Lab UI (Phase 29)
- `src/components/VideoGenLab/LabSequencePlayer.tsx` — Scene player sử dụng SMART_TEMPLATES
- `src/components/VideoGenLab/LabConfigPanel.tsx` — Config panel (thêm dropdown Template Set ở đây)
- `src/stores/useVideoGenLabStore.ts` — Zustand store cho Lab

### Kiến trúc tham khảo
- `.planning/phases/29-video-gen-lab-tool-test-lu-ng-end-to-end-url-crawl4ai-ollama/29-CONTEXT.md` — Lab architecture decisions
- `.planning/phases/28.1-porting-auto-create-video/28.1-CONTEXT.md` — HyperFrames architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SmartTemplate interface** (`templateData.ts:28-36`): `id`, `name`, `icon`, `desc`, `sampleData`, `render()`, `animate()` — các set mới implement cùng interface
- **THEME_PALETTES** (`templateData.ts:50-87`): 6 palettes dùng chung cho tất cả sets
- **LAYOUT_PRESETS** (`templateData.ts:93-121`): 3 layout presets — có thể giữ hoặc bỏ tuỳ agent (sets mới tự quản fonts riêng)
- **applyLayoutOverrides** (`templateData.ts:432-469`): Helper override fonts/border — sets mới có thể tự handle hoặc mở rộng

### Established Patterns
- **DOM manipulation render:** Templates render bằng `document.createElement` + class names, style inline từ theme
- **GSAP animations:** Tất cả animate dùng GSAP timeline API (`tl.to()`, `tl.from()`, easing functions)
- **CSS classes:** `template-preview.css` định nghĩa base styles cho các class (`.hook-headline`, `.comp-side`, `.stat-value`...) — sets mới cần class names riêng hoặc dùng prefix

### Integration Points
- **LabConfigPanel:** Thêm dropdown Template Set
- **LabSequencePlayer:** Thay đổi lookup từ `SMART_TEMPLATES.find()` sang lookup theo set
- **useVideoGenLabStore:** Thêm `selectedTemplateSet` state
- **HyperFrames renderer:** Truyền set ID để render đúng bộ trên backend

</code_context>

<specifics>
## Specific Ideas

- Mỗi set có visual identity rõ ràng — user nhìn vào phải thấy ngay sự khác biệt giữa Default vs Cinematic vs News vs Social
- Cinematic: nghĩ đến trailer phim, letterbox bars, dramatic zoom, slow text reveals
- News Broadcast: nghĩ đến CNN/BBC lower-thirds, red breaking news bar, slide-in data panels
- Social Media: nghĩ đến TikTok trends, neon outlines, fast stagger animations, bold emoji markers
- Giữ 12 template types giống nhau ở mọi set — chỉ khác presentation

</specifics>

<deferred>
## Deferred Ideas

- **Scene Editor** — chỉnh template/vị trí/font/nội dung cho từng scene (Phase 30 cũ, bỏ vì quá phức tạp)
- **Custom template sets** — cho phép user tự tạo set riêng
- **Template marketplace** — download/share sets từ community
- **Per-scene set mixing** — dùng set khác nhau cho mỗi scene trong cùng 1 video

</deferred>

---

*Phase: 30-template-sets-library*
*Context gathered: 2026-05-05*
