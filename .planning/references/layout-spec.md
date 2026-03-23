# Layout Specification — KNReup (CHỐT)

> Ngày chốt: 2026-03-23

## Sơ đồ tham khảo
- `layout-overview.png` — Cấu trúc tổng quan
- `layout-states.png` — Logic ẩn hiện theo state

## Cấu trúc vật lý

```
┌────────────────────── 100% width ──────────────────────┐
│ Titlebar · 40px                                    ─ □ ×│
│ [Editor] [Downloader] [Monitor] [Settings]              │
├──┬──────────┬─────────────────────────┬─────────────────┤
│S │          │   ruler 16px            │                  │
│i │ Media    │                         │   Properties     │
│d │ Bin      │   Video Preview         │   268px fixed    │
│e │ 210px    │   flex: 1               │   4 tabs:        │
│b │ fixed    │   co giãn lấp đầy       │   STYLE·TTS      │
│a │ scroll   │                         │   SUB·OUT        │
│r │ nội bộ   │                         │   scroll nội bộ  │
│  │          │   controls 36px         │                  │
│44│          │─────────────────────────│                  │
│px│          │                         │                  │
├──┴──────────┴─────────────────────────┴─────────────────┤
│ Timeline · 120px                                        │
│ 4 tracks: VIDEO · AUDIO · SUB · BGM                    │
│ playhead · waveform · zoom controls                     │
├─────────────────────────────────────────────────────────┤
│ Status bar · 22px                                       │
└─────────────────────────────────────────────────────────┘
```

## Sizing

| Component | Width/Height | Type |
|-----------|-------------|------|
| Titlebar | 40px | Fixed |
| Sidebar | 44px | Fixed |
| Media Bin | 210px | Fixed, scroll nội bộ |
| Video Preview | flex: 1, min-width: 0 | Flexible, co giãn lấp đầy |
| Ruler | 16px | Fixed (trên preview) |
| Video Controls | 36px | Fixed (dưới preview) |
| Properties | 268px | Fixed, scroll nội bộ |
| Timeline | 120px | Fixed |
| Status bar | 22px | Fixed |

## Titlebar Tabs — 4 Modules

Mỗi tab chuyển workspace hoàn toàn, ẩn/hiện các panel khác nhau:

| Module | Sidebar | Media Bin | Preview | Properties | Timeline |
|--------|:-------:|:---------:|:-------:|:----------:|:--------:|
| **01 · Editor** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **02 · Downloader** | ✓ | ✗ | URL Queue | ✗ | ✗ |
| **03 · Monitor** | ✓ | ✗ | Account list / Video feed | ✗ | ✗ |
| **04 · Settings** | ✓ | ✓ media bin | Settings form | ✗ | ✗ |

## Sidebar States (trong Editor)

| Icon | Focus | Preview | Properties tab | Timeline | Media Bin |
|------|-------|---------|---------------|----------|-----------|
| **Preview** | focus | bình thường | tab STYLE | hiện | hiện |
| **Subtitle** | focus | bình thường | tab SUB | hiện | hiện |
| **Pipeline** | config | bình thường | tab TTS | hiện | hiện |
| **Monitor** | quick-view | bình thường | mini-panel overlay | ẩn | ẩn |

## Properties Panel — 4 Tabs

### Tab STYLE — 5 sections
1. **Ngôn ngữ & Dịch thuật**: language select, văn phong select, custom prompt (ẩn/hiện)
2. **Phụ đề (hardsub)**: bật/tắt toggle, vị trí 1-5, cỡ chữ slider, font select, màu chữ picker, màu viền picker
3. **Video Ratio**: original / 16:9 / 9:16 radio buttons
4. **Blur Regions**: vẽ vùng trên preview + thêm vùng button, list regions
5. **Logo/Watermark**: ảnh (toggle + file choose + size%) + text (toggle + input + size + color), cả hai có drag dot trên preview zone
6. **Preset chips** + Export button

### Tab TTS
- Dubbing toggle (bật/tắt lồng tiếng)
- Engine selection dropdown
- Voice dropdown
- Speed / Vol / Pitch sliders
- Vol gốc (10%) slider
- Nghe thử / Re-run buttons
- Fallback chain display

### Tab SUB
- Segment list (scrollable)
- Timecode input per segment
- Split / Merge / Del buttons
- Source text (ZH/EN) — read only
- Translated text (VI) — editable
- Re-TTS per segment button
- Whisper confidence badge

### Tab OUT
- Codec: H264 / H265 / VP9
- CRF slider
- Resolution select
- Audio mix mode
- Export queue
- Batch status
- → Export All button

---
*Layout chốt: 2026-03-23*
