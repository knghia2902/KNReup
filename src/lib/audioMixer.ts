/**
 * AudioMixer — Singleton quản lý Web Audio API routing graph
 * 
 * Routing:
 *   <video> → MediaElementSourceNode → originalGain → destination
 *   TTS AudioBufferSourceNodes → ttsGain → destination
 *   <audio> BGM → MediaElementSourceNode → bgmGain → destination
 *
 * Quy tắc:
 *   - createMediaElementSource() chỉ gọi 1 lần per element
 *   - AudioContext lazy init — chỉ tạo khi gọi init() lần đầu
 *   - Buffer cache: Map<string, AudioBuffer> — cache decoded TTS buffers
 *   - Active TTS source nodes: Set<AudioBufferSourceNode> — để cancel khi seek
 */

import { getMediaSrc } from '../utils/url';
import { sidecar } from './sidecar';
import { useProjectStore } from '../stores/useProjectStore';

// ─── Types ──────────────────────────────────────────────
interface TTSSegment {
  start: number;
  end: number;
  tts_audio_path?: string;
}

// ─── Singleton State ────────────────────────────────────
let ctx: AudioContext | null = null;
let originalGain: GainNode | null = null;
let ttsGain: GainNode | null = null;
let bgmGain: GainNode | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connectedVideo: any = null; // WeakRef<HTMLVideoElement>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connectedBGM: any = null; // WeakRef<HTMLAudioElement>

const bufferCache = new Map<string, AudioBuffer>();
const activeTTSSources = new Set<AudioBufferSourceNode>();

let originalVolumeBeforeMute = 1;
let bgmVolumeBeforeMute = 1;
let isMutedAll = false;

// ─── Visibility change handler ──────────────────────────
function handleVisibilityChange() {
  if (!ctx) return;
  if (document.hidden) {
    ctx.suspend();
  } else {
    ctx.resume();
  }
}

