---
status: investigating
trigger: Preview Video không đồng bộ với timeline, video trên main line không dồn về trước
updated: 2026-04-29T08:05:30+07:00
---

# Symptoms
1. Expected: Giống CapCut (dồn clip về trước khi xóa - ripple delete).
2. Actual: Preview Video không chạy, không cập nhật. Add video mới cũng không chạy. Phải reload app mới chạy. 
3. Errors: Chỉ có log `[Timeline] Restart from beginning`, `[VideoPreview] Force clear black screen`, `[BGM-DIAG] tlStart: 0, clipDur: 0`.
4. Context: Lỗi xảy ra sau khi refactor Main Track Timeline.
5. Repro 1: Thêm 1 clip, bấm play -> Preview không chạy (hiện tại đã chạy sau khi reload). Không thể split (cắt) clip được nữa.
6. Repro 2: Bấm Pause nhưng video/âm thanh vẫn tiếp tục chạy.

# Current Focus
- hypothesis: State `isPlaying` và `playheadPosition` không đồng bộ giữa `Timeline` và `VideoPreview`. Split không hoạt động có thể do ID của clip hoặc logic update trong store bị sai.
- next_action: Kiểm tra logic play/pause, logic update timeline (dồn clip), và tính năng split trong `Timeline.tsx` và `VideoPreview.tsx`.

# Evidence

# Eliminated
