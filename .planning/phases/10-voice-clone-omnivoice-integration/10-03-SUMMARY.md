---
phase: 10
plan: 3
subsystem: tts
tags: [integration, clone, dropdown]
requires: [omnivoice-engine]
provides: [cloned-voice-selection]
affects: [AudioTab, TextTab]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - src/components/properties/AudioTab.tsx
    - src/components/properties/TextTab.tsx
    - src/stores/useProjectStore.ts
    - src/lib/sidecar.ts
decisions:
  - "Updated custom_voice_profiles type in project store to any[] to handle object data representing full voice profiles."
  - "Integrated window focus event listener to auto-refresh cloned voices seamlessly."
metrics:
  duration: "10 mins"
  completed_date: "2026-04-23"
---

# Phase 10 Plan 03: TTS Pipeline Integration — Giọng Clone trong Editor Dropdown Summary

Tích hợp thành công giọng clone vào các tab Audio và Text của Editor, cho phép user chọn giọng đã tạo từ OmniVoice engine trực tiếp.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Thay đổi kiểu dữ liệu của `custom_voice_profiles`**
- **Found during:** Phân tích dữ liệu trả về từ API `getProfiles`.
- **Issue:** API backend trả về danh sách đối tượng thay vì chuỗi đơn giản, dẫn đến React render `[object Object]` nếu không thay đổi logic.
- **Fix:** Đã cập nhật Interface trong `src/stores/useProjectStore.ts` sang `any[]`, điều chỉnh phương thức trong `sidecar.ts` và logic mapping tùy chọn trong `AudioTab.tsx`, `TextTab.tsx`.
- **Files modified:** `src/stores/useProjectStore.ts`, `src/lib/sidecar.ts`, `src/components/properties/AudioTab.tsx`, `src/components/properties/TextTab.tsx`

**2. [Rule 3 - Refactor] Loại bỏ TTSTab.tsx do không tồn tại**
- **Found during:** Tìm kiếm tệp tin `src/components/properties/TTSTab.tsx`.
- **Issue:** Tệp `TTSTab.tsx` không được tìm thấy trong codebase. Thay vào đó, thiết lập TTS được đặt trong `AudioTab.tsx` và `TextTab.tsx`.
- **Fix:** Đã áp dụng các thay đổi về tuỳ chọn giọng clone lên cả hai tệp `AudioTab.tsx` và `TextTab.tsx`.

## Workflow & Implementation Details

- **Tự động refresh**: Đã thiết lập `window.addEventListener('focus', loadProfiles)` trong `AudioTab.tsx` để danh sách giọng tự động được cập nhật khi người dùng tạo giọng clone ở Home Launcher và quay trở lại Editor.
- **Visual indicator**: Mỗi giọng clone đều có tiền tố 🎤 bên cạnh để phân biệt dễ dàng trong danh sách dropdown.
- **Quản lý state**: Lưu trực tiếp cấu hình `custom_voice_profiles` qua `useProjectStore` để đảm bảo đồng bộ hóa thông suốt trên toàn bộ ứng dụng.

## Threat Flags
Không phát hiện lỗ hổng hay rủi ro bảo mật mới trong quá trình sửa đổi.
