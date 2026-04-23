# Phase 12: Remove Voice Clone & Design Features - Context

**Gathered:** 2026-04-23
**Status:** Planning

<domain>
## Phase Boundary
Gỡ bỏ hoàn toàn các tính năng sao chép giọng nói (Voice Clone) và thiết kế giọng nói (Voice Design) thừa hưởng từ nền tảng k2-fsa/OmniVoice gốc.
Tuy nhiên, giữ lại mô hình `splendor1811/omnivoice-vietnamese` và gói pip `omnivoice` để sử dụng thuần túy như một Text-to-Speech (TTS) engine thông thường.
</domain>

<decisions>
## Implementation Decisions

### 1. UI (Frontend)
- Xóa `CloneTab.tsx` và `DesignTab.tsx` khỏi `src/components/tools/voicestudio/`.
- Xóa các tham chiếu đến các tab Clone/Design trong `VoiceStudioWindow.tsx`. Giao diện lúc này chỉ nên tập trung vào TTS và Lịch sử (History).
- (Tuỳ chọn) Nếu `VoiceStudioWindow` chỉ còn một tab chức năng chính (TTS) và 1 HistoryPanel, xem xét tinh chỉnh lại cấu trúc hiển thị cho gọn gàng (có thể bỏ thanh tab).

### 2. State & API (Zustand)
- Xóa các hàm liên quan đến clone và design trong `useVoiceStudioStore.ts` (ví dụ `cloneVoice` và `designVoice`, cùng các state liên quan nếu có).

### 3. Backend (Python sidecar)
- Xóa các endpoint xử lý Clone và Design trong `app/routes/voice_studio.py` (nếu không được dùng nữa).
- Giữ nguyên `app/engines/tts/omnivoice_engine.py` và đường dẫn tải mô hình `splendor1811/omnivoice-vietnamese`. Đảm bảo luồng tạo giọng cơ bản (TTS) vẫn hoạt động hoàn hảo.
- Xóa hàm sinh giọng clone, sinh giọng từ mô tả (design) trong các class (nếu có) để dọn dẹp mã nguồn. (Hàm `generate_from_audio` hoặc `generate_from_description` trong `omnivoice_engine.py`).

</decisions>

<canonical_refs>
## Canonical References
No external specs.
</canonical_refs>

---
*Phase: 12*
*Context gathered: via PRD / User Prompts*
