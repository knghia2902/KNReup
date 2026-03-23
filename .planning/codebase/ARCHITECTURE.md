# ARCHITECTURE.md — Kiến trúc hệ thống

## Tổng quan

VideoTransAI là ứng dụng desktop Windows dành cho **lồng tiếng video tự động bằng AI**. Kiến trúc: Desktop app (pywebview) → Flask web server → Cython backend services.

```
┌─────────────────────────────────────────────────┐
│  pywebview (Native Window)                      │
│  ┌─────────────────────────────────────────┐    │
│  │  Frontend (HTML/CSS/JS)                 │    │
│  │  - index.html (trang chính)             │    │
│  │  - login.html / register.html           │    │
│  │  - plans.html (mua gói)                 │    │
│  │  - process.html (xem tiến trình)        │    │
│  └─────────────┬───────────────────────────┘    │
│                │ HTTP (localhost:5000)           │
│  ┌─────────────▼───────────────────────────┐    │
│  │  Flask Server (Python 3.10)             │    │
│  │  - REST API + SSE streaming             │    │
│  │  - Auth middleware (JWT verify)         │    │
│  │  - Static file serving                  │    │
│  └─────────────┬───────────────────────────┘    │
│                │                                │
│  ┌─────────────▼───────────────────────────┐    │
│  │  Cython Services (.pyd compiled)        │    │
│  │  ┌──────────────┐ ┌─────────────────┐   │    │
│  │  │ whisper_svc  │ │ translate_svc   │   │    │
│  │  │ (STT)        │ │ (DeepSeek API)  │   │    │
│  │  └──────────────┘ └─────────────────┘   │    │
│  │  ┌──────────────┐ ┌─────────────────┐   │    │
│  │  │ tts_service  │ │ audio_service   │   │    │
│  │  │ (Voice gen)  │ │ (FFmpeg/Demucs) │   │    │
│  │  └──────────────┘ └─────────────────┘   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
            │                        │
            ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │ ali33.site   │         │ Local AI     │
    │ (Auth/Pay/   │         │ (Whisper,    │
    │  Update API) │         │  Demucs,     │
    │              │         │  Piper TTS,  │
    │              │         │  FFmpeg)     │
    └──────────────┘         └──────────────┘
```

## Pipeline xử lý video (4 bước)

```
Bước 1: Whisper STT          → Nhận diện giọng nói → segments (text + timestamps)
Bước 2: DeepSeek Translation  → Dịch text gốc → tiếng Việt
Bước 3: TTS Audio Generation  → Tạo giọng đọc tiếng Việt cho từng segment
Bước 4: FFmpeg Merge          → Ghép audio mới + phụ đề + blur + logo → video output
```

## Communication Patterns

### Client → Server
- **REST API**: Upload video, save config, start processing, get results
- **SSE (Server-Sent Events)**: Streaming tiến trình xử lý real-time qua `/api/progress/{job_id}`

### Server → External
- **HTTPS → ali33.site**: Auth verify, subscription check, update check, payment
- **HTTPS → DeepSeek API**: Translation
- **HTTPS → Edge TTS API**: Cloud TTS
- **Local subprocess**: FFmpeg, Piper TTS exe

## API Endpoints (Flask)

### Video Processing
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/upload` | POST | Upload video file |
| `/api/save_config` | POST | Lưu cấu hình video (voice, subtitle, blur, logo) |
| `/api/start` | POST | Bắt đầu xử lý hàng đợi |
| `/api/retry` | POST | Retry/resume job bị lỗi |
| `/api/progress/{job_id}` | GET (SSE) | Stream tiến trình xử lý |
| `/api/result/{job_id}` | GET | Lấy kết quả (subtitles, video URL) |
| `/api/video/{job_id}` | GET | Serve video output |
| `/api/queue/status` | GET | Trạng thái hàng đợi |

### Backend Info
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/voices` | GET | Danh sách giọng TTS khả dụng |
| `/api/backend/status` | GET | GPU/CPU status, encoder info |
| `/api/preview_voice` | POST | Nghe thử giọng TTS |

### Update
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/update/check` | GET | Kiểm tra phiên bản mới |
| `/api/update/apply` | POST | Áp dụng cập nhật |
| `/api/open_folder` | POST | Mở thư mục output |

## Data Flow

```
User uploads video
  → File saved to uploads/
  → Job created with unique job_id
  → User configures: language, voice, style, blur, logo, subtitle
  → Config saved via /api/save_config

User starts processing
  → Queue processes jobs sequentially
  → Each job: Whisper → Translate → TTS → FFmpeg
  → SSE streams progress to frontend
  → Output saved to outputs/{job_id}/
  → Result: dubbed video + SRT subtitle file
```

## State Management

### Backend State
- **Queue**: In-memory list of jobs (jobId, status, config, progress)
- **Job states**: uploaded → queued → running → done/error/paused

### Frontend State
- `queueItems[]`: Array các video trong hàng đợi (jobId, filename, fileUrl, config, status, progress)
- `voices[]`: Danh sách giọng TTS từ API
- `currentModalJobId`: Job đang mở modal config
- `subscriptionExpired`: Trạng thái subscription
- Auth tokens: `localStorage` (videotrans_token, videotrans_device_token)
