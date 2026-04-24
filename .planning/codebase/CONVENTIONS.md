# Coding Conventions - KNReup

Tài liệu này quy định các tiêu chuẩn code và phong cách lập trình được áp dụng trong dự án.

## 1. Frontend (TypeScript/React)
- **Kiểu dữ liệu:** Ưu tiên sử dụng `interface` cho định nghĩa object, `type` cho union/intersection. Bật chế độ `strict` trong TS.
- **Components:** 
  - Sử dụng Function Components và Hooks.
  - Mỗi file một component chính.
  - Tách logic phức tạp ra Custom Hooks.
- **State Management:**
  - State cục bộ: `useState`.
  - State toàn cục hoặc chia sẻ: `Zustand`. Tránh sử dụng Context API cho các dữ liệu thay đổi thường xuyên.
- **Đặt tên:**
  - Component: `PascalCase` (v dụ: `SubtitleEditor.tsx`).
  - Hooks: `use` prefix (ví dụ: `usePipeline.ts`).
  - Variables/Functions: `camelCase`.

## 2. Backend (Python/FastAPI)
- **Style Guide:** Tuân thủ [PEP 8](https://www.python.org/dev/peps/pep-0008/).
- **Type Hinting:** Sử dụng Type Hints cho tất cả các tham số hàm và giá trị trả về để tăng tính minh bạch và hỗ trợ IDE.
- **Async:** Sử dụng `async/await` cho các tác vụ I/O (API calls, file reading).
- **Error Handling:** 
  - Sử dụng `HTTPException` của FastAPI để trả về lỗi cho frontend.
  - Luôn log lỗi chi tiết tại server qua `logger_setup.py`.

## 3. CSS & Styling
- **Thiết kế:** Tuân thủ `design-system.css`. Sử dụng CSS Variables cho màu sắc, khoảng cách.
- **Bố cục:** Ưu tiên Flexbox và CSS Grid.
- **Đơn vị:** Sử dụng `rem` hoặc `px` tùy theo mục đích (ưu tiên `rem` cho font-size).

## 4. Giao tiếp API (Frontend ↔ Sidecar)
- **Endpoint:** Luôn có prefix `/api/`.
- **Response Format:** JSON object. Ví dụ: `{ "status": "success", "data": ... }` hoặc lỗi `{ "detail": "Error message" }`.
- **Progress Streaming:** Sử dụng SSE (Server-Sent Events) cho các tác vụ tốn thời gian.

## 5. Chú thích (Commenting)
- Chú thích bằng tiếng Việt hoặc tiếng Anh (ưu tiên tiếng Việt cho các logic nghiệp vụ phức tạp).
- Sử dụng JSDoc cho các function quan trọng trong TS.
- Sử dụng Docstrings cho các class/function trong Python.
