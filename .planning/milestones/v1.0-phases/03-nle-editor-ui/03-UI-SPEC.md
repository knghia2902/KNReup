# Phase 3: NLE Editor UI — Design Contract

**Source**: `d:\Tools\KNReup\knreup-complete.html`

## UI Architecture
Toàn bộ cấu trúc UI của Phase 3 PHẢI được port 1:1 từ file tĩnh `knreup-complete.html` sang các React components. KHÔNG sử dụng thư viện UI nào khác (như Material UI hay AntD) để giữ nguyên vẹn 100% bản sắc `taste-skill`.

Các module chính cần tách thành component:
1. **Titlebar** (`.tb`) -> `Titlebar.tsx`
2. **Sidebar** (`.sb`) -> `Sidebar.tsx`
3. **Media Bin** (`.mbin`) -> `MediaBin.tsx` (Thay thế UploadPanel cũ)
4. **Preview Area** (`.pvp` + `.pvbody` + `.vframe` + `.pvctrl`) -> `VideoPreview.tsx` & `VideoControls.tsx`
5. **Properties Panel** (`.pp`) -> `PropertiesPanel.tsx`
   - Chia làm các tab nhỏ: StyleTab, TTSTab, SubTab, OutTab.
   - Các controls tái sử dụng: `.psel`, `.pinp`, `.ptxt`, `.pnum`, `.pslider`, `.tog`, `.cinp`, `.pgrid`, `.chip`, `.ecard`
6. **Timeline** (`.tl`) -> `Timeline.tsx` (Dựng Layout HTML tĩnh trước, logic xử lý waveform defer sang Phase 6)

## CSS Migration Strategy
- Copy toàn bộ nội dung thẻ `<style>` từ `knreup-complete.html` vào file CSS hệ thống (ví dụ `design-system.css` và `NLELayout.css`).
- Áp dụng triệt để hệ CSS variables màu sắc (--w0, --w1, --i0, --i1...).
- Mọi **Class Names** trong HTML phải giữ nguyên vẹn (ví dụ: `tb`, `mbin`, `phd`, `mitem`, `pvp`, `procov`, `pp`, `ptabs`, `pshd`, `pr`, etc.) khi translate qua `className` của React để đảm bảo CSS ăn khớp 100%.

## Hướng dẫn cho Planner (%IMPORTANT%)
- **Nghiêm cấm** tự sáng tạo layout flexbox mới nếu nó làm sai lệch cấu trúc DOM gốc của bản HTML.
- **Nghiêm cấm** đổi tên class CSS.
- **Kế thừa Event**: Tái sử dụng lại các hook `usePipeline.ts`, `useSidecar.ts` và gán vào các nút UI mới tương ứng.
- **Lược bỏ Source cũ**: Các component cũ (`NLELayout.tsx`, `UploadPanel.tsx`, css cũ) phải được wipe/replace để dọn chỗ cho xương sống HTML mới tinh này. File HTML do user cung cấp mang tính chất Source of Truth cao nhất.
