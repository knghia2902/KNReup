# Research Synthesis: Milestone 2.0 (Real Web Data)

Kết quả thu thập thực tế từ Internet chứng minh 3 điểm chốt chặn (Pivot Points) trong thiết kế App của chúng ta cần đi theo chuẩn công nghiệp:

## 🌟 Chìa khóa thành công (Key Findings)
1. **Quay đầu chọn PaddleOCR**: Tài liệu benchmark mới nhất khẳng định PaddleOCR bản Lightweight xử lý ảnh nhanh hơn (dưới 1s/ảnh) và Cold-boot (Khởi động lạnh CPU) cực lẹ chỉ 8 giây, ăn đứt EasyOCR (15s).
2. **Audio Ducking (Làm lú nhạc nền) Không Giới Hạn**: Tưởng khó hóa dễ nhờ Filter `sidechaincompress` có sẵn của FFmpeg. Chỉ cần cấu hình Release time chậm (~500ms) để chặn hiện tượng Pumping (Tiếng giật cục). Không cần động tới thư viện phụ trợ như Pydub.
3. **Round Robin API Key**: FastAPI xoay vòng qua mảng List Key cực nét bằng built-in module `itertools.cycle`.
4. **Không Thể Đùa Với Async**: Bắt buộc mọi Machine Learning Code Line phải ngâm trong `ThreadPoolExecutor` để tránh Event Loop Block khiến App bị chết đứng ở Frontend.

## Link Xem Hệ Thống
- Thiết lập FFmpeg + RoundRobin: `.planning/research/ARCHITECTURE.md`
- Chọn thư viện Core: `.planning/research/STACK.md`
- Góc phòng chống Treo Cứng Máy: `.planning/research/PITFALLS.md`
