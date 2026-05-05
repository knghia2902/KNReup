# Phase 30: Template Sets Library - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 30-template-sets-library
**Areas discussed:** Kiến trúc Template Sets, Số lượng & Phong cách, UI chọn Template Set, Tổ chức code

---

## Kiến trúc Template Sets

| Option | Description | Selected |
|--------|-------------|----------|
| Nâng cấp Layout Presets | Mở rộng Layout Presets hiện tại, thêm override sâu hơn. Không tạo khái niệm mới. | |
| Template Sets riêng biệt | Mỗi set là bộ 12 templates hoàn toàn mới với render() + animate() riêng. | ✓ |
| Hybrid | Giữ 1 bộ render() chung, mỗi set có animate() riêng + style overrides sâu. | |

**User's choice:** Template Sets riêng biệt
**Notes:** User muốn sự khác biệt visual rõ ràng giữa các bộ, không chỉ thay đổi font/border.

---

## Số lượng & Phong cách bộ mới

| Option | Description | Selected |
|--------|-------------|----------|
| 2 bộ mới | Cinematic + News Broadcast. Tổng 3 bộ. | |
| 3 bộ mới | Cinematic + News Broadcast + Social Media. Tổng 4 bộ. | ✓ |
| Phong cách custom | User tự mô tả ý tưởng. | |

**User's choice:** 3 bộ mới (tổng 4 bộ)
**Notes:** Default (hiện có), Cinematic (dark dramatic), News Broadcast (TV-style), Social Media (TikTok/Reels style)

---

## UI chọn Template Set

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown trong Config panel | Dropdown "Template Set" phía trên Template grid. Đơn giản, ít tốn không gian. | ✓ |
| Visual card grid | 4 cards preview nhỏ ở đầu Config panel. Trực quan hơn. | |
| Tuỳ agent | Agent tự quyết design. | |

**User's choice:** Dropdown trong Config panel
**Notes:** Đơn giản, ít tốn không gian trong panel trái vốn đã chật.

---

## Tổ chức code

| Option | Description | Selected |
|--------|-------------|----------|
| 1 file per set | Tách thành templateSet-default.ts, templateSet-cinematic.ts, etc. | |
| 1 file lớn duy nhất | Giữ tất cả trong templateData.ts. | |
| Tuỳ agent | Agent tự quyết cấu trúc phù hợp. | ✓ |

**User's choice:** Tuỳ agent
**Notes:** Không có preference cụ thể, agent tự chọn approach phù hợp nhất.

---

## Agent's Discretion

- Cấu trúc file / tổ chức code
- Chi tiết visual design cho từng template trong mỗi set
- Cách truyền set ID xuống HyperFrames renderer

## Deferred Ideas

- Scene Editor (Phase 30 cũ) — quá phức tạp, bỏ
- Custom template sets do user tự tạo
- Template marketplace
- Per-scene set mixing

## Pivot History

Phase 30 ban đầu là "Video Gen Lab Scene Editor" — cho phép chỉnh template/vị trí/font/nội dung cho từng scene. Sau khi thảo luận Scene Selection, Edit Scope (full control), và bắt đầu Editor UI Pattern, user quyết định phase quá phức tạp và pivot sang "Template Sets Library" — tạo nhiều bộ giao diện sẵn thay vì cho user tự chỉnh.
