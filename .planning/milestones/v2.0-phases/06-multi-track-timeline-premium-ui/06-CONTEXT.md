---
status: context_gathered
phase: 6
name: Timeline + Premium UI
updated: 2026-04-04T14:45:00+07:00
---

# Phase 6 Context: Timeline + Premium UI

This document captures the physical implementation decisions made during the user discussion phase. Downstream agents (researcher, planner) must follow these strict constraints.

## 1. Tương tác Subtitle Track (Split/Merge/Trim)
- **Kéo đổi thời lượng (Trimming):** Tương tác **Normal Trim** (để rỗng khoảng trống, không đẩy/Ripple kéo theo toàn bộ các block đằng sau).
- **Cắt block (Split - Shortcut C):** Việc cắt ngang 1 block phụ đề sẽ "chẻ đôi" nội dung Text bên trong theo đúng tỷ lệ chiều dài thời lượng cắt.
- **Gộp block (Merge):** Khi nối 2 đoạn text của 2 block liền kề, tự động chèn thêm dấu Xuống dòng (Line break / Enter).
- **Tránh kẹt block (Minimum limit):** UI Track Subtitle phải khóa độ dài (width) tối thiểu để người dùng không kéo block về sát vạch `0s` làm biến mất hoặc không click được.

## 2. Render Video Thumbnail 
- **Mật độ (Density):** Thumbnail sinh **Dynamic** (chuẩn CapCut/Premiere). Bất cứ khi nào user Zoom In trục thời gian, hệ thống tự động load thêm ảnh Thumbnail lấp vào các khoảng trống.
- **Lưu trữ (Cache):** Lưu ảnh Thumbnail cache cứng vào chung folder lưu trữ Project. Đóng/Mở project không bị fetch load lại, ảnh tức thì hiển thị.
- **Chất lượng:** Render thumbnail **mờ / độ phân giải thấp** (Low-res) để max hiệu năng tốc độ chạy ngầm và giảm tải VRAM/SSD.
- **Layout:** Block Video Track phải chừa **viền ngang 10px** trong suốt trên cùng để đẩy nhãn tên video (`name.mp4`). Ảnh không lấp tràn 100% block.

## 3. Waveform Audio & BGM
- **Render Behavior:** Sóng âm (`wavesurfer.js`) của Audio tĩnh 100%. **Chỉ render đúng 1 lần từ file gốc**. Các thay đổi Slider/Ducking làm to nhỏ Volume từ giao diện sẽ không tác động đến đồ thị sóng (không vẽ lại sóng realtime).

## 4. Multi API Key Management
- **Giao diện (UI):** Dàn tính năng thiết lập List API Keys, chuyển Models, xem mức dùng (Quota) phải đặt vào trong 1 **Tab Menu "Settings" độc lập tĩnh** trên Titlebar, tuyệt đối không dùng cửa sổ nổi (Popup Modal).

## 5. Baseline Decisions (From Current Roadmap)
- Dùng thư viện `wavesurfer.js` cho waveform.
- Thumbnail xử lý chạy ngầm liên tục bằng `ffmpeg`.
- Không sử dụng `snap-to-grid` nam châm hay collision logic trong các đoạn kéo v1.
- Hỗ trợ các phím tắt phổ thông: Space (Play), Left/Right (Dò Frame), C (Split Blade), V (Select Pointer), Ctrl+S, Ctrl+Z.
