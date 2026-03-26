# Research: Architecture (Multi-Engine & Output Advanced)

## 1. CPU-Bound Task Offloading trong FastAPI
Hệ thống bóc tách ML (Whisper, PaddleOCR) là các tiến trình CPU-bound. Nếu nhét trong `async def` của FastAPI sẽ khóa toàn bộ luồng mạng (Web block).
- **Pattern**: `await asyncio.get_event_loop().run_in_executor(executor, func, *args)`
- **Executor**: Cần khởi tạo `ThreadPoolExecutor` hoặc `ProcessPoolExecutor` cục bộ thay vì xài global để dễ kiểm soát Memory.

## 2. API Key Rotation (Round-Robin Design)
Quản trị list Keys qua `itertools.cycle`.
```python
from itertools import cycle

class APIKeyRotator:
    def __init__(self, keys_list):
        self._keys = cycle(keys_list)
        
    def get_next(self):
        return next(self._keys)
```
Mỗi khi gửi Request translation, tóm 1 Key từ Rotator. Nếu lỗi 429, retry vả bắt ngay Key tiếp theo.

## 3. Subtitle / Blur Pipeline bằng FFmpeg Sidechain
Xây dựng chuỗi (Graph) FFmpeg: Audio và Video xử lý độc lập trước khi mux.
- `[tts_audio]` làm sidechain bóp `[bgm_audio]` dùng `sidechaincompress`.
- Video pipe: `[0:v]` -> crop -> boxblur (OCR boxes) -> drawtext -> `[out_v]`.
