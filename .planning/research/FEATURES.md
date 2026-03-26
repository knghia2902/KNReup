# Research: Features (Multi-Engine & Output Advanced)

## 1. Table Stakes (Phải có)
- **Fallback API & Rate Limit Resilience**: Khi API kiệt sức hoặc hết Quota, hệ thống tự động ngắt kết nối tạm thời (`Circuit Breaker`) và chuyển luồng (Fallback) sang Engine khác dự phòng.
- **Audio Ducking**: Âm thanh nhạc nền (BGM) tự động nhỏ lại chính xác vào lúc nhân vật cất tiếng nói (Thông số mượt mà: `attack` 10ms, `release` 500ms).
- **Watermark & Blur**: Cà mờ sub cứng và đóng Dấu bản quyền (Tính năng sống còn của hội Reup). Đòi hỏi tính mềm dẻo tọa độ do người dùng kéo vị trí.

## 2. Differentiators (Tính năng bứt phá)
- **API Key Round-Robin Strategy**: Round-Robin qua một danh sách Key của cùng 1 hãng (VD: 5 Key DeepSeek) dùng thư viện `itertools.cycle` để chia đều tải 15 RPM/key, tạo cảm giác tài khoản V.I.P không bao giờ lỗi.
- **AI OCR Bounding Box Culling**: PaddleOCR dò đúng khung chữ, tránh blur nhầm mặt nhân vật ở dưới đáy Video.

## 3. Anti-Features (Tránh làm)
- **Train/Fine-tune AI Local**: Sử dụng model train sẵn từ cộng đồng (PaddleOCR lightweight) thay vì cố train Custom Model gây phình to thư mục.
