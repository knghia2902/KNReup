---
wave: 1
depends_on: []
files_modified:
  - src/stores/useProjectStore.ts
  - src/components/preview/VideoPreview.tsx
  - src/components/properties/SubTab.tsx
  - python-sidecar/app/pipeline_runner.py
  - python-sidecar/app/engines/ocr_extractor.py
autonomous: true
---

# Phase 6.1 — Plan 01 (OCR Extractor Core & UI)

<objective>
Xây dựng nút bật chế độ OCR, khung overlay chọn vùng (OCR Zone) trên giao diện. Ở Backend, dựng class `VideoOcrExtractor` nhận input tọa độ và scan text. Tích hợp chạy vào `PipelineRunner` luồng Analyze cùng với Smart Merge algorithm để lấp vào khoảng lặng của Whisper.
</objective>

<task_list>

<task>
<id>6.1-01-01</id>
<title>Bổ sung cấu hình OCR vào Project Store</title>
<read_first>
- src/stores/useProjectStore.ts
</read_first>
<action>
Thêm các key sau vào interface `ProjectConfig` và set state default (ngay sau block subtitle_enabled):
`ocr_enabled: boolean` (default false)
`ocr_x: number` (default 50)
`ocr_y: number` (default 50)
`ocr_w: number` (default 300)
`ocr_h: number` (default 150)
Update các fn `resetConfig`/`setActiveFile`/`updateConfig` để reset/merge các key này cẩn thận.
</action>
<acceptance_criteria>
- `src/stores/useProjectStore.ts` contains `ocr_enabled: boolean;`
</acceptance_criteria>
</task>

<task>
<id>6.1-01-02</id>
<title>Thiết kế Giao diện OCR Settings Box (SubTab.tsx)</title>
<read_first>
- src/components/properties/SubTab.tsx
</read_first>
<action>
Tại component `SubTab.tsx` nối tiếp ngay dưới `<div className="pshd">Subtitle Render</div>` hoặc section Blur (nếu có), tạo 1 cục `div className="ps"`:
- H1 label `Hardsub Extraction (OCR)`
- ToggleControl: Bật tắt `ocr_enabled`. (Label: "Enable OCR Smart Merge")
- Text nhỏ: "Chuột trái vào Video để resize khung màu xanh OCR Region. Giúp OCR không quét tốn CPU."
</action>
<acceptance_criteria>
- `src/components/properties/SubTab.tsx` contains `Enable OCR Smart Merge`
</acceptance_criteria>
</task>

<task>
<id>6.1-01-03</id>
<title>Vẽ Overlay Box OCR trên Video Preview</title>
<read_first>
- src/components/preview/VideoPreview.tsx
- src/components/properties/StyleTab.tsx
</read_first>
<action>
Trên `VideoPreview.tsx`, copy kiến trúc `useDrag` của Watermark. Thêm 1 Overlay div phụ thuộc `config.ocr_enabled`.
Div Box này có viền màu chữ xanh la cây (`{ border: '2px dashed rgba(0,255,100,0.8)', backgroundColor: 'rgba(0,255,100,0.1)' }`).
Chèn handler Update giá trị xywh đẩy thẳng vào `updateConfig({ ocr_x, ocr_y, ocr_w, ocr_h })` kèm clamping giữ viền (Math.max / Math.min).
</action>
<acceptance_criteria>
- `src/components/preview/VideoPreview.tsx` contains the `ocr_enabled` condition block with a draggable boundary box tracking `ocr_x` etc.
</acceptance_criteria>
</task>

<task>
<id>6.1-01-04</id>
<title>Dựng Engine OCR Extractor trong Python</title>
<read_first>
- python-sidecar/app/pipeline_runner.py
</read_first>
<action>
Tạo file mới `python-sidecar/app/engines/ocr_extractor.py`.
Dựng class `VideoOcrExtractor`:
- Hàm `extract_hardsubs(video_path: str, region: dict, lang: str = "vi")` returns list của các dict `{"start": t, "end": t+1, "text": "chuỗi", "type": "ocr"}`.
- Backend lấy frame `fps=1` ra (`cv2.VideoCapture`). 
- Slice frame numpy `frame[y:y+h, x:x+w]`.
- Dùng lib `easyocr.Reader([lang])` readtext block frame này. Gộp text lại nếu liên tiếp lặp ở 2 khung hình kề nhau (tránh text lặp lại liến thoắng 1 giây 1 nhát do framerate dính sát).
</action>
<acceptance_criteria>
- `python-sidecar/app/engines/ocr_extractor.py` exists with `class VideoOcrExtractor` and uses `easyocr` (hay paddle).
</acceptance_criteria>
</task>

<task>
<id>6.1-01-05</id>
<title>Tích hợp Smart Merge vào PipelineRunner</title>
<read_first>
- python-sidecar/app/pipeline_runner.py
- python-sidecar/app/engines/ocr_extractor.py
</read_first>
<action>
Tại `PipelineConfig` trong `pipeline_runner.py`:
Hứng param `ocr_enabled`, `ocr_x, ocr_y, ocr_w, ocr_h` vào.
Trong `PipelineRunner.run_analyze`:
(Khúc sau khi Transcribe Whisper pass trả về mảng list `segments` gốc).
Nếu `config.ocr_enabled == True`, gọi await call thread `ocr_extractor.extract_hardsubs(...)` bằng `asyncio.to_thread`.
Logik Smart Merge Sub:
Tạo danh sách gộp Whisper và OCR. Check Overlap. Loại bỏ cái `ocr_seg` nào chồng lấp trên `>20%` tổng độ dài khoảng chạy chung của bất kỳ cái whisper_seg. (Để loại chèn đè OCR text vào cùng chỗ subtitle đã có của ASR). Nhồi thêm tất cả `ocr_seg` đạt điều kiện vào `segments`. Dùng hàm sorted(p.start) sort lại thời gian. Loop For index gán lại field `id`.
Tiếp tục nạp thẳng input cho Translate phase.
</action>
<acceptance_criteria>
- `python-sidecar/app/pipeline_runner.py` contains `config.ocr_enabled == True` and merging logic array inside `run_analyze`.
</acceptance_criteria>
</task>

</task_list>
