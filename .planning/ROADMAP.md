# Roadmap — KNReup

> Thiết kế lại hoàn toàn từ tonghop.md, tối ưu cho flow phát triển thực tế.

## Phase 1: Foundation — Tauri Shell + Sidecar Bridge
> **Mục tiêu**: App chạy được, frontend ↔ backend giao tiếp OK
> **Output**: Tauri window mở lên, gọi FastAPI thành công

- Tauri 2.0 project initialization + React/TypeScript/Vite
- Python FastAPI sidecar setup (auto-port detection)
- Sidecar bridge: Tauri ↔ FastAPI HTTP + JSON protocol
- First-run dependency checker (Python, FFmpeg, CUDA detect)
- GPU auto-detect + status popup (✅/❌)
- taste-skill installation + base design system (dark theme, glassmorphism)
- Basic app layout skeleton (5-panel NLE frame)

**UAT**: App khởi động → detect GPU → hiển thị status → frontend gọi `/api/health` thành công

---

## Phase 2: Core Pipeline MVP — Whisper + Translate + TTS + FFmpeg
> **Mục tiêu**: Upload video → nhận diện giọng → dịch → tạo giọng → xuất video
> **Output**: Pipeline 4 bước hoạt động end-to-end

- Whisper ASR integration (faster-whisper, model selection, VAD, chunked)
- Translation engine #1: DeepSeek API (đã chứng minh từ VideoTransAI)
- Translation engine #2: CTranslate2/Argos offline
- TTS engine #1: Edge TTS (Microsoft Neural)
- TTS engine #2: Piper TTS offline (ONNX model vi_VN)
- FFmpeg output builder: merge audio + video
- Burn phụ đề: ASS via FFmpeg (phương pháp 1)
- SSE progress streaming
- Basic upload + processing UI

**UAT**: Upload MP4 → Whisper transcribe → DeepSeek dịch → Edge TTS đọc → FFmpeg xuất video có lồng tiếng + phụ đề

---

## Phase 3: NLE Editor UI — Preview + Subtitle Editor
> **Mục tiêu**: Giao diện editor chuyên nghiệp, WYSIWYG preview
> **Output**: 5-panel NLE layout hoàn chỉnh

- NLE 5-Panel layout implementation (resizable panels)
- Video Preview panel: playback controls, WYSIWYG subtitle overlay (Canvas API)
- Subtitle Panel: segment list, inline edit, timestamp edit
- Properties Panel: Style/Text/TTS tabs
- Burn phụ đề: WYSIWYG Canvas → PNG overlay (phương pháp 2)
- So sánh + benchmark ASS vs Canvas rendering
- SRT import/export
- Drag & drop video import
- Style presets (7+ presets)

**UAT**: Mở video → thấy subtitle overlay trên preview → chỉnh sửa text → thay đổi style → export đúng như preview

---

## Phase 4: Multi-Engine + Advanced Features
> **Mục tiêu**: Đa dạng engine, audio FX, các tính năng nâng cao
> **Output**: 4 engine dịch + 4 engine TTS + audio processing

- Translation engine #3: Google Gemini API
- Translation engine #4: OpenAI API
- TTS engine #3: gTTS (Google)
- TTS engine #4: SmartVoice (kiểm tra ali33.site API)
- Auto fallback chain + key rotation (round-robin)
- Custom prompt presets (nhiều slot, context-aware)
- Audio FX Pipeline (highpass, lowpass, EQ, compressor, loudness, speed, pitch, fade)
- Batch processing + job queue
- Cancel / Pause pipeline

**UAT**: Chọn engine → dịch thành công → fallback khi gặp lỗi → Audio FX nghe rõ sự khác biệt

---

## Phase 5: Output Advanced — Watermark + Blur + Crop + Audio Mix
> **Mục tiêu**: Professional output với đầy đủ effects
> **Output**: Video export chất lượng cao với mọi tùy chỉnh

