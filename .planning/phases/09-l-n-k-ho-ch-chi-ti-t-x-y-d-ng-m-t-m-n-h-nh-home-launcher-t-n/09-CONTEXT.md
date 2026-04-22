# Phase 09 Context: Home Launcher, Login & Tools Flow

## Decisions
- **Khởi động & Quản lý Cửa sổ:** Mô phỏng flow của CapCut. Editor sẽ được khởi chạy trong một cửa sổ hoàn toàn mới và độc lập so với Home Launcher.
- **Cơ chế Login (Authentication):** Áp dụng mô hình **Guest Mode**. Người dùng có thể mở app, tạo dự án và vào Editor mà không cần đăng nhập. Chỉ yêu cầu Login đối với các tính năng trả phí, AI (Voice Clone, dịch AI Cloud) hoặc Export nâng cao.
- **Giao diện Công cụ Phụ:** Khi người dùng click vào các tiện ích như Downloader, Voice Clone từ Home Launcher, chúng sẽ mở ra dưới dạng các cửa sổ phụ độc lập (Popup Window).
- **Recent Projects:** Danh sách dự án gần đây sẽ hiển thị theo dạng lưới (Grid) cùng với Thumbnail minh họa cho dự án.

## Specifics
- Trải nghiệm mở ứng dụng (Home Launcher) cần phải nhanh và tách biệt hoàn toàn state so với NLE Editor.
- UI Home Launcher yêu cầu thiết kế trực quan, chia rõ các khối: Tạo dự án mới, Công cụ phụ (Tools), Dự án gần đây (Recent).

## Code Context
- **Tauri Windows API:** Triển khai cơ chế Đa cửa sổ (`WebviewWindow` hoặc cấu hình `tauri.conf.json`) cho Launcher, Editor và Tools.
- **Store / State:** `useProjectStore.ts` cần đảm nhiệm việc cung cấp danh sách Dự án gần đây (Recent Projects) kèm đường dẫn ảnh Thumbnail ra màn hình Launcher.
- **Auth Guard:** Cần xây dựng các wrapper components hoặc middleware (ví dụ: `RequireAuth`) bọc lấy các nút bấm sử dụng tính năng trả phí trên Launcher và Editor.

## Canonical Refs
- `.planning/ROADMAP.md` (Phase 09)
- `.planning/references/layout-spec.md` (Hướng dẫn thiết kế Layout chung)
