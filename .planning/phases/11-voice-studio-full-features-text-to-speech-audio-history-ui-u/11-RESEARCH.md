# Phase 11: Voice Studio Full Features: Text-to-Speech, Audio History, UI Upgrades - Research

**Researched:** 2026-04-23
**Domain:** Text-to-Speech (TTS) integration, local state management (Audio History), Multi-window UI/UX
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hỗ trợ tất cả các Engine (Edge, ElevenLabs, OmniVoice) ngay bên trong Voice Studio.
- **D-02:** Đồng bộ với Editor, cho phép tinh chỉnh đầy đủ (tốc độ, âm lượng, âm sắc) trực tiếp trên giao diện Voice Studio khi tạo audio.
- **D-03:** Lưu lại toàn bộ lịch sử (âm thanh đã tạo) xuống local (dưới dạng danh sách lưu trên đĩa) cho các lần mở sau.
- **D-04:** Không cung cấp nút "Gửi vào Dự án" tự động. Người dùng sẽ tự quản lý và import file vào Editor qua Media Bin một cách thủ công.
- **D-05:** Cấu trúc thành các tab ngang chuyên biệt (Ví dụ: Voice Clone, Voice Design, Text-to-Speech).
- **D-06:** Mỗi tab sẽ chứa phần chức năng tạo mới ở trên và danh sách kết quả (History) riêng biệt ở bên dưới để dễ quản lý.

### Specific Ideas
- Thiết kế giữ nguyên tông màu Dark/Glassmorphism giống Editor.
- Cập nhật icon của "Voice Clone" ở Home Launcher thành "Voice Studio".

### Deferred Ideas (OUT OF SCOPE)
- Bấm nút gửi thẳng vào dòng thời gian (Timeline) của Editor.
- Export/import profile.
</user_constraints>

## Summary

Phase 11 mở rộng tính năng của cửa sổ công cụ `VoiceCloneWindow` hiện tại thành một "Voice Studio" hoàn chỉnh. Cụ thể, Voice Studio sẽ không chỉ dừng ở việc Clone và Design giọng nói qua OmniVoice, mà còn được tích hợp thêm trình tổng hợp văn bản thành giọng nói (Text-to-Speech) hỗ trợ đa Engine (Edge TTS, ElevenLabs, OmniVoice). Người dùng có thể thiết lập các thông số như tốc độ, âm lượng, âm sắc (Pitch) ngay trong Voice Studio giống như những gì đang có tại Editor Properties.

Đồng thời, Phase 11 cũng yêu cầu việc lưu trữ lịch sử tạo Audio (History). Lịch sử này sẽ được quản lý ở local, mỗi tab (Text-to-Speech, Voice Clone, Voice Design) sẽ có khu vực quản lý file History của riêng nó ở phía dưới giao diện. Điều này đòi hỏi Sidecar (Python backend) phải mở rộng hoặc thêm các endpoints mới để quản lý danh sách file TTS History bên cạnh Profile của Voice Clone. Cuối cùng, UI/UX sẽ được tái cấu trúc thành các tab ngang thay vì cấu trúc dạng pill tab hiện tại, và tên công cụ trên Launcher sẽ đổi từ "Voice Clone" thành "Voice Studio".

