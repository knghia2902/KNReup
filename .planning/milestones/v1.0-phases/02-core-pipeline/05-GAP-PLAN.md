---
phase: 2
plan: 5
title: "Gap Closure: Local File Access & Background Job Monitor"
wave: 3
depends_on: [4]
files_modified:
  - python-sidecar/app/routes/pipeline.py
  - src/App.tsx
  - src/components/editor/UploadPanel.tsx
  - src/hooks/usePipeline.ts
  - src/components/editor/JobMonitor.tsx
  - src/components/editor/JobMonitor.css
requirements_addressed: [R1.8]
autonomous: true
---

# Plan 05: Gap Closure - Local File Access & Background Job Monitor

<objective>
Refactor quá trình nhận file: Tận dụng cơ chế Desktop app của Tauri để gửi "Đường dẫn File" sang Python backend thay vì Upload file binary qua HTTP.
Thay thế Blocking Overlay rườm rà bằng một Background Job Monitor (Float/Toast) để hỗ trợ Batch Processing (xử lý nhiều video cùng lúc).
</objective>

## Tasks

<task id="5.1">
<title>Refactor Backend để đọc Data Path</title>
<read_first>
- python-sidecar/app/routes/pipeline.py
</read_first>
<action>
Sửa API `POST /api/pipeline/process`:
- Thay payload từ `UploadFile` thành JSON chứa: `{"video_path": "string", "config": {...}}`.
- Xoá quá trình `tempfile` bóc file upload. Bypass thẳng `video_path` vào `PipelineRunner.run()`.
- Xoá endpoint `/process-simple` nếu không cần thiết.

Sửa API `/api/pipeline/transcribe`:
- Tương tự, nhận JSON: `{"video_path": "string", "language": "en"}`. Không dùng UploadFile.
</action>
<acceptance_criteria>
- Endpoints trong `pipeline.py` sử dụng class `BaseModel` (ví dụ `ProcessRequest`, `TranscribeRequest`) chứa `video_path`.
- Không còn type `UploadFile` hay module `python-multipart` đính kèm cho Pipeline.
- PipelineRunner và WhisperASR đọc được video từ Path gốc trên Windows/Mac.
</acceptance_criteria>
</task>

<task id="5.2">
<title>Refactor Frontend dùng Native Tauri File Drop</title>
<read_first>
- src/App.tsx
- src/components/editor/UploadPanel.tsx
</read_first>
<action>
1. Cài đặt dependency: `npm install @tauri-apps/api` (nếu chưa có).
2. Xoá HTML5 Drag-Drop logic, dùng `listen('tauri://file-drop', (event) => {...})` từ `@tauri-apps/api/event`.
3. Event Tauri file-drop payload chứa mảng các chuỗi đường dẫn `[ "C:\Videos\a.mp4" ]`.
4. Gọi hàm `startPipeline(filePath, config)` thay vì truyền đối tượng `File`.

Update `usePipeline.ts`:
- Gửi fetch `POST` dạng `application/json` chứa `{ "video_path": filePath, "config": config }`.
</action>
<acceptance_criteria>
- Hàm `startPipeline` trong `usePipeline.ts` nhận file path dưới dạng string.
- App sử dụng listener từ `@tauri-apps/api/event` để catch file drop, cho phép bắt chính xác thư mục local.
</acceptance_criteria>
</task>

<task id="5.3">
<title>Tạo Background Job Monitor UI (xoá Processing Overlay)</title>
<read_first>
- src/components/editor/ProcessingOverlay.tsx (sẽ xoá)
- src/App.tsx
- src/styles/design-system.css
</read_first>
<action>
1. Xoá `ProcessingOverlay.tsx` và `ProcessingOverlay.css`.
2. Tạo mới `JobMonitor.tsx` (kiểu Float Toast notification nhỏ gọn, ghim gõ phải dưới màn hình).
3. Thiết kế theo taste-skill: 
   - Nền glassmorphism, viền 1px tinh tế.
   - Thanh tiến độ CSS cực mảnh.
   - Thông tin: Tên file (basename), trạng thái hiện tại, Text nhỏ % tiến độ.
   - Nút xoá (X/Cancel).
4. Sửa `App.tsx` thay Overlay bằng `JobMonitor` nổi lên mượt mà. Người dùng vẫn thao tác được các NLE layouts.
</action>
<acceptance_criteria>
- Không còn `ProcessingOverlay.tsx`.
- Component `JobMonitor` không block màn hình (position fixed, pointer-events auto).
- Hỗ trợ hiển thị pipeline state mà không gây đứng UI chính. 
- Taste-skill compliant components (dùng Phosphor Icons).
</acceptance_criteria>
</task>
