# Lỗi Upload File và Thiết kế Overlay cản trở UX

## Triệu chứng
1. Không thể kéo thả file video vào Media Bin để kích hoạt quá trình xử lý. Trình duyệt không nhận diện file hoặc hành vi bị chặn.
2. Thiết kế `ProcessingOverlay` là một màn hình che mờ toàn bộ giao diện (Blocking UI), khiến người dùng không thể tiếp tục thao tác với các video khác trong NLE Layout, đi ngược lại thiết kế "Batch Processing" của một ứng dụng Desktop.

## Nguyên nhân gốc rễ (Root Cause)

### 1. Vấn đề Upload / File Drop trong Tauri
- KNReup là ứng dụng Tauri (Desktop). Việc kéo thả file từ OS vào cửa sổ Tauri sẽ kích hoạt native event (`tauri://file-drop`), trả về đường dẫn tuyệt đối (Absolute Path) của file trên máy tính (vd: `C:\Users\Videos\test.mp4`).
- Hiện tại, frontend đang dùng event `onDrop` của HTML5 để lấy đối tượng `File` và push qua HTTP FormData (Multipart). Việc này có 2 điểm yếu chí mạng:
  - Khó bắt event chuẩn xác nếu Tauri chặn HTML drop.
  - Phải tải file rất lớn (Gigabytes) vào RAM của Webview để gửi HTTP POST sang Python backend (`localhost`). Vô cùng vi phạm hiệu năng.

### 2. Thiết kế Blocking Overlay sai lầm
- Thay vì xử lý ngầm (background) và hiển thị tiến trình ở một góc (vd: Toast notification hoặc Tab Monitor), quá trình Pipeline hiện đang che toàn bộ màn hình chặn MỌI thao tác tiếp theo.
- Điều này ngăn chặn việc "thả video thứ 2, thứ 3" vào hàng chờ.

## Giải pháp (Gap Closure)

1. **Backend (`pipeline.py`)**:
   - Sửa đổi endpoint `/api/pipeline/process` và `/transcribe` để NHẬN một JSON chứa `video_path: str` (Absolute path).
   - Python sẽ đọc trực tiếp đường dẫn file từ ổ đĩa thay vì ép Frontend phải upload qua HTTP. Tăng tốc độ đọc lên MAX.

2. **Frontend (File Drop logic)**:
   - Tích hợp `@tauri-apps/api/event` (`listen('tauri://file-drop')`) ở cấp global `App.tsx` hoặc `MediaBin`.
   - Bắt đường dẫn tuyệt đối tĩnh và gửi sang REST API dưới dạng string `{"video_path": "C:/..."}`.

3. **Frontend (Bỏ Overlay, tạo dạng Job Control / Toast)**:
   - Xoá Component `ProcessingOverlay.tsx`.
   - Chuyển thanh tiến độ vào một thanh Floating Toast ở góc phải dưới, thu nhỏ linh hoạt. Hoặc tích hợp thẳng vào Tab `Monitor` của NLE Layout.
   - Để người dùng hoàn toàn tự do chỉnh sửa hoặc ném file khác tiếp vào hệ thống.
