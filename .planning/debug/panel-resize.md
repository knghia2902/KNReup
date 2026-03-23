---
status: diagnosed
updated: 2026-03-23T23:25:00Z
---
# Panel Resize Issue - Test 8 Gap

## Root Cause
Trong Phase 1, tính năng kéo thả thay đổi kích thước các vùng (Panel resizing) chưa được hoàn thiện. Kế hoạch ban đầu (`03-PLAN.md`) không sử dụng thư viện chuyên dụng mà chỉ viết dưới dạng mã giả placeholder cho custom drag logic (`// ... (useRef + onMouseDown + onMouseMove + onMouseUp)`), dẫn đến việc Executor bỏ qua và không implement tính năng này.
Hơn nữa, thư viện `react-resizable-panels` cũng chưa được cài đặt trong `package.json`.

## Evidence
- File `src/components/layout/NLELayout.tsx` khai báo `[leftWidth, setLeftWidth]` tĩnh và các divider không hề có handler bắt event chuột (onMouseDown).
- `package.json` thiếu thư viện hỗ trợ split pane/resizable panels.
- CSS đã có class `.resize-handle` nhưng UI không phản hồi thao tác.

## Suggested Fix
1. Cài đặt thư viện `react-resizable-panels` vào dự án.
2. Sửa lại cấu trúc `src/components/layout/NLELayout.tsx` để sử dụng `PanelGroup`, `Panel`, và `PanelResizeHandle`.
3. Cập nhật `src/styles/nle-layout.css` để style các PanelResizeHandle thành 1px transparent divider đúng chuẩn `taste-skill` (chỉ hiện sáng khi hover hoặc active drag).
