# CONCERNS.md — Vấn đề & Technical Debt

## 🔒 Bảo mật

### JWT Token trong Log
- File `flask_out_debug.log` ghi lại toàn bộ JWT token trong URL query params
- Token bị lộ: `verify.php?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`
- **Rủi ro**: Bất kỳ ai có quyền đọc file log có thể impersonate user

### Token Storage
- JWT token lưu trong `localStorage` — dễ bị XSS attack
- Device token cũng trong `localStorage`
- Không có mechanism token refresh — token expire sẽ force re-login

### `fetch()` Global Override
- Toàn bộ `window.fetch` bị override để inject auth headers
- Pattern này có thể gây side effects với third-party scripts
- Không có whitelist cho domains nào cần auth headers

## ⚡ Performance

### File `main.js` quá lớn
- 2056 dòng, 78KB — single monolithic file
- Chứa mọi thứ: auth, queue, modal, blur, logo, preview, SSE, updater integration
- Không có module system (import/export)
- Khó maintain và debug

### Video Upload
- Không rõ có giới hạn file size không (frontend accepts multiple files)
- Upload đến local Flask server → lưu disk → processing
- Không có chunked upload cho file lớn

### In-Memory Queue
- Queue lưu trong memory → mất khi restart app
- Không có persistence layer

## 🏗️ Kiến trúc

### Compiled Backend Services
- 4 services compiled thành `.pyd` (Cython)
- **Không thể đọc/chỉnh sửa source code** backend
- Phải có access source code gốc để thay đổi backend logic
- Debug khó khăn — chỉ thấy output, không thấy internals

### Tight Coupling với ali33.site
- Auth, payment, update đều phụ thuộc `ali33.site`
- Nếu server down → app không dùng được (ngoại trừ processing đã queued)
- Không có offline fallback cho auth

### Hardcoded Values
- API base URL hardcoded: `https://ali33.site/videotrans/api`
- Default voice hardcoded: `'vi-VN-HoaiMyNeural'`
- Flask port hardcoded: `127.0.0.1:5000`
- Contact info (SĐT, Zalo, website) hardcoded trong HTML

## 🔄 Auto-Update Concerns

### Update Loop
- Log cho thấy app bị update loop: cập nhật → restart → lại cập nhật
- Nhiều lần `apply_update.ps1` được triggered liên tiếp (09:49 → 09:50 → 09:50 → 09:51 → 09:52 → 09:53)
- Có thể do version compare logic bị lỗi

### Security Risk
- Update download từ URL không verify integrity trước khi apply
- Chỉ có public key (`update_signing_public.pem`) nhưng thiếu rõ ràng verification flow
- PowerShell script chạy với quyền hiện tại của user

## 🐛 Known Issues

### Từ conversation history
- **Subtitle language**: Phụ đề có thể hiển thị sai ngôn ngữ (không phải tiếng Việt)
- **Video zoom**: Preview video có thể bị zoom quá mức
- **Subtitle position**: Thiếu control rõ ràng cho vị trí phụ đề

### Frontend
- `favicon.ico` bị 404 (thiếu file)
- HTML entity encoding không nhất quán (một số chỗ dùng entity, một số chỗ UTF-8 trực tiếp)
- `escapeHtml()` function được define 2 lần (trong `main.js` và `process.js`)

## 📋 Technical Debt

| Mức độ | Vấn đề | Đề xuất |
|---|---|---|
| 🔴 Cao | main.js monolithic 2000+ dòng | Tách thành modules (ES modules hoặc separate files) |
| 🔴 Cao | Không có automated tests | Thêm unit tests cho frontend logic |
| 🟡 Trung bình | JWT token lộ trong log | Mask token trong log output |
| 🟡 Trung bình | Update loop bug | Fix version comparison logic |
| 🟡 Trung bình | In-memory queue | Thêm persistence (SQLite/JSON file) |
| 🟢 Thấp | favicon.ico 404 | Thêm favicon |
| 🟢 Thấp | Duplicate utility functions | Consolidate vào shared utils |