**Primary recommendation:** Tận dụng lại các form Controls (`SelectControl`, `SliderControl`) từ Editor Properties cho tab Text-to-Speech trong Voice Studio. Xây dựng một module SQLite/JSON trên Backend (Sidecar) hoặc qua Tauri File System để lưu Metadata của Audio History một cách nhất quán.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Giao diện Voice Studio | React (Frontend Tool) | Tauri Window | Cửa sổ popup độc lập, kế thừa thiết kế Glassmorphism và kết nối hook `useSidecar`. |
| Cấu hình TTS (Speed, Pitch) | React State | — | Trạng thái cấu hình được quản lý nội bộ trong Component hoặc qua một local store của Voice Studio. |
| Gọi API TTS đa Engine | API / Backend | Python Sidecar | Xử lý toàn bộ logic gọi Edge, ElevenLabs, OmniVoice. Cần cung cấp một TTS endpoint chuyên dụng cho Voice Studio (có chức năng ghi file vào lịch sử). |
| Quản lý Lịch sử (History) | API / Backend | File System | Backend cần lưu file wav/mp3 ra đĩa cứng và trả về list cho Frontend hiển thị. Có thể sử dụng JSON lưu metadata lịch sử hoặc trả trực tiếp danh sách file trong thư mục `data/history`. |
| Import vào Media Bin | Browser / Client | — | Frontend hỗ trợ user thao tác thủ công với file sinh ra từ History sang Editor Media Bin (D-04). |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Tauri) | 18.x | Frontend UI | Đã có sẵn trong dự án. Dùng để xây dựng các Panel, Tab trong Voice Studio. |
| FastAPI (Python) | 0.104+ | Backend API | Xử lý request sinh TTS và quản lý file history ở local storage. |
| @phosphor-icons/react | 2.x | UI Icons | Đảm bảo tính nhất quán của Icon với phần còn lại của ứng dụng. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tauri File System | 2.x | File Access | Khi cần truy xuất thư mục sinh file hoặc đọc nội dung audio ngay từ Frontend. |
| wavesurfer.js | 7.x | Audio Visualization | (Có thể cân nhắc) Vẽ waveform cho các đoạn History thay vì dùng CSS Wave giả lập như hiện tại. |

## Architecture Patterns

### System Architecture Diagram

Yêu cầu sinh Audio từ Voice Studio:
Frontend (Voice Studio Tab: Text-to-Speech)
  → Chọn Engine (Edge/ElevenLabs/OmniVoice) + Nhập Text + Config
  → POST `/api/tts/generate` (Sidecar)
  → Sidecar tổng hợp Audio qua các class TTSEngine hiện tại (Edge/ElevenLabs/OmniVoice)
  → Sidecar lưu file Audio vào thư mục `data/voice_studio_history/`
  → Sidecar lưu Metadata (Text, Engine, Config, Date) vào thư mục hoặc file JSON index.
  → Frontend nhận kết quả, cập nhật lại danh sách History bên dưới Tab.
  → User kéo thả hoặc mở file để Import vào Editor Media Bin thủ công.

### Recommended Project Structure
```
src/
├── components/
│   ├── tools/
│   │   ├── VoiceStudioWindow.tsx    # (Đổi tên từ VoiceCloneWindow.tsx)
│   │   ├── VoiceStudioWindow.css    # (Đổi tên và cập nhật UI)
│   │   └── voicestudio/
│   │       ├── TTSTab.tsx           # Tab Text-to-Speech + History
│   │       ├── CloneTab.tsx         # Tab Voice Clone + History
│   │       └── DesignTab.tsx        # Tab Voice Design + History
```
```
python-sidecar/app/
├── routes/
│   ├── voice_studio.py              # Thêm route mới cho History API (nếu cần) hoặc mở rộng pipeline/tts.py
├── data/
│   ├── history/                     # Thư mục lưu file audio đã tạo với file index metadata
```

### Pattern 1: Tái sử dụng Controls Component
**What:** Sử dụng các thành phần UI chung từ Editor Properties để giữ đồng bộ trải nghiệm cho thông số TTS.
**When to use:** Trong Tab Text-to-Speech của Voice Studio khi tinh chỉnh tốc độ, âm lượng, âm sắc.
**Example:**
```tsx
import { SliderControl } from '../controls/SliderControl';

// Bên trong TTSTab.tsx của Voice Studio
<SliderControl 
  label="TTS Speed" 
  value={speed} 
  min={0.5} max={2.0} step={0.1} unit="x" 
  onChange={(v) => setSpeed(v)}
/>
```