- Watermark text + logo (drag-and-drop positioning)
- PaddleOCR + auto blur phụ đề cứng
- Manual blur regions
- BGM (nhạc nền): auto loop, gain, trim
- Audio denoise (afftdn)
- Smart Crop/Resize (16:9, 9:16, 1:1 — AI subject detection)
- Encoding presets (H.264/H.265, CRF, resolution)
- Font tùy chỉnh (Google Fonts), bold/italic, nền phụ đề, text shadow

**UAT**: Export video 9:16 với watermark + blur sub cũ + nhạc nền + H.265

---

## Phase 6: Multi-Track Timeline + Premium UI
> **Mục tiêu**: Timeline chuyên nghiệp, UI đẹp hoàn thiện
> **Output**: Editor-grade timeline + polished UI

- Multi-track timeline (video + audio + subtitle tracks)
- Waveform display, thumbnail frames
- Playhead, snap-to-grid, collision detection, zoom
- Merge/Split subtitle segments từ timeline
- Dark/Light theme toggle + accent color
- Micro-animations, hover effects, panel transitions
- Keyboard shortcuts (Space, ←→, C, V, Ctrl+S, Ctrl+Z)
- Multi API key management + rotation + usage tracking

**UAT**: Kéo subtitle block trên timeline → snap vào grid → merge 2 segments → toggle theme

---

## Phase 7: Video Downloader
> **Mục tiêu**: Download video đa nền tảng, no-watermark
> **Output**: Download panel tích hợp trong app

- Douyin downloader (f2 + no-watermark extraction)
- TikTok / YouTube / Facebook (yt-dlp)
- Paste link + batch URL import
- SQLite state tracking + dedup protection
- Async batch download pipeline
- Download Panel UI (progress, queue, history)
- Folder organization by user/platform

**UAT**: Paste Douyin URL → download no-watermark 1080p → auto organize folder

---

## Phase 8: Auto-Monitor + AI Assistants
> **Mục tiêu**: Tự động theo dõi accounts + AI pro tools
> **Output**: Set & forget monitoring + AI-powered editing

- Account tracking + periodic polling
- Cookie extraction + JIT auth + health check
- Proxy rotation + anti-ban
- Monitor dashboard UI
- AI Text Editor (review + suggest)
- AI Video Summarizer (key moments → short video)
- Auto Copyright Analyzer
- Subtitle Masking (AI detect + overlay)

**UAT**: Thêm Douyin account → scan 10 video mới → auto queue download → AI summarize 1 video

---

## Phase 9: Polish + License System
> **Mục tiêu**: Sản phẩm hoàn thiện sẵn sàng phân phối
> **Output**: App ổn định, có license, sẵn sàng release

- License system (user, expiry, device binding)
- Auto-update mechanism
- Error reporting / crash analytics
- Performance optimization + memory management
- Documentation / User guide
- Installer / packaging
- Beta testing + bug fixes

**UAT**: User cài app → nhập license → sử dụng đầy đủ tính năng → auto update khi có bản mới

---

## Tóm Tắt

| Phase | Tên | Dependencies | Ước tính |
|-------|-----|-------------|----------|
| 1 | Foundation (Tauri + Sidecar) | Không | 1-2 tuần |
| 2 | Core Pipeline MVP | Phase 1 | 2-3 tuần |
| 3 | NLE Editor UI | Phase 2 | 2-3 tuần |
| 4 | Multi-Engine + Advanced | Phase 2 | 2 tuần |
| 5 | Output Advanced | Phase 3, 4 | 2 tuần |
| 6 | Timeline + Premium UI | Phase 3 | 2 tuần |
| 7 | Video Downloader | Phase 1 | 2 tuần |
| 8 | Auto-Monitor + AI | Phase 7 | 2-3 tuần |
| 9 | Polish + License | All | 1-2 tuần |

**Tổng ước tính**: ~16-22 tuần (4-5 tháng)
