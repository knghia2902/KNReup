# Research: Pitfalls (Cạm Bẫy)

## 1. Treo Hệ Thống Khung (Event Loop Blocking)
- **Vấn đề**: Các hàm AI suy luận ngốn rất nhiều toán học Ma Trận (Matrix Multiplication). Dùng `await` không giải quyết được nếu lõi hàm đó chạy kiểu Synchronous (như PaddleOCR `ocr.ocr()`). Khách hàng sẽ bị đơ thanh Progress Bar Frontend.
- **Cách né**: Luôn ThreadPoolExecutor cho OCR và TTS offline.

## 2. FFmpeg Audio Ducking Phản Tác Dụng (Pumping Effect)
- **Vấn đề**: Mặc định áp lệnh ducking `sidechaincompress` mà không hiểu thời gian `attack/release` sẽ làm tiếng nhạc nền giật giật (Lên xuống thất thường theo dấu phẩy của giọng nói).
- **Cách né**: Chỉnh `release` chậm lại (500ms -> 1s) để giữ khoảng lặng nhỏ giữa các câu thoại trước khi nhạc to lên lại, và `attack` nhanh (10ms) để không bị đè chữ nói đầu tiên.

## 3. Cài Đặt PaddleOCR Dính Rác Tensor/Cuda Mâu Thuẫn
- **Vấn đề**: Module này nổi tiếng kéo theo 1 núi dependency của PaddlePaddle conflicts với torch hiện có của Whisper.
- **Cách né**: Chia Virtual Env (Môi trường ảo) cực sạch, hoặc tìm bản Onnx runtime của Paddle thay vì cài Native Framework.