// ─── Init ───────────────────────────────────────────────
function init() {
  if (ctx) return;
  ctx = new AudioContext();
  originalGain = ctx.createGain();
  ttsGain = ctx.createGain();
  bgmGain = ctx.createGain();

  originalGain.connect(ctx.destination);
  ttsGain.connect(ctx.destination);
  bgmGain.connect(ctx.destination);

  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ─── Resume (call after user gesture) ───────────────────
async function resume() {
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// ─── Connect Video Element ─────────────────────────────
function connectVideo(videoEl: HTMLVideoElement) {
  if (!ctx || !originalGain) return;

  // Kiểm tra đã connect chưa — createMediaElementSource chỉ gọi 1 lần
  const existing = connectedVideo?.deref();
  if (existing === videoEl) return;

  try {
    const source = ctx.createMediaElementSource(videoEl);
    source.connect(originalGain);
    connectedVideo = new (globalThis as any).WeakRef(videoEl);
  } catch (e) {
    // Element đã được connect với AudioContext khác hoặc đã connect rồi
    console.warn('[AudioMixer] connectVideo failed:', e);
  }
}

// ─── Connect BGM Element ───────────────────────────────
function connectBGM(audioEl: HTMLAudioElement) {
  if (!ctx || !bgmGain) return;

  const existing = connectedBGM?.deref();
  if (existing === audioEl) return;

  try {
    const source = ctx.createMediaElementSource(audioEl);
    source.connect(bgmGain);
    connectedBGM = new (globalThis as any).WeakRef(audioEl);
  } catch (e) {
    console.warn('[AudioMixer] connectBGM failed:', e);
  }
}

function setOriginalVolume(v: number) {
  const newVol = Math.max(0, Math.min(2, v));
  if (isMutedAll) {
    originalVolumeBeforeMute = newVol;
  } else if (originalGain) {
    originalGain.gain.value = newVol;
  }
  
  // NATIVE FALLBACK: Đảm bảo set song song native volume nếu audio context bị lỗi / không capture được.
  const videoEl = connectedVideo?.deref();
  if (videoEl) {
    videoEl.volume = Math.min(newVol, 1);
  }
}

function setTTSVolume(v: number) {
  if (ttsGain) ttsGain.gain.value = Math.max(0, Math.min(2, v));
}

function setBGMVolume(v: number) {
  const newVol = Math.max(0, Math.min(2, v));
  if (isMutedAll) {
    bgmVolumeBeforeMute = newVol;
  } else if (bgmGain) {
    bgmGain.gain.value = newVol;
  }
  
  // NATIVE FALLBACK
  const bgmEl = connectedBGM?.deref();
  if (bgmEl) {
    bgmEl.volume = Math.min(newVol, 1);
  }
}

function muteAll(shouldMute: boolean) {
  if (shouldMute && !isMutedAll) {
    isMutedAll = true;
    if (originalGain) {
      originalVolumeBeforeMute = originalGain.gain.value;
      originalGain.gain.value = 0;
    }
    if (bgmGain) {
      bgmVolumeBeforeMute = bgmGain.gain.value;
      bgmGain.gain.value = 0;
    }
    
    const vEl = connectedVideo?.deref();
    if (vEl) vEl.muted = true;
    const bEl = connectedBGM?.deref();
    if (bEl) bEl.muted = true;
    
  } else if (!shouldMute && isMutedAll) {
    isMutedAll = false;
    if (originalGain) {
      originalGain.gain.value = originalVolumeBeforeMute;
    }
    if (bgmGain) {
      bgmGain.gain.value = bgmVolumeBeforeMute;
    }
    
    const vEl = connectedVideo?.deref();
    if (vEl) vEl.muted = false;
    const bEl = connectedBGM?.deref();
    if (bEl) bEl.muted = false;
  }
}

// ─── Load TTS Buffer ───────────────────────────────────
async function loadTTSBuffer(path: string): Promise<AudioBuffer | null> {
  if (!ctx) return null;

  // Check cache first
  const cached = bufferCache.get(path);
  if (cached) return cached;

  try {
    let mediaSrc: string | null = null;
    const projectId = useProjectStore.getState().currentProjectId;
    
    if (path && !path.startsWith('http') && !path.includes('/') && !path.includes('\\')) {
      if (projectId) {
         mediaSrc = `${sidecar.getBaseUrl()}/api/projects/${projectId}/audio/${encodeURIComponent(path)}`;
      } else {
         mediaSrc = getMediaSrc(path);
      }
    } else {
      mediaSrc = getMediaSrc(path);
    }

    if (!mediaSrc) return null;

    const response = await fetch(mediaSrc);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(path, audioBuffer);
    return audioBuffer;
  } catch (e) {
    console.warn('[AudioMixer] loadTTSBuffer failed for:', path, e);
    return null;
  }
}

// ─── Preload TTS Buffers ───────────────────────────────
async function preloadTTSBuffers(segments: TTSSegment[]) {
  const paths = segments
    .map(s => s.tts_audio_path)
    .filter((p): p is string => !!p);

  const uniquePaths = [...new Set(paths)];
  await Promise.allSettled(uniquePaths.map(p => loadTTSBuffer(p)));
}

// ─── Schedule TTS ──────────────────────────────────────
async function scheduleTTS(segments: TTSSegment[], startTime: number) {
  if (!ctx || !ttsGain) return;

  // Cancel existing
  cancelTTS();

  // Ensure context is running
  await resume();

  const now = ctx.currentTime;

  for (const seg of segments) {
    if (!seg.tts_audio_path) continue;
    // Skip segments that have already ended
    if (seg.end < startTime) continue;

    const buffer = await loadTTSBuffer(seg.tts_audio_path);
    if (!buffer) continue;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ttsGain);

    const delay = Math.max(0, seg.start - startTime);
    const offset = startTime > seg.start ? startTime - seg.start : 0;
    const duration = buffer.duration - offset;

    if (duration <= 0) continue;

    source.start(now + delay, offset, duration);

    // Track để cancel
    activeTTSSources.add(source);
    source.onended = () => {
      activeTTSSources.delete(source);
    };
  }
}

// ─── Cancel TTS ────────────────────────────────────────
function cancelTTS() {
  activeTTSSources.forEach(source => {
    try {
      source.stop();
    } catch {
      // Already stopped
    }
  });
  activeTTSSources.clear();
}

// ─── Dispose ───────────────────────────────────────────
function dispose() {
  cancelTTS();
  bufferCache.clear();

  if (ctx) {
    ctx.close();
    ctx = null;
  }

  originalGain = null;
  ttsGain = null;
  bgmGain = null;
  connectedVideo = null;
  connectedBGM = null;

  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// ─── Export ────────────────────────────────────────────
export const AudioMixer = {
  init,
  resume,
  connectVideo,
  connectBGM,
  setOriginalVolume,
  setTTSVolume,
  setBGMVolume,
  muteAll,
  loadTTSBuffer,
  preloadTTSBuffers,
  scheduleTTS,
  cancelTTS,
  dispose,
  /** Expose for debugging */
  get context() { return ctx; },
  get bufferCacheSize() { return bufferCache.size; },
  get activeSourceCount() { return activeTTSSources.size; },
};
