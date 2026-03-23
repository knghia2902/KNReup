# Cấu Hình Video — Tham khảo từ VideoTransAI

> Source: `Clone/VideoTransAI/runtime/VideoTransAI/_internal/static/js/main.js`
> Functions: `defaultConfig()` (L260-292), `collectModalConfig()` (L398-433), `normalizeConfig()` (L298-321)

## 1. Ngôn ngữ & Dịch thuật

| Mục | Field | Default | Options |
|-----|-------|---------|---------|
| Ngôn ngữ nguồn | `language` | `'auto'` | auto, en, zh, ja, ko... |
| Văn phong dịch | `translation_style` | `'default'` | default, cinema, vlog, sport, animal, science, review, custom |
| Prompt tùy chỉnh | `custom_translation_prompt` | `''` | Text (khi style = custom) |

## 2. Lồng tiếng (Dubbing)

| Mục | Field | Default | Range |
|-----|-------|---------|-------|
| Bật/tắt | `dubbing_enabled` | `true` | toggle |
| Giọng đọc | `voice` | `'vi-VN-HoaiMyNeural'` | Dropdown `/api/voices` |
| SmartVoice (tách vocal) | `smart_voice` | `false` | toggle |
| Tốc độ đọc | `rate` | `1.0` (100%) | 0-300% |
| Âm lượng giọng | `voice_volume` | `1.0` (100%) | 0-300% |
| Cao độ | `pitch` | `0.5` (50%) | 0-100% |
| Âm lượng gốc | `original_volume` | `0.1` (10%) | 0-100% |
| Nghe thử giọng | — | — | Button |

## 3. Video Ratio

| Mục | Field | Default | Options |
|-----|-------|---------|---------|
| Tỷ lệ video | `video_ratio` | `'original'` | original, 16:9, 9:16 |

## 4. Blur Regions

| Mục | Field | Default |
|-----|-------|---------|
| Danh sách vùng blur | `blur_regions[]` | `[]` |
| Mỗi vùng | `{id, x, y, w, h}` | Kéo chuột trên video preview |

## 5. Logo / Watermark

### Logo ảnh
| Mục | Field | Default |
|-----|-------|---------|
| Bật/tắt | `logo_image.enabled` | `false` |
| Ảnh | `logo_image.data_url` | `''` |
| Filename | `logo_image.filename` | `''` |
| Vị trí X% | `logo_image.x` | `72` |
| Vị trí Y% | `logo_image.y` | `6` |
| Kích thước % | `logo_image.width_pct` | `18` |

### Logo text
| Mục | Field | Default |
|-----|-------|---------|
| Bật/tắt | `logo_text.enabled` | `false` |
| Nội dung | `logo_text.text` | `''` |
| Vị trí X/Y% | `logo_text.x/y` | `66, 20` |
| Cỡ chữ | `logo_text.font_size` | `40` |
| Màu | `logo_text.color` | `'#FFFFFF'` |

> Logo ảnh + text đều hỗ trợ **drag & drop** trên video preview

## 6. Phụ đề (Subtitle Hardsub)

| Mục | Field | Default | Options |
|-----|-------|---------|---------|
| Bật/tắt hardsub | `subtitle_config.enabled` | `true` | toggle |
| Vị trí | `subtitle_config.position` | `2` | 1-5 (trên → dưới) |
| Cỡ chữ | `subtitle_config.font_size` | `50` | Slider |
| Màu chữ | `subtitle_config.color` | `'#FFFF00'` | Color picker |
| Màu viền | `subtitle_config.outline_color` | `'#000000'` | Color picker |

## Tổng kết

- **6 nhóm** config
- **20+ fields** cấu hình
- **3 tương tác drag** trên video preview (blur regions, logo ảnh, logo text)
- **1 API call** cho voices list (`/api/voices`)
- **1 API call** để lưu config (`/api/save_config`)
- **Voice presets** tự động apply khi chọn giọng (VOICE_PRESETS object)