### Anti-Patterns to Avoid
- **[Anti-pattern]:** Gọi API TTS nhưng trả về nội dung Blob trực tiếp mà không lưu xuống đĩa. Voice Studio có yêu cầu D-03: Lưu lại toàn bộ lịch sử. Do đó, API phải sinh ra file trên đĩa cứng và trả về Metadata URL để Frontend hiển thị thay vì chỉ stream Audio Blob.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Xây dựng UI Tabs logic phức tạp | Hand-rolled Tab state with complex routing | Simple State String (`activeTab`) | UI của tool chỉ có 3 tab, sử dụng state string đơn giản là đủ, không cần React Router ở đây. |
| Audio Player UI cho History | Custom `audio` API wrapper complex | Native `<audio>` tag + custom controls | Có sẵn ở `VoiceCloneWindow.tsx`, chỉ cần refactor thành Component dùng chung cho các Tab. |
| Quản lý cửa sổ Tauri | Custom window invocation | `windowManager.ts` | Dự án đã có sẵn hàm `openTool('voice-studio')` chuẩn, chỉ cần đổi tham số. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `data/tts_profiles/` (chứa profile clone/design của Phase 10) | Giữ nguyên cho cấu hình Voice Clone. Cần tạo thêm `data/history/` cho Audio được xuất bản ở Phase 11. |
| Live service config | Tên cửa sổ `tool-voice-clone` đang dùng trong Tauri | Chuyển đổi tên sang `tool-voice-studio` trong `windowManager.ts` và launcher |
| OS-registered state | None — verified by codebase | None |
| Secrets/env vars | None | None |
| Build artifacts | `src/components/tools/VoiceCloneWindow.tsx` | Đổi tên file thành `VoiceStudioWindow.tsx` và cấu trúc lại logic hiển thị tab. |

## Common Pitfalls

### Pitfall 1: Trùng lặp code gọi API TTS
**What goes wrong:** Logic gọi Edge TTS / ElevenLabs bị viết lại riêng cho Voice Studio thay vì dùng chung với Editor.
**Why it happens:** Editor đang phụ thuộc vào các hàm tổng hợp trực tiếp từ Sidecar cho Timeline. Voice Studio tự tạo request khác rườm rà.
**How to avoid:** Tạo một Endpoint chung cho `Text-to-Speech` bên Sidecar cho phép nhận params chung và kèm theo cờ báo hiệu ghi lưu lịch sử (`save_history=true`) khi gọi từ Voice Studio.

### Pitfall 2: Xung đột State của các Tab History
**What goes wrong:** Khi mở qua lại các Tab, Audio đang phát của Tab này không bị dừng khi phát Audio của Tab kia.
**Why it happens:** Quản lý tham chiếu `audioRef` riêng lẻ không đồng bộ giữa các component con.
**How to avoid:** Quản lý cờ `playingId` ở cấp độ cao hơn (`VoiceStudioWindow`) và truyền xuống qua Context/Props, đảm bảo mỗi thời điểm chỉ 1 track audio được play.

### Pitfall 3: Cập nhật thiếu ở Home Launcher
**What goes wrong:** Nút bấm "Voice Clone" ở Home Launcher bật lên tool trống hoặc không khớp đường dẫn.
**Why it happens:** Quên cập nhật định danh từ `voice-clone` sang `voice-studio` trong file `src/components/setup/HomeLauncher.tsx` và `src/utils/windowManager.ts`.
**How to avoid:** Cập nhật đồng bộ các định danh URL và Label window.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Popup Voice Clone thuần phục vụ tạo Profile (Phase 10) | Voice Studio đa tính năng gồm cả sinh TTS tức thời và xem lịch sử (Phase 11) | Current | Cho phép sản xuất và thử nghiệm Audio tách biệt khỏi Editor, tăng sự linh hoạt và tiện dụng. |

