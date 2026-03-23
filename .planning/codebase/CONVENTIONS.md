# CONVENTIONS.md — Coding Conventions & Patterns

## Ngôn ngữ UI

- Toàn bộ giao diện bằng **tiếng Việt** (labels, messages, errors)
- HTML entity encoding cho các ký tự tiếng Việt đặc biệt trong HTML inline (VD: `\u0026#7879;` cho "ệ")
- Console logs và debug messages có thể bằng ASCII không dấu

## Frontend Patterns

### JavaScript Style
- **Vanilla JS** — không dùng framework (React, Vue, etc.)
- DOM manipulation trực tiếp với `document.getElementById()`
- Event listeners: `element.addEventListener('click', handler)`
- Async/await cho API calls
- `fetch()` API override toàn cục để tự động đính JWT token

### State Management
- Global variables ở đầu file (`let queueItems = []`, `let voices = []`)
- State per-modal session (VD: `modalBlurRegions`, `modalLogoImageState`)
- Config objects sử dụng pattern `defaultConfig()` → `normalizeConfig(userConfig)`
- Deep clone qua `JSON.parse(JSON.stringify(obj))`

### Config Normalization Pattern
```javascript
function defaultConfig() {
  return {
    language: 'auto',
    dubbing_enabled: true,
    voice: voices[0]?.id || 'vi-VN-HoaiMyNeural',
    // ...các giá trị mặc định
  };
}

function normalizeConfig(config = {}) {
  const defaults = defaultConfig();
  return { ...defaults, ...config, /* override specific fields */ };
}
```

### Voice Preset System
```javascript
const VOICE_PRESETS = {
  'gtts-vi-VN-NuTramAm': { rate: 180, voiceVolume: 200, pitch: 70 },
  'piper-vi-VN-CoGaiNhanhNhen': { rate: 130, voiceVolume: 100, pitch: 60 },
};

function getVoicePreset(voiceId) {
  if (VOICE_PRESETS[voiceId]) return VOICE_PRESETS[voiceId];
  if (voiceId.startsWith('ai33-')) return { rate: 120, voiceVolume: 100, pitch: 50 };
  // ...prefix-based fallback
}
```

### Subscription Guard Pattern
```javascript
function ensureSubscriptionActive(actionLabel) {
  if (!subscriptionExpired) return true;
  showStatus(`Gói đã hết hạn. Vui lòng nâng cấp để ${actionLabel}.`, 'error');
  return false;
}

// Sử dụng:
if (!ensureSubscriptionActive('lưu cấu hình video')) return;
```

### Error Handling
- `try/catch` blocks quanh fetch calls
- `showStatus(msg, type)` hiển thị lỗi inline (type: 'error', 'success', 'info')
- Fallback values khi API fail (VD: default voice list)
- `.catch(() => {})` cho non-critical errors

### HTML Escaping
```javascript
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

## CSS Patterns

### Design System
- **Theme**: Dark mode mặc định
- **CSS Variables**: `--bg`, `--text-color`, `--primary`, `--border`, `--bg-card`
- **Glassmorphism**: `backdrop-filter: blur()`, semi-transparent backgrounds
- **Font**: Inter (Google Fonts), weights 300-700
- **Colors**: 
  - Primary: `#10b981` (emerald green)
  - Danger: `#ef4444` (red)
  - Success: `#22c55e` (green)
  - Warning: `#d97706` (amber)

### Card-based Layout
- `.card` class cho các section chính
- `.modal-overlay` + `.modal-box` cho dialog
- `.status-badge` với color variants (`status-running`, `status-done`, `status-error`)

### Background Effects
- `.bg-blob` animated gradient blobs (3 blobs)
- Dark background with floating colored shapes

## Architectural Patterns

### Queue System
- Videos thêm vào queue → cấu hình từng video → xử lý tuần tự
- Job states: `uploaded → queued → running → done/error/paused`
- Single-job processing và batch queue processing

### SSE (Server-Sent Events) Streaming
- `/api/progress/{job_id}` stream events
- Event types: `log`, `step`, `progress`, `done`, `error`
- Client auto-reconnect on error

### Modal Config Pattern
- Modal mở → load config từ queue item
- Chỉnh sửa → collectModalConfig() → saveJobConfig() via API
- "Áp dụng cho tất cả" option cho batch config

### Auto-Update Flow
- IIFE pattern `(function() { ... })()`
- Singleton check promise ngăn multiple concurrent checks
- UI states: checking → found update → applying → success/fail
