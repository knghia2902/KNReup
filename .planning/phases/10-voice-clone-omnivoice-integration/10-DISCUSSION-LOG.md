# Phase 10: Voice Clone - OmniVoice Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 10-voice-clone-omnivoice-integration
**Areas discussed:** Luồng Clone Giọng, Quản Lý Voice Profile, Preview & Test Giọng, Tích Hợp Với Pipeline

---

## Luồng Clone Giọng

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ upload file | Kéo thả hoặc chọn file WAV/MP3 | ✓ |
| Upload + Record | Thêm nút ghi âm micro trên UI | |
| Agent quyết định | | |

**User's choice:** Chỉ upload file
**Notes:** Giữ đơn giản giống Downloader paste link.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tự động hoàn toàn | Không hiện ô nhập transcript, AI tự xử lý | ✓ |
| Tùy chọn | Có ô nhập text nhưng không bắt buộc | |

**User's choice:** Tự động hoàn toàn
**Notes:** User hỏi giải thích ref_text. Giải thích: transcript là nội dung nói trong audio, OmniVoice dùng Whisper ASR nếu không cung cấp.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 3-10 giây | Theo khuyến nghị OmniVoice | |
| Tối đa 30 giây | Cho phép linh hoạt hơn | ✓ |
| Không giới hạn | | |

**User's choice:** Tối đa 30s, khuyến nghị 3-10s
**Notes:** User hỏi tại sao audio dài không tốt hơn. Giải thích: OmniVoice là zero-shot (trích xuất embedding, không train). Audio dài thêm nhiễu → embedding loãng → clone kém. Đồng ý cho phép 30s nhưng hiện warning >10s.

---

## Quản Lý Voice Profile

| Option | Description | Selected |
|--------|-------------|----------|
| Danh sách dọc | Giống Downloader, mỗi profile 1 dòng | ✓ |
| Card grid | Card nhỏ với avatar/icon | |

**User's choice:** Danh sách dọc

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tối giản | Chỉ tên + Play/Delete | |
| Chi tiết | Tên + ngày tạo + thời lượng + Play/Delete | ✓ |

**User's choice:** Chi tiết

---

| Option | Description | Selected |
|--------|-------------|----------|
| Có export/import | Nút export zip, import file | |
| Không cần | Chỉ local | ✓ |

**User's choice:** Không cần export/import

---

## Preview & Test Giọng

| Option | Description | Selected |
|--------|-------------|----------|
| Ô nhập text + Generate | User gõ câu bất kỳ | |
| Câu mẫu có sẵn | 2-3 câu mẫu tiếng Việt | |
| Cả hai | Câu mẫu + tự gõ | ✓ |

**User's choice:** Cả hai

---

| Option | Description | Selected |
|--------|-------------|----------|
| Có so sánh | Audio gốc bên trái, clone bên phải | ✓ |
| Không | Chỉ nghe clone | |

**User's choice:** Có so sánh giọng gốc vs clone

---

## Tích Hợp Với Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Có tích hợp TTS tab | Giọng clone xuất hiện trong dropdown Editor | ✓ |
| Không | Voice Clone là tool riêng | |

**User's choice:** Có — tích hợp vào TTS tab dropdown

---

| Option | Description | Selected |
|--------|-------------|----------|
| Có Voice Design | Tạo giọng bằng mô tả text | ✓ |
| Không | Chỉ Voice Clone từ audio | |

**User's choice:** Có — hỗ trợ Voice Design

---

## Deferred Ideas

- Export/import voice profile
- Record audio trực tiếp từ micro
- Voice fine-tuning
