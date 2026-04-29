## Tách TTS Batch & Persist Data theo Project (Phase 25.1)

- **Tách luồng TTS:** Đưa bước tạo âm thanh (TTS) ra khỏi quá trình Render thành một luồng thủ công riêng (nút "Generate Voice" trên Audio Tab) để dễ dàng kiểm soát và xem trước.
- **Tính năng Per-Segment:** Hỗ trợ nghe thử (Play) và tạo lại âm thanh (Re-TTS) cho từng câu thoại ngay trên Text Tab.
- **Lưu trữ dữ liệu theo Project (Persistence):** Toàn bộ dữ liệu cấu hình, phụ đề và file âm thanh TTS được lưu trữ liên tục theo project. Mở lại project sẽ tự động tải lại toàn bộ trạng thái.
- **Tối ưu Export:** Export video sẽ tận dụng giọng nói đã được tạo trước đó (pre-generated voice) để bỏ qua bước TTS nội suy, tăng tốc độ render đáng kể.
