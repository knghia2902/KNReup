# INTEGRATIONS.md — Tích hợp bên ngoài

## API Server chính: ali33.site

Tất cả authentication, subscription, và update đều thông qua server `https://ali33.site`.

### Auth endpoints
| Endpoint | Method | Mô tả |
|---|---|---|
| `/videotrans/api/login.php` | POST | Đăng nhập, trả JWT token |
| `/videotrans/api/register.php` | POST | Đăng ký tài khoản mới |
| `/videotrans/api/verify.php` | GET | Xác thực token (kiểm tra mỗi session) |
| `/videotrans/api/me.php` | GET | Lấy thông tin user (username, subscription status) |

### Payment (Pay2S)
| Endpoint | Method | Mô tả |
|---|---|---|
| `/videotrans/api/create_payment.php` | POST | Tạo link thanh toán Pay2S |
| `/videotrans/api/payment_status.php` | GET | Kiểm tra trạng thái thanh toán |

### Update
| Endpoint | Method | Mô tả |
|---|---|---|
| `/videotrans/update/version.json` | GET | Kiểm tra phiên bản mới nhất |
| `/videotrans/update/runtime_manifest.json` | GET | Manifest runtime cho auto-update |

## Auth Flow

```
Login Form → POST /login.php (username, password, device_token)
         → Nhận JWT token
         → Lưu localStorage: videotrans_token, videotrans_device_token
         → Mỗi request gửi Header: Authorization: Bearer {token}
         → Mỗi request gửi Header: X-Device-Id: {device_token}
         → 401 → redirect login
         → 403 + code=subscription_expired → lock UI
```

## Subscription Model

- 3 gói: 1 tháng (300K₫), 6 tháng (1.5M₫), 12 tháng (3M₫)
- Tối đa 2 thiết bị/tài khoản (device_token tracking)
- Khi hết hạn: UI bị lock, hiện thông báo nâng cấp
- Thanh toán qua Pay2S payment gateway
- IPN callback tự động kích hoạt gói

## AI APIs & Services

### DeepSeek (dịch thuật)
- Sử dụng DeepSeek API cho bước dịch text (source → Vietnamese)
- `tiktoken` dùng để đếm token trước khi gọi API
- Văn phong dịch: Cơ bản, Phim ảnh, Vlog, Thể thao, Động/Thực vật, Khoa học, Review sản phẩm, hoặc Custom prompt

### OpenAI Whisper (STT)
- Chạy local (trong PyTorch)
- Nhận diện giọng nói → text + timestamps
- Hỗ trợ GPU (CUDA) hoặc CPU fallback

### TTS Engines (Text-to-Speech)
| Engine | Loại | Chi tiết |
|---|---|---|
| **Edge TTS** | Cloud | Microsoft Edge voices, nhiều giọng vi-VN |
| **gTTS** | Cloud | Google TTS, giọng cơ bản |
| **Piper TTS** | Local | ONNX model, `vi_VN-vais1000-medium` (~60MB) |
| **Giọng ai33-** | Cloud | Custom voices qua ali33.site |
| **Giọng genmax-** | Cloud | Custom premium voices |

### Facebook Demucs (Vocal Separation)
- Chạy local (PyTorch)
- Tính năng "SmartVoice": tách giọng gốc khỏi nhạc nền
- Hỗ trợ GPU hoặc CPU

### FFmpeg (Video Processing)
- Bundled local trong `_internal\ffmpeg\`
- Encode video: GPU (NVENC) hoặc CPU (libx264)
- Ghép audio, chèn phụ đề hardsub, blur regions, logo/watermark

## Auto-Update System

```
Launcher mở → Kiểm tra version.json trên ali33.site
           → So sánh runtime version
           → Nếu mới hơn: download & chạy apply_update.ps1
           → Script tự đóng app, thay file, mở lại
           → Xác thực bản cập nhật bằng update_signing_public.pem
```

- Updater script PowerShell: `C:\Users\...\AppData\Local\Temp\videotrans-updater\apply_update.ps1`
- UI có nút "Kiểm tra cập nhật" và dialog hiển thị changelog
