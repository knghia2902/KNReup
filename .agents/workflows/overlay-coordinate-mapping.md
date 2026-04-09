---
description: Quy trình mapping tọa độ overlay (Blur, Logo, Sub) giữa Preview và FFmpeg Output
---

# Overlay Coordinate Mapping: Preview ↔ FFmpeg

## Nguyên tắc chung
Tọa độ overlay (Blur, Text Logo, Image Logo, Subtitle) phải **khớp pixel-perfect** giữa Preview UI và FFmpeg Output.

## Architecture

### Frontend (Preview)
- Overlay container dùng `ResizeObserver` để tính `fittedRect` — vùng video thực tế (loại bỏ letterbox)
- Element dùng **percentage positioning**: `left: (x / videoDimensions.w) * 100%`
- Kéo thả dùng `PointerEvents` + `setPointerCapture` trên `wrapRef` (không phải `e.target`)
- Clamp bounds: `x_max = videoW - elSize.w` (đo bằng `ResizeObserver`)

### Backend (FFmpeg output.py)
- **Thứ tự filter**: Crop TRƯỚC → Overlays SAU
- **Tọa độ tỷ lệ**: `ratio = stored_pixel / orig_video_dimension`
- FFmpeg expressions: `x='w*{ratio}'`, `overlay='W*{ratio}':'H*{ratio}'`
- Probe video dimensions bằng `ffprobe` trước khi build filter chain

## Filter Order (CRITICAL)
```
1. Crop (if 9:16)     → [vcrop]
2. Blur                → [vblur0..N]
3. Watermark Text      → [vwm]
4. Image Logo Overlay  → [vlogo]
5. ASS Subtitles       → [vout]
```

**⚠️ KHÔNG BAO GIỜ đặt Blur/Logo TRƯỚC Crop** — sẽ gây lệch tọa độ vì crop thay đổi kích thước frame.

## Files liên quan
- `src/components/editor/VideoPreview.tsx` — DraggableBlur, DraggableTextLogo, DraggableImageLogo
- `src/stores/useProjectStore.ts` — blur_x/y/w/h, watermark_x/y, image_logo_x/y
- `src/components/properties/StyleTab.tsx` — UI controls
- `python-sidecar/app/engines/output.py` — FFmpeg filter chain
- `python-sidecar/app/pipeline_runner.py` — PipelineConfig
