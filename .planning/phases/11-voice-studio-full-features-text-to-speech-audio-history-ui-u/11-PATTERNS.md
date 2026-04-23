# Phase 11: Voice Studio Full Features - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 12
**Analogs found:** 10 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/tools/VoiceStudioWindow.tsx` | component | request-response | `src/components/tools/VoiceCloneWindow.tsx` | exact |
| `src/components/tools/voicestudio/TTSTab.tsx` | component | request-response | `src/components/properties/TextTab.tsx` | role-match |
| `src/components/tools/voicestudio/CloneTab.tsx` | component | request-response | `src/components/tools/VoiceCloneWindow.tsx` | role-match |
| `src/components/tools/voicestudio/DesignTab.tsx` | component | request-response | `src/components/tools/VoiceCloneWindow.tsx` | role-match |
| `src/components/tools/voicestudio/HistoryPanel.tsx` | component | CRUD | `src/components/downloader/DownloaderWindow.tsx` | role-match |
| `src/stores/useVoiceStudioStore.ts` | store | request-response | `src/stores/useProjectStore.ts` | role-match |
| `src/components/setup/HomeLauncher.tsx` | component | event-driven | N/A (Modified) | - |
| `src/utils/windowManager.ts` | utility | request-response | N/A (Modified) | - |
| `python-sidecar/app/routes/voice_studio.py` | route | CRUD | `python-sidecar/app/routes/tts_profiles.py` | exact |
| `python-sidecar/app/utils/history_manager.py` | utility | file-I/O | `python-sidecar/app/utils/path_utils.py` | role-match |

## Pattern Assignments

### `src/components/tools/VoiceStudioWindow.tsx` (component, request-response)

**Analog:** `src/components/tools/VoiceCloneWindow.tsx`

**Tab Selection Pattern** (lines 35-50):
```typescript
const [activeTab, setActiveTab] = useState<'clone' | 'design' | 'tts'>('tts');

// ... in JSX
<div className="vc-tab-selector">
  <button 
    className={`vc-tab-btn ${activeTab === 'tts' ? 'active' : ''}`}
    onClick={() => setActiveTab('tts')}
  >
    <Waveform size={18} weight="fill" />
    Text-to-Speech
  </button>
  {/* ... other tabs ... */}
</div>
```

**Window Setup Pattern** (lines 1-15):
```typescript
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { sidecar } from '../../lib/sidecar';
// ... phosphor icons ...

export function VoiceStudioWindow() {
  const { connected } = useSidecar();
  useTheme();
  // ...
}
```

---

### `src/components/tools/voicestudio/TTSTab.tsx` (component, request-response)

**Analog:** `src/components/properties/TextTab.tsx`

**TTS Settings Pattern** (lines 100-140):
```typescript
import { SelectControl } from '../../controls/SelectControl';
import { SliderControl } from '../../controls/SliderControl';

// Using standard controls
<SelectControl 
  label="Engine" 
  value={engine} 
  onChange={setEngine}
  options={[
    { value: 'edge_tts', label: 'Edge TTS' },
    { value: 'elevenlabs', label: 'ElevenLabs' },
    { value: 'omnivoice', label: 'OmniVoice' },
  ]} 
/>

<SliderControl 
  label="Speed" 
  value={speed} 
  min={0.5} max={2.0} step={0.1} unit="x" 
  onChange={setSpeed}
/>
```

---

### `python-sidecar/app/routes/voice_studio.py` (route, CRUD)

**Analog:** `python-sidecar/app/routes/tts_profiles.py`

**Audio History Endpoint Pattern**:
```python
@router.get("/history")
async def list_history():
    """List all audio history from local storage."""
    try:
        # Use history_manager to get list
        history = history_manager.get_all()
        return {"history": history}
    except Exception as e:
        logger.error(f"Error listing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_tts(req: TTSRequest):
    """Generate TTS and save to history."""
    # Logic to call existing TTS engines and save file
    # path = await engine.generate(...)
    # metadata = history_manager.save(path, req.text, req.config)
    # return metadata
```

---

## Shared Patterns

### Audio Player Logic
**Source:** `src/components/tools/VoiceCloneWindow.tsx` (lines 160-185)
**Apply to:** All tabs and HistoryPanel
```typescript
const togglePlay = (id: string, audioRef: React.RefObject<HTMLAudioElement | null>) => {
  const audio = audioRef.current;
  if (!audio) return;

  if (playingId === id) {
    audio.pause();
    setPlayingId(null);
  } else {
    // Stop all others and play selected
    // ...
    audio.play();
    setPlayingId(id);
  }
};
```

### File Sanitization
**Source:** `python-sidecar/app/routes/tts_profiles.py` (line 74)
**Apply to:** Backend file saving logic
```python
safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', req.profile_name)
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `python-sidecar/app/utils/history_manager.py` | utility | file-I/O | No dedicated local history manager exists yet (cloning profiles is simpler). |
| `src/components/tools/voicestudio/HistoryPanel.tsx` | component | CRUD | First dedicated history list component in a tool window. |

## Metadata

**Analog search scope:** `src/components/`, `python-sidecar/app/`
**Files scanned:** ~50
**Pattern extraction date:** 2026-04-23
