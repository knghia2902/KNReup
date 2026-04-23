# Phase 10: Voice Clone - OmniVoice Integration - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Tích hợp Voice Clone sử dụng model OmniVoice (k2-fsa/OmniVoice), mở dưới dạng standalone popup từ Home Launcher với thiết kế tương tự Downloader. Bao gồm: clone giọng từ audio, tạo giọng từ mô tả text (Voice Design), quản lý voice profile, preview/test giọng, và tích hợp giọng clone vào TTS pipeline của Editor.

</domain>

<decisions>
## Implementation Decisions

### Luồng Clone Giọng
- **D-01:** Người dùng cung cấp audio tham chiếu bằng cách **upload file** (kéo thả hoặc chọn file WAV/MP3). Không hỗ trợ record trực tiếp từ micro.
- **D-02:** **Tự động hoàn toàn** — Không hiện ô nhập transcript (ref_text). OmniVoice sẽ tự dùng Whisper ASR để phân tích nội dung audio tham chiếu.
- **D-03:** Thời lượng audio tham chiếu **tối đa 30 giây**, UI khuyến nghị 3-10s (chất lượng tốt nhất). Hiện warning nếu file > 10s.

### Quản Lý Voice Profile
- **D-04:** Giao diện danh sách **dọc** (giống danh sách download trong Downloader) — mỗi profile 1 dòng.
- **D-05:** Hiển thị **chi tiết**: Tên profile + ngày tạo + thời lượng audio gốc + nút Play/Delete.
- **D-06:** **Không cần export/import** voice profile. Chỉ dùng local, sau này tính tiếp.

### Preview & Test Giọng
- **D-07:** **Cả hai**: Có câu mẫu tiếng Việt sẵn VÀ cho phép user gõ text tùy ý để test.
- **D-08:** **Có so sánh** giọng gốc vs giọng clone — hiện cả 2 audio player (gốc bên trái, clone bên phải).

### Tích Hợp Với Pipeline
- **D-09:** Giọng clone **xuất hiện trong dropdown TTS tab** của Editor, cùng danh sách với Edge TTS, gTTS, ElevenLabs. User tạo giọng ở Voice Clone tool → dùng luôn khi lồng tiếng.
- **D-10:** **Có hỗ trợ Voice Design** — Thêm tab/section "Thiết kế giọng" trong tool, user nhập mô tả (VD: "female, low pitch, british accent") → tạo giọng không cần audio tham chiếu.

### Agent's Discretion
- Chi tiết UI layout (spacing, button styling) theo design system hiện có
- Cách hiển thị loading/progress khi model đang generate
- Xử lý lỗi khi OmniVoice chưa cài hoặc model chưa download

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OmniVoice Model
- `https://github.com/k2-fsa/OmniVoice` — Repo chính, README chứa Python API, CLI tools, voice cloning/design API
- `https://github.com/k2-fsa/OmniVoice/blob/master/docs/tips.md` — Tips cho voice cloning quality
- `https://github.com/k2-fsa/OmniVoice/blob/master/docs/voice-design.md` — Full attribute reference cho Voice Design
- `https://github.com/k2-fsa/OmniVoice/blob/master/docs/generation-parameters.md` — Generation parameters (speed, duration, num_step)

### Existing Codebase
- `python-sidecar/app/engines/tts/omnivoice_engine.py` — Engine hiện có (synthesize, create_voice_profile, list_voices)
- `src/components/downloader/DownloaderWindow.tsx` — Mẫu thiết kế popup để tái sử dụng
- `src/utils/windowManager.ts` — Multi-window manager, đã có config `tool-voice-clone`
- `src/styles/design-system.css` — Design tokens và CSS variables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OmniVoiceTTSEngine` (python-sidecar): Đã có synthesize(), list_voices(), create_voice_profile(), preprocess_reference_audio() — cần mở rộng cho voice design
- `DownloaderWindow.tsx`: Pattern Header + Input + List cho popup window — clone UI structure
- `windowManager.ts`: openTool('voice-clone') đã config sẵn (800×600)
- `useSidecar` hook: Kết nối frontend ↔ sidecar API
- `design-system.css`: CSS variables, dark mode, glassmorphism

### Established Patterns
- Standalone tool popup: `DownloaderWindow.tsx` pattern (header bar + main content + status)
- Sidecar API: FastAPI routes trong `python-sidecar/app/routes/`
- TTS profiles: `data/tts_profiles/` lưu JSON metadata + WAV audio
- State management: Zustand stores

### Integration Points
- `windowManager.ts` → openTool('voice-clone') mở popup
- `HomeLauncher.tsx` → Card cho Voice Clone tool
- `tts_profiles.py` routes → API endpoints cho profile CRUD
- TTS tab dropdown → hiển thị giọng clone từ profiles

</code_context>

<specifics>
## Specific Ideas

- Thiết kế **tương tự Downloader**: Header dark với icon + tên tool, body dark, danh sách items dọc
- OmniVoice zero-shot: Không "train" model, chỉ trích xuất speaker embedding từ audio 3-10s
- Voice Design: Hỗ trợ attribute mô tả giọng (gender, age, pitch, dialect/accent, whisper)
- Output audio: 24kHz WAV

</specifics>

<deferred>
## Deferred Ideas

- Export/import voice profile (chia sẻ giọng clone giữa các máy)
- Record audio trực tiếp từ micro trên UI
- Voice fine-tuning (train thêm với nhiều data)

</deferred>

---

*Phase: 10-voice-clone-omnivoice-integration*
*Context gathered: 2026-04-23*
