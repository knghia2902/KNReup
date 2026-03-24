---
status: complete
phase: 03-nle-editor-ui
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-03-24T03:00:00Z
updated: 2026-03-24T03:21:39Z
---

## Current Test

[testing complete]

## Tests

### 1. Khởi động lại toàn bộ hệ thống (Cold Start Smoke Test)
expected: Tắt toàn bộ server/service đang chạy. Xóa các trạng thái tạm (temp DB, bộ nhớ đệm, file lock). Mở lại ứng dụng từ đầu. Server khởi động không báo lỗi màu đỏ nào, các tiến trình seed/migration chạy hoàn tất và giao diện load lên hiển thị đúng dữ liệu khởi tạo. Đoạn test này đảm bảo ứng dụng không lỗi nếu người dùng cài đặt mới.
result: issue
reported: "temp DB, bộ nhớ đệm, file lock xóa ở đâu, Import video chạy xong là hết không có gì xảy ra nữa"
severity: major

### 2. Giao diện tổng quan & Theme
expected: App hiển thị theo theme màu be (beige) ấm áp tối giản. Giao diện được chia đúng cấu trúc: Thanh tiêu đề (Titlebar), Thanh điều hướng (Sidebar), Khay chứa media (Media Bin ở trái), Khung xem video (Video Preview ở giữa), Bảng thuộc tính (Properties Panel ở phải) và Timeline (ở dưới cùng).
result: pass

### 3. Các Tab ở Bảng Thuộc Tính (Properties Panel)
expected: Khi click chuyển qua lại giữa các tab STYLE, TTS, SUB, và OUT ở Bảng Thuộc Tính bên phải, nội dung thiết lập bên trong sẽ chuyển đổi mượt mà tương ứng.
result: issue
reported: "Đúng nhưng không dùng được"
severity: major

### 4. Hiển thị Khay chứa Media (Media Bin)
expected: Media Bin hiện ra phần khung nét đứt 'Drop media'. Nếu có file được chọn thì file đó hiển thị dưới dạng thẻ (item) có đầy đủ tên file, đường viền thumbnail và nhãn dán RDY gọn gàng.
result: issue
reported: "Chỉ import được 1 file nếu import file khác thì file cũ mất"
severity: major

### 5. Khung xem Video & Trình điều khiển
expected: Khu vực Video Preview có các nút điều khiển tối giản (nút Play, thanh trượt thời gian, dãy số thời gian). Khung màu đen xem video phải tự co giãn nằm gọn ở chính giữa mà không bị tràn khung.
result: issue
reported: "nút điều khiển một vài cái không dùng được"
severity: major

### 6. Thao tác điều khiển thuộc tính kết nối Store
expected: Việc kéo các thanh trượt (slider), gạt công tắc (toggle), chọn cài đặt xổ xuống (dropdown) và bảng chọn màu ở Properties Panel sẽ cập nhật trạng thái UI hiển thị trơn tru, không gặp lỗi văng app (đã được nối với Zustand).
result: issue
reported: "Hoạt động nhưng tính năng không thấy áp dụng"
severity: major

### 7. Trạng thái hiển thị ở Timeline & Phụ đề
expected: Tab Subtitle hiển thị danh sách các phân đoạn phụ đề. Tại bảng Timeline bên dưới, các khối track màu (VID, TTS, SUB, BGM) được hiển thị đúng chiều dài tỷ lệ với các phân đoạn thời gian thực tế của phụ đề.
result: issue
reported: "Vẫn đang là dữ liệu mẫu"
severity: major

## Summary

total: 7
passed: 1
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Tắt toàn bộ server/service đang chạy. Xóa các trạng thái tạm (temp DB, bộ nhớ đệm, file lock). Mở lại ứng dụng từ đầu. Server khởi động không báo lỗi màu đỏ nào, các tiến trình seed/migration chạy hoàn tất và giao diện load lên hiển thị đúng dữ liệu khởi tạo. Đoạn test này đảm bảo ứng dụng không lỗi nếu người dùng cài đặt mới."
  status: failed
  reason: "User reported: temp DB, bộ nhớ đệm, file lock xóa ở đâu, Import video chạy xong là hết không có gì xảy ra nữa"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Khi click chuyển qua lại giữa các tab STYLE, TTS, SUB, và OUT ở Bảng Thuộc Tính bên phải, nội dung thiết lập bên trong sẽ chuyển đổi mượt mà tương ứng."
  status: failed
  reason: "User reported: Đúng nhưng không dùng được"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "Media Bin hiện ra phần khung nét đứt 'Drop media'. Nếu có file được chọn thì file đó hiển thị dưới dạng thẻ (item) có đầy đủ tên file, đường viền thumbnail và nhãn dán RDY gọn gàng."
  status: failed
  reason: "User reported: Chỉ import được 1 file nếu import file khác thì file cũ mất"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "Khu vực Video Preview có các nút điều khiển tối giản (nút Play, thanh trượt thời gian, dãy số thời gian). Khung màu đen xem video phải tự co giãn nằm gọn ở chính giữa mà không bị tràn khung."
  status: failed
  reason: "User reported: nút điều khiển một vài cái không dùng được"
  severity: major
  test: 5
  artifacts: []
  missing: []

- truth: "Việc kéo các thanh trượt (slider), gạt công tắc (toggle), chọn cài đặt xổ xuống (dropdown) và bảng chọn màu ở Properties Panel sẽ cập nhật trạng thái UI hiển thị trơn tru, không gặp lỗi văng app (đã được nối với Zustand)."
  status: failed
  reason: "User reported: Hoạt động nhưng tính năng không thấy áp dụng"
  severity: major
  test: 6
  artifacts: []
  missing: []

- truth: "Tab Subtitle hiển thị danh sách các phân đoạn phụ đề. Tại bảng Timeline bên dưới, các khối track màu (VID, TTS, SUB, BGM) được hiển thị đúng chiều dài tỷ lệ với các phân đoạn thời gian thực tế của phụ đề."
  status: failed
  reason: "User reported: Vẫn đang là dữ liệu mẫu"
  severity: major
  test: 7
  artifacts: []
  missing: []
