# Phase 5 Context

**Phase Goal:** Output Advanced — Watermark + Blur + Crop + Audio Mix. Trọng tâm là hoàn thiện các tính năng đồ họa và âm thanh cho video đầu ra (Render), biến MVP thành sản phẩm có thể sản xuất nội dung lách bản quyền chuyên nghiệp.

## M2-06, M2-07: Blur (Làm mờ phụ đề)
- **Quyết định:** Người dùng sẽ **tự kéo chọn vùng Blur (Bounding Box) thủ công** trực tiếp trên màn hình Preview của Editor (giống CapCut). Không chờ hệ thống tự động dò quá lâu. 
- Nếu tương lai bật tính năng tự dò (OCR Auto-blur), sẽ bắt buộc dùng **GPU** để quét nhanh khung hình.

## M2-08, M2-10: Smart Crop & Watermark
- **Smart Crop (16:9 -> 9:16):** 
  - Giao diện UI (React) sẽ tức thời crop màn hình thành khung dọc (thông qua CSS/Canvas) để người dùng xem chính xác những gì sẽ xuất ra mà *không tốn thời gian chờ*.
  - FFmpeg sẽ chịu trách nhiệm cắt chém thật sự (Crop filter) lúc bấm Render.
- **Watermark (Logo/Text):**
  - Cho phép chèn Watermark.
  - Cung cấp thanh kéo **Độ trong suốt (Opacity)** và **Kích thước (Scale)** cho Logo.

## M2-09: Nhạc nền BGM & Audio Mix (Ducking)
- **Nguồn BGM:** Thay vì nhúng sẵn vài bài nhạc rườm rà làm nặng App (và dễ dính bản quyền), giải pháp tốt nhất là cho **người dùng Import file audio (.mp3, .wav)** từ máy tính của họ.
- **Ducking (Tự động giảm âm BGM khi có thoại):**
  - Cách tốt nhất: Thêm một thanh trượt **"Mức giảm nhạc nền" (Ducking Strength)** ở thẻ Audio Properties (Ví dụ: mặc định hạ BGM xuống còn 20% khi có tiếng đọc TTS).
  - Backend (FFmpeg) sẽ dùng bộ lọc `sidechaincompress` hoặc `volume` filter để kết hợp Audio TTS và BGM dựa theo tham số này.

## Code Context & Hướng Dẫn Planning
- **Layout UI:** Bổ sung thêm các slider/input tương ứng vào Property Panel (Tab OUT hoặc AUDIO).
- **Backend:** Cập nhật class `PipelineConfig` và `FFmpegOutputBuilder` trong Sidecar để nhận tham số blur (tọa độ pixel), tham số watermark (x,y, opacity, scale), duck_volume.
- **Architecture:** Cần xử lý cẩn thận phép toán Transform tỷ lệ: Tọa độ chọn Blur/Watermark trên giao diện web Canvas (React) phải được map chính xác về toạ độ Pixel chuẩn của file Video gốc lúc nhét vào mảng lệnh `-filter_complex` của FFmpeg.

---
*Created by gsd-discuss-phase workflow*