**Deprecated/outdated:**
- `VoiceCloneWindow` Component hiện tại sẽ bị thay thế hoàn toàn bởi cấu trúc `VoiceStudioWindow` có các Tab tính năng chuyên biệt ở trên và phần danh sách History ở dưới.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Có thể sử dụng thư mục cục bộ `data/history/` bên trong thư mục root của dự án (cùng vị trí sidecar data) để lưu lịch sử TTS Audio và Metadata (JSON). | Architecture | [LOW] Dữ liệu có thể mất khi xóa dự án, nhưng trong môi trường local app, hành vi này là tiêu chuẩn. |
| A2 | Tab "Text-to-Speech" sẽ sử dụng một Textarea lớn để người dùng nhập nội dung thay vì chỉ một input dòng. | Summary | [MEDIUM] Nếu không hỗ trợ block text lớn, user khó sinh file âm thanh dài đủ để chèn vào Editor. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Sidecar TTS | ✓ | 3.10+ | — |
| Edge TTS | TTS Engine | ✓ | - | — |
| OmniVoice | Voice Clone/Design | ✓ | - | — |

**Missing dependencies with no fallback:**
- Không có rào cản ngoại vi mới nào phát sinh trong Phase 11. Các công nghệ nền tảng đã được trang bị và hoạt động ở các phase trước.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vite / React / FastAPI |
| Config file | none — see Wave 0 |
| Quick run command | `npm run dev` / `python run_dev.py` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VS-01 | Mở cửa sổ Voice Studio từ Launcher | Manual | N/A | ❌ Wave 0 |
| VS-02 | Giao diện hiển thị 3 tab rõ ràng (Voice Clone, Voice Design, Text-to-Speech) | Manual | N/A | ❌ Wave 0 |
| VS-03 | Tab TTS cho phép chọn Edge/ElevenLabs/OmniVoice, chỉnh speed/pitch và render file | Manual | N/A | ❌ Wave 0 |
| VS-04 | Lưu lịch sử Audio vào local và hiển thị đúng lịch sử trên phần History panel | API/Manual | N/A | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Kiểm tra React app không bị crash do thay đổi routing/component.
- **Phase gate:** Có thể sinh 1 file âm thanh từ Text-to-Speech Tab và xác nhận file đó xuất hiện ở danh sách Lịch sử bên dưới, sau đó thao tác import thủ công được vào Editor.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Xác thực chuỗi văn bản đầu vào cho tính năng tổng hợp Text-to-Speech, tránh ký tự độc hại và giới hạn độ dài hợp lý. |
| V4 Access Control | no | Ứng dụng chạy ở mô hình local-first không yêu cầu access control khắt khe ngoài file system của hệ điều hành. |

### Known Threat Patterns for FastAPI/React
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS / Path Traversal qua tên file sinh | Tampering | Sử dụng hàm tạo safe name ví dụ `re.sub(r'[^a-zA-Z0-9_-]', '_', name)` trên Python để lưu tên file âm thanh. (Đã có ở code hiện hành). |
| Directory Traversal khi đọc file History | Info Disclosure | Chuẩn hóa đường dẫn khi đọc file từ list history (FastAPI). |

## Sources

### Primary (HIGH confidence)
- Cấu hình và ràng buộc tại: `.planning/phases/11-voice-studio-full-features-text-to-speech-audio-history-ui-u/11-CONTEXT.md`
- Giao diện UI cũ tại: `src/components/tools/VoiceCloneWindow.tsx`
- Endpoint definitions TTS cũ tại: `python-sidecar/app/routes/tts_profiles.py`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Các công nghệ đều sẵn có trong dự án và đã được thẩm định.
- Architecture: HIGH - Giao diện Tab chia Layout cơ bản của React hoàn toàn khả thi.
- Pitfalls: HIGH - Các vấn đề về State management Audio có thể tái diễn từ các phiên bản tính năng trước.

**Research date:** 2026-04-23
**Valid until:** 2026-05-23
