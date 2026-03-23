# TESTING.md — Testing & Quality Assurance

## Hiện trạng testing

### Automated Tests
- **Không tìm thấy test files** trong codebase
- Không có test framework (pytest, jest, etc.) được cài đặt
- Không có CI/CD pipeline

### Manual Testing
- Ứng dụng chạy local → kiểm tra UI trực tiếp
- Log output qua `flask_out_debug.log`
- Console logs frontend qua DevTools (pywebview)

## Debug Tools hiện có

| Tool | Mô tả |
|---|---|
| `flask_out_debug.log` | Flask server log (HTTP requests, errors, external API calls) |
| `bootstrap_launcher.log` | Launcher startup log |
| `update_relaunch.log` | Auto-update process log |
| Browser DevTools | Có thể truy cập qua pywebview debug mode |

## Cách kiểm tra thủ công

### Backend Status
- Trang chính hiển thị card "Trạng thái backend":
  - GPU / CPU mode
  - Whisper backend
  - Demucs backend
  - Video encoder (NVENC vs libx264)

### Auth Flow
- Đăng nhập → kiểm tra token verify → hiển thị user info
- Token hết hạn → 401 → redirect login
- Subscription hết hạn → 403 → lock UI

### Video Processing
- Upload video → xem upload status
- Mở modal config → kiểm tra các tùy chọn
- Bắt đầu xử lý → xem progress bar, SSE log
- Kết quả → xem video output, subtitle list, download

## Lỗ hổng testing

> [!WARNING]
> Không có automated tests cho bất kỳ phần nào của ứng dụng.

- Backend services (`.pyd`) không thể test trực tiếp vì compiled
- Frontend logic phức tạp (2056 dòng main.js) không có unit tests
- API endpoints không có integration tests
- Auth flow không có security tests
- Payment flow không có end-to-end tests
