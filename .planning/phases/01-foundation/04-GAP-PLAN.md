---
gap_closure: true
wave: 1
autonomous: true
variables: {}
depends_on: []
files_modified:
  - package.json
  - src/components/layout/NLELayout.tsx
  - src/styles/nle-layout.css
---

# Phase 01 Gap Closure: Panel Resizing (Test 8)

<objective>
Fix the panel resizing functionality in the NLE layout by installing and implementing `react-resizable-panels`.
</objective>

<must_haves>
- The left, center, right, and bottom timeline panels must be scalable by dragging their divider edges.
- The `react-resizable-panels` library must be integrated.
- The resize handles must match the dark glassmorphism design (1px subtle divider that lights up on hover/active).
</must_haves>

## Tasks

<task id="4.1">
<title>Install react-resizable-panels and refactor NLELayout</title>
<read_first>
- package.json
- src/components/layout/NLELayout.tsx
- src/styles/nle-layout.css
- .planning/debug/panel-resize.md
</read_first>
<action>
1. Mở terminal và chạy lệnh để cài đặt thư viện: `npm install react-resizable-panels`

2. Sửa lại `src/components/layout/NLELayout.tsx` để thay thế cấu trúc lưới tĩnh hiện tại bằng cấu trúc của `PanelGroup`. 
- Sử dụng `import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";`
- Thay vì truyền `width`/`height` inline tĩnh, hãy bọc `nle-workspace` thành một `PanelGroup direction="vertical"`.
- Lớp trên cùng (workspace) gồm trái, giữa, phải được bọc trong một `PanelGroup direction="horizontal"`.
- Giữa các vùng, sử dụng component `<PanelResizeHandle className="resize-handle resize-handle-x" />` (hoặc `-y` cho chiều dọc).

3. Chỉnh sửa `src/styles/nle-layout.css` để xoá các thiết lập width tĩnh (`.nle-left`, `.nle-center`, `.nle-right`) và định nghĩa CSS chuẩn cho phần `ResizeHandle`.
- `PanelResizeHandle` tự động lấy width/height từ parent khi dùng flex. Hãy style sao cho divider rộng `4px` nhưng đường kẻ thực tế (pseudo-element `::after`) chỉ `1px` để dễ bấm.
</action>
<acceptance_criteria>
- `package.json` contains `"react-resizable-panels"`
- `src/components/layout/NLELayout.tsx` contains `PanelGroup` and `PanelResizeHandle`
- `src/styles/nle-layout.css` correctly styles `.resize-handle` specifically for standard drag-drop behavior
</acceptance_criteria>
</task>

## Verification
1. Mở app chạy bằng lệnh `npm run tauri dev`.
2. Di chuyển chuột vào vùng giữa Timeline và Toolbar, chuột phải chuyển thành mũi tên 2 chiều, nhấp kéo lên/xuống mượt mà.
3. Di chuyển chuột vào các ranh giới dọc giữa Sidebar (Preview) và Center, nhấp chuột và kéo mượt mà.
