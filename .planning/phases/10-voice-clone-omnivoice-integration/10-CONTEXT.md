# Phase 10: Voice Clone - OmniVoice Integration - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Tích hợp Voice Clone và Text-to-Speech sử dụng model OmniVoice phiên bản tiếng Việt (splendor1811/omnivoice-vietnamese), mở dưới dạng standalone popup từ Home Launcher với thiết kế tương tự Downloader. Bao gồm đầy đủ tính năng: Text to Speech (TTS), Clone giọng từ audio, tùy chỉnh vùng miền (Giọng Bắc, Trung, Nam), tạo giọng từ mô tả text (Voice Design) và các tính năng chuyên sâu khác. Quản lý voice profile, preview/test giọng, và tích hợp vào TTS pipeline của Editor.

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
- **D-08b:** **Lưu Lịch Sử (History)** — Các tệp audio được tạo ra khi test/preview sẽ được lưu lại thành Lịch sử để người dùng có thể nghe lại các bản test cũ.
- **D-08c:** **Tạo Voice từ Text bằng Giọng Clone** — Sau khi clone xong và đã có profile giọng, người dùng có thể nhập đoạn văn bản dài bất kỳ để tạo ra file audio hoàn chỉnh bằng bản thân giọng đã clone đó (chức năng Text-to-Speech bằng cloned voice ngay tại Voice Studio).

### Tích Hợp Với Pipeline
- **D-09:** Giọng clone **xuất hiện trong dropdown TTS tab** của Editor, cùng danh sách với Edge TTS, gTTS, ElevenLabs. User tạo giọng ở Voice Studio → dùng luôn khi lồng tiếng.
- **D-10:** **Voice Design & Chuyên sâu** — Thiết kế tab "Thiết kế giọng" với giao diện chọn vùng miền (Bắc/Trung/Nam) sử dụng cấu trúc **"Chip/Pill selection"** giúp trực quan, nhanh gọn như CapCut.

### Trải Nghiệm Giao Diện Khác
- **D-11:** **Quản lý Loading** — Sử dụng thanh tiến trình tuyến tính (Linear progress bar có %) kết hợp status text thân thiện trên UI. Các log kĩ thuật chi tiết (như extract, generate embedding...) sẽ **được ghi ngầm vào file log**, không hiện trên UI.

### Agent's Discretion
- Chi tiết UI layout (spacing, button styling) theo design system hiện có
- Xử lý lỗi khi OmniVoice chưa cài hoặc model chưa download

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OmniVoice Model
- `https://huggingface.co/splendor1811/omnivoice-vietnamese` — Repo mô hình OmniVoice tiếng Việt.
- Tích hợp bộ tính năng đầy đủ: Text-to-Speech (TTS), Voice Clone, Tùy chỉnh giọng Bắc/Trung/Nam, và các parameter chuyên sâu cho ngôn ngữ tiếng Việt.

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
- OmniVoice Vietnamese: Hỗ trợ tạo giọng theo văn bản (TTS), Clone giọng zero-shot từ audio 3-10s.
- Tùy chỉnh vùng miền: Giao diện chọn giọng Bắc, Trung, Nam trực tiếp.
- Output audio: 24kHz WAV, các parameter chuyên dụng tối ưu tiếng Việt (speed, pitch, emotion, v.v.).

</specifics>

<deferred>
## Deferred Ideas

- Todo: Redesign app using unified core technology like CapCut (chuyển vào backlog, không đưa vào scope Phase 10).
- Export/import voice profile (chia sẻ giọng clone giữa các máy). Giữ nguyên local-only cho Phase 10.
- Record audio trực tiếp từ micro trên UI.
- Voice fine-tuning (train thêm với nhiều data).

</deferred>

---

*Phase: 10-voice-clone-omnivoice-integration*
*Context gathered: 2026-04-23*
