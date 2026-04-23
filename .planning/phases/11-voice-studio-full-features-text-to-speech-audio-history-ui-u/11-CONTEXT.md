# Phase 11: Voice Studio Full Features: Text-to-Speech, Audio History, UI Upgrades - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Nâng cấp standalone popup Voice Clone (Phase 10) thành một "Voice Studio" hoàn chỉnh. Bổ sung tính năng tạo Text-to-Speech trực tiếp, lưu trữ và quản lý lịch sử các file audio đã tạo, và nâng cấp UI/UX cho toàn bộ công cụ này.
</domain>

<decisions>
## Implementation Decisions

### Tính năng Text-to-Speech
- **D-01:** Hỗ trợ tất cả các Engine (Edge, ElevenLabs, OmniVoice) ngay bên trong Voice Studio.
- **D-02:** Đồng bộ với Editor, cho phép tinh chỉnh đầy đủ (tốc độ, âm lượng, âm sắc) trực tiếp trên giao diện Voice Studio khi tạo audio.

### Quản lý Lịch sử Audio
- **D-03:** Lưu lại toàn bộ lịch sử (âm thanh đã tạo) xuống local (dưới dạng danh sách lưu trên đĩa) cho các lần mở sau.
- **D-04:** Không cung cấp nút "Gửi vào Dự án" tự động. Người dùng sẽ tự quản lý và import file vào Editor qua Media Bin một cách thủ công.

### Nâng cấp Giao diện (UI/UX)
- **D-05:** Cấu trúc thành các tab ngang chuyên biệt (Ví dụ: Voice Clone, Voice Design, Text-to-Speech).
- **D-06:** Mỗi tab sẽ chứa phần chức năng tạo mới ở trên và danh sách kết quả (History) riêng biệt ở bên dưới để dễ quản lý.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Specs
- `.planning/phases/10-voice-clone-omnivoice-integration/10-CONTEXT.md` — Các quyết định liên quan đến OmniVoice và Voice Clone.

### Existing Codebase
- `python-sidecar/app/engines/tts/omnivoice_engine.py` — Backend TTS engines.
- `src/components/downloader/DownloaderWindow.tsx` — Base template cho standalone tool window.
- `src/utils/windowManager.ts` — Quản lý cửa sổ Tauri multi-window.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DownloaderWindow` component pattern cho popup tool.
- API endpoints `tts_profiles` hiện có tại backend.

### Established Patterns
- Multi-window navigation từ Home Launcher.
- Các requests gọi Sidecar API với `useSidecar` hook.
</code_context>

<specifics>
## Specific Ideas
- Thiết kế giữ nguyên tông màu Dark/Glassmorphism giống Editor.
- Cập nhật icon của "Voice Clone" ở Home Launcher thành "Voice Studio".
</specifics>

<deferred>
## Deferred Ideas
- Bấm nút gửi thẳng vào dòng thời gian (Timeline) của Editor.
- Export/import profile.
</deferred>

---

*Phase: 11-voice-studio-full-features-text-to-speech-audio-history-ui-u*
*Context gathered: 2026-04-23*