---
status: testing
phase: 09-home-launcher
source:
  - 09-01-SUMMARY.md
  - 09-02-SUMMARY.md
  - 09-03-SUMMARY.md
  - 09-04-SUMMARY.md
started: 2026-04-22T20:49:50+07:00
updated: 2026-04-22T20:49:50+07:00
---

## Current Test

number: 1
name: App khởi động vào màn hình Home Launcher
expected: |
  Khi mở app (npm run tauri dev), app phải hiển thị màn hình Home Launcher thay vì vào thẳng Editor.
  Màn hình Launcher có: tiêu đề "kn reup", nút "Tạo dự án mới", phần "Công cụ" (Downloader, Voice Clone), và phần "Dự án gần đây".
awaiting: user response

## Tests

### 1. App khởi động vào màn hình Home Launcher
expected: Khi mở app, hiển thị Home Launcher với hero section, tools grid, recent projects — không vào thẳng Editor.
result: [pending]

### 2. Tạo dự án mới từ Launcher
expected: Nhấn "Tạo dự án mới" → mở cửa sổ Editor mới. Dự án mới xuất hiện trong danh sách "Dự án gần đây" trên Launcher.
result: [pending]

### 3. Nút Home trên Titlebar Editor
expected: Trong cửa sổ Editor, Titlebar hiển thị nút Home (biểu tượng nhà). Nhấn vào → focus về cửa sổ Launcher.
result: [pending]

### 4. Downloader mở thành cửa sổ popup riêng
expected: Trên Titlebar Editor, tab "Downloader" có icon popup nhỏ. Nhấn vào → mở cửa sổ Downloader riêng biệt (không phải tab trong Editor).
result: [pending]

### 5. Tìm kiếm dự án trên Launcher
expected: Nhập text vào ô tìm kiếm trên Launcher → danh sách "Dự án gần đây" lọc theo tên dự án real-time.
result: [pending]

### 6. Dark/Light Mode toggle trên Launcher
expected: Launcher có nút chuyển theme (biểu tượng mặt trời/trăng). Nhấn → chuyển đổi giữa dark và light mode, cả Launcher và Editor đều đổi theme.
result: [pending]

### 7. Version hiển thị đúng v1.0.1
expected: Cả Launcher và Editor đều hiển thị version "v1.0.1" (ở header Launcher và Titlebar Editor).
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
