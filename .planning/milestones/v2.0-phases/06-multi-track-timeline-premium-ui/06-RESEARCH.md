# Phase 6: Timeline & Premium UI

## Standard Stack

- **Audio Visualizer**: `wavesurfer.js` (v7) — latest version, natively supports multi-track extensions and region plugins if needed in the future.
- **Frontend State**: `Zustand` (already in `useProjectStore`) but with careful isolation for high-frequency updates.
- **Backend Thumbnail Engine**: `ffmpeg` direct CLI via `subprocess` or `asyncio.create_subprocess_exec` running behind an `asyncio.Semaphore` in the FastAPI sidecar.
- **Event Handling**: Native React DOM Events (`onPointerDown`, `onPointerMove`, `onWheel`) over heavy drag-and-drop libraries to maintain pixel-perfect precision needed for zooming and playhead scrubbing.

## Architecture Patterns

### 1. Master-Slave Synchronization
Do not let multiple components have competing sources of truth for Current Time.
- **Master Time**: `useProjectStore` holds `currentTime` for standard UI re-renders, BUT during active playback or scrubbing, bypass the store to update the DOM directly (using raw refs/callbacks) or rely directly on the HTML5 `<video>` timeupdate event to push to Wavesurfer to prevent React from re-rendering 60FPS and causing severe lag.
- **Scrubbing/Playhead**: `wavesurfer` provides `audioprocess` or `timeupdate`. Use this to drive the playhead UI. The HTML `<video>` should `seek()` based on wavesurfer's progression.

### 2. Multi-API Key Tab Structure
- Do not build a popup modal. 
- Create a dedicated standard `Tab` under `src/components/properties/SettingsTab.tsx` or similar that persists across rerenders. Use a standard List/Form design.

### 3. Asynchronous Dynamic Thumbnail Caching (Bounded Queue)
To implement the 06-CONTEXT requirement (Dynamic Thumbnails with Cache):
- **Frontend**: Computes visible time ranges. Sends chunk requests: `get_thumbnail(time=10.5)`.
- **Backend**: FastAPI route calculates chunk index. If thumbnail exists in Project Cache folder, returns it. If not, pushes to a small `Worker Queue`.
- **Worker**: A background thread running `ffmpeg -y -ss {time} -i {video} -vframes 1 -q:v 2 -s 320x180 {cache_path}`.

## Don't Hand-Roll

- **Waveform calculation**: Trust `wavesurfer.js`. Do not parse audio blobs and render `<canvas>` elements manually.
- **Drag primitives for Subtitles**: For simple left/right and width changes, `react-rnd` or simple `useRef` + `onPointerMove` is sufficient. Don't build custom physics engines.
- **Keybinding interception**: Don't bind raw `window.addEventListener('keydown')` without checking if the user is typing in a text input (Subtitle editor). Always check `document.activeElement`.

## Common Pitfalls

- **Zustand Re-render Hell**: Putting a `requestAnimationFrame` update of `currentTime` into Zustand will freeze the UI. **Solution**: Use `useStore.setState({ currentTime })` sparingly, or use transient updates (subscribe to store without forcing react render).
- **FFmpeg CPU Bomb**: Front-end requests 50 thumbnails at once when zoomed out. Sidecar spawns 50 FFmpeg instances. OS crashes. **Solution**: Implement a concurrency limiter (`asyncio.Semaphore(2)`) in the thumbnail generation route.
- **Timeline Stutter on Zoom**: Re-rendering 500 subtitle DOM elements during a zoom action is costly. **Solution**: Use React `useMemo`, or DOM-level CSS transforms for timeline scaling (`transform: scaleX(z)`), then triggering a re-render once zooming finishes.
- **Wavesurfer React StrictMode Duplication**: In dev mode, React mounts `useEffect` twice. `wavesurfer.create` will make two overlapping waves. **Solution**: Check if `wavesurferRef.current` exists before creating, and ensure `.destroy()` fires accurately.

## Code Examples

### FastAPI Concurrency Limiter for Thumbnails
```python
import asyncio
from fastapi import APIRouter

router = APIRouter()
thumb_semaphore = asyncio.Semaphore(2) # Limit to 2 ffmpeg instances

@router.get("/api/thumbnail")
async def get_thumbnail(time: float, project_dir: str):
    # Check cache first
    cache_path = Path(project_dir) / f"thumb_{time}.jpg"
    if cache_path.exists():
        return FileResponse(cache_path)
    
    async with thumb_semaphore:
        # Spawn ffmpeg
        proc = await asyncio.create_subprocess_exec(
            'ffmpeg', '-y', '-ss', str(time), '-i', input_video, 
            '-vframes', '1', '-q:v', '5', '-s', '160x90', str(cache_path)
        )
        await proc.communicate()
        
    return FileResponse(cache_path)
```

### React Wavesurfer Strict Mode Safe Mount
```tsx
const waveContainerRef = useRef<HTMLDivElement>(null);
const wavesurfer = useRef<WaveSurfer | null>(null);

useEffect(() => {
  if (waveContainerRef.current && !wavesurfer.current) {
    wavesurfer.current = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: 'violet',
      progressColor: 'purple'
    });
    wavesurfer.current.load('url-to-audio');
  }
  
  return () => {
    wavesurfer.current?.destroy();
    wavesurfer.current = null;
  };
}, []);
```
