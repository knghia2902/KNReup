# KNReup — Tool Lồng Tiếng Video AI

## What This Is

KNReup là ứng dụng desktop Windows dùng để **tự động lồng tiếng, dịch phụ đề, và reup video** bằng AI. Được xây dựng từ đầu lấy cảm hứng từ VideoTransAI, với kiến trúc hiện đại (Tauri 2.0 + React + Python FastAPI), giao diện NLE chuyên nghiệp (phong cách CapCut/Premiere Pro), và nhiều tính năng nâng cao hơn.

Đối tượng: Người làm content, reuploader, YouTuber, TikToker cần lồng tiếng video từ tiếng nước ngoài sang tiếng Việt.

## Core Value

**Tự động hoá pipeline lồng tiếng video end-to-end**: Upload video → Nhận diện giọng nói → Dịch → Tạo giọng đọc → Xuất video có phụ đề + lồng tiếng — tất cả trong một app duy nhất.

## Current Milestone: v3.0 Full Release (Automation & AI)

**Goal:** Nâng cấp trải nghiệm Editor chuyên nghiệp, tích hợp trợ lý AI để tối ưu hóa nội dung, và xây dựng hệ thống tự động hóa kênh cùng hệ thống phân phối (Licensing).

**Target features:**
- **Pro Editor Upgrade**: Chế độ Snap timeline, hỗ trợ phím tắt nâng cao, tối ưu hóa preview.
- **AI Empowerment**: AI Subtitle Refiner (hiệu đính phụ đề), AI Subtitle Masking (xóa sub cứng tự động).
- **Automation Monitoring**: Tự động theo dõi và tải video từ Douyin/TikTok theo danh sách kênh.
- **System & Licensing**: Tích hợp hệ thống bản quyền SaaS, tự động cập nhật và đóng gói bộ cài hoàn thiện.

## Requirements

### Validated

- ✓ Pipeline 4 bước (Whisper → Translate → TTS → FFmpeg)
- ✓ Phase 3: NLE Editor UI — Layout 5-panel, WYSIWYG preview, timeline, properties tabs
- ✓ Phase 3.1: Tách luồng Pipeline Analyze và Render (Lưu lại file gốc, chỉnh phụ đề trước khi xuất)
- ✓ Phase 5: Giao diện và API FFmpeg hỗ trợ Watermark, Blur thủ công, BGM Audio Mix Ducking và Smart Crop 9:16.
- ✓ 4 engine dịch thuật (DeepSeek, Gemini, DeepL, v.v...)
- ✓ Chức năng tuỳ chỉnh output file qua Native OS Dialog
- ✓ Rendering canvas WYSIWYG khớp hoàn hảo với FFmpeg ASS Render
- ✓ Phase 10: Voice Clone & Design Endpoints (OmniVoice integration)

### Active

#### Đầu nối Multi-Engine (Cho Milestone 2)
- [ ] OpenAI, CTranslate2/Argos offline (Vẫn còn thiếu).
- [ ] Auto fallback + key rotation cho các model.
- [ ] Multi TTS Engines (Piper, gTTS, SmartVoice).
- [ ] Audio FX Pipeline.

#### Output Nâng Cao
- [ ] PaddleOCR nhận dạng phụ đề cứng trên video.

#### UI Pro
- [ ] Dark/Light theme, glassmorphism, micro-animations.
- [ ] Keyboard shortcuts.

#### Video Downloader
- [ ] Douyin no-watermark download (f2 + a_bogus)
- [ ] TikTok, YouTube, Facebook support (yt-dlp)
- [ ] Async batch download, SQLite state tracking
- [ ] Auto-monitor accounts + periodic polling

#### AI Assistants
- [ ] AI Text Editor (review + suggest)
- [ ] AI Video Summarizer (key moments → short video)
- [ ] Auto Copyright Analyzer
- [ ] Subtitle Masking

#### Hệ thống
- [ ] First-run setup giống VideoTransAI: detect GPU → cài đặt dependencies
- [ ] Multi API key management + rotation
- [ ] Batch processing + job queue

### Out of Scope
- Web deployment (Docker/API Gateway)
- Mobile app — hoàn toàn ngoài scope
- Voice cloning — quá phức tạp cho v1
- Live streaming integration — không cần thiết

## Current State
**v1.0 MVP Released (2026-03-25)**: Hệ thống cơ bản hoạt động ổn định. Người dùng có thể Import video, app gọi API tự động Analyze bóc băng, dịch tiếng. Sau đó người dùng chỉnh sửa Layout (Properties Tabs, Timeline), đổi Name, và Render xuất Video bằng hộp thoại Save Native. Pipeline Backend + UI Frontend đã liên kết mạnh mẽ.

**Phase 5 Complete (2026-03-26)**: Đã tích hợp thành công cấu hình Output Advanced (Watermark, Text, Blur, Crop 9:16, Audio Mix BGM).

**Phase 10 Complete (2026-04-23)**: Tích hợp thành công Voice Clone & Design Endpoints với OmniVoice engine.

**Next Milestone Goals (v2.0)**: Bắt đầu khai mở hàng loạt các Engine mới (Trí tuệ nhân tạo, Audio FX) và tích hợp Video Downloader.

## Context

### Tham khảo
- **VideoTransAI** (Clone/VideoTransAI): Bản build tham khảo, PyInstaller + Flask, backend Cython compiled, hiểu được toàn bộ frontend + API flow
- **AlexTransVideo 3.0** (Clone/Reupv3/tonghop.md): Bản thiết kế chi tiết 481 dòng, 9 phases, 80+ tính năng

### Key Differences vs VideoTransAI
- Source code Python thuần (không compiled Cython)
- Kiến trúc Tauri 2.0 thay vì PyInstaller + Flask
- NLE Pro UI thay vì web đơn giản
- 4 engine dịch thuật thay vì 1
- Video downloader module hoàn toàn mới
- OCR + AI Assistants modules mới

### UI Framework
- taste-skill từ GitHub sẽ được cài và sử dụng để đảm bảo UI đẹp, premium
- Settings: DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY adjustable

## Constraints

- **Platform**: Windows only (desktop app)
- **Tech stack**: Tauri 2.0 + React/TypeScript (frontend) + Python FastAPI sidecar (backend)
- **GPU**: CUDA 11 + CUDA 12 + CPU fallback
- **Location**: `D:\Tools\KNReup\`
- **Language**: UI tiếng Việt, code comments tiếng Việt

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tauri 2.0 thay vì Electron/PyInstaller | Nhẹ, nhanh, native, Rust-based | — Pending |
| Python FastAPI sidecar thay vì embedded | Dễ debug, sửa source trực tiếp | — Pending |
| Test cả ASS FFmpeg vs Canvas PNG overlay | Chưa rõ cái nào tốt hơn, test cả 2 | — Pending |
| Thêm Piper TTS vào danh sách TTS | Cần offline TTS, VideoTransAI đã có sẵn | — Pending |
| taste-skill cho UI | Đảm bảo design premium, không generic | — Pending |
| First-run setup giống VideoTransAI | UX đã chứng minh, detect GPU → install | — Pending |

---
*Last updated: 2026-04-23 after Phase 10 completion*
