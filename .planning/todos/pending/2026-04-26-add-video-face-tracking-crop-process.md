---
created: 2026-04-26T02:02:01+07:00
title: Add video face tracking crop process
area: video-processing
files: []
---

## Problem

Cần một công cụ để crop video tự động dựa trên vị trí khuôn mặt người (face tracking) từ một video gốc để tạo thành các video mới (ví dụ như video định dạng dọc cho TikTok/Shorts).

## Solution

Thêm một module/tool xử lý video hỗ trợ:
- Dùng AI/Computer Vision (ví dụ: OpenCV, MediaPipe, hoặc YOLO face) để nhận diện và theo dõi tọa độ khuôn mặt người trong từng khung hình video.
- Tự động tính toán crop bounding box sao cho khuôn mặt luôn luôn nằm trong khoảng giữa của khung hình cắt.
- Dùng FFmpeg kết hợp lệnh cắt video (crop filter) dựa vào tọa độ đã track để render video gốc thành video mới (thường là định dạng dọc 9:16).
