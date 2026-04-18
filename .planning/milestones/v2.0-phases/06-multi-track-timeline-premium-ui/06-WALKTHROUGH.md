# Walkthrough: Phase 06 - Multi-track Timeline Premium UI

Tính năng Multi-track Timeline (Giao diện Timeline hạng nặng) đã hoàn thiện xuất sắc và vượt qua vòng UAT khắc nghiệt nhất.

## Tính năng chính
- **Cấu trúc 4 Track:** Video, TTS (Text-to-Speech), SUB (Subtitle), và BGM (Background Music) được vẽ chuẩn xác.
- **Waveform:** Track Video và TTS dùng `wavesurfer.js` render theo thời gian thực rất mềm mượt. BGM cũng đã hỗ trợ waveform.
- **Dynamic Playhead:** Thanh Đỏ Playhead sử dụng RequestAnimationFrame 60-FPS đem lại trải nghiệm di chuyển siêu mượt, không làm lag các Component xung quanh.
- **Tauri Integration:** Xử lý Drag-drop Native của Tauri giúp thả video từ bên ngoài vào thả ga. Hệ thống Save File `.kn` Project được config bằng Native File System (plugin-fs).

## Danh sách Gaps đã giải quyết gọn gàng
1. **Drag-drop lỗi:** Bổ sung `tauri://drag-drop` catch event.
2. **Playhead & Shortcut C đứt bóng:** Build PointerEvent cho click background Timeline để seek video thần tốc; Playhead theo đúng Cursor; Phím C cắt Sub ngon lành.
3. **Zoom Limit:** Gỡ hard limit scale `Math.max(1)` xuống `0.1` để nén Timeline lại cho video dài.
4. **CSS Overlap (Cột dọc màn hình):** Dọn dẹp design-system.css cũ rác rưởi trỏ sai vị trí `left: 30%`.
5. **Subtitle Trim Overlap:** Dựng tường chặn (Clamp) `minAllowableStart` và `maxAllowableEnd` khiến kéo Sub không bao giờ đẩy lệch frame kế bên.

*Toàn bộ 6/6 bài test được User nghiệm thu PASS! Phase 6 khép lại.*
