---
status: investigating
trigger: "bấm cancel ở tab queue nhưng tiến trình vẫn chạy ngầm, bên dưới phần popup cũng vẫn còn chạy mình không bấm X được như hình & 'd:\\Tools\\KNReup\\image copy 3.png' và có thêm log này Each child in a list should have a unique \"key\" prop. Check the render method of TextTab."
updated: 2026-04-24
---

# Symptoms
- **Expected behavior:** Bấm cancel thì mất ở Queue và tiến trình chạy ngầm cũng phải dừng. Popup tiến trình ở dưới màn hình có thể đóng khi bấm X.
- **Actual behavior:** Bấm cancel thì mất ở Queue nhưng không có gì xảy ra, popup không đóng khi nhấn X, tiến trình ngầm vẫn tiếp tục chạy.
- **Error messages:** Trong Console F12 chỉ có warning "Each child in a list should have a unique 'key' prop. Check the render method of `TextTab`.". Trong terminal logs không có lỗi.
- **Timeline:** Trước giờ vẫn không hoạt động.
- **Reproduction:** Thêm job vào queue, sau đó vào tab queue và bấm cancel, sau đó thử bấm X trên popup (JobMonitor) bên dưới.

# Current Focus
- **hypothesis:** Logic cancel ở tab Queue chỉ xóa job trong store (frontend) nhưng không gửi request hủy tiến trình đang chạy xuống backend (python-sidecar), tương tự lỗi cancel ở JobMonitor trước đó. Đồng thời `JobMonitor` popup không đóng được do state `processing` hoặc `abortController` chưa được cập nhật hoặc reset hợp lý, và warning "unique 'key' prop" ở `TextTab` cần được fix bằng cách thêm thuộc tính `key`.
- **next_action:** gather initial evidence
