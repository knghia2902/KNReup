// === Clip Types ===
export type ClipType = 'video' | 'audio' | 'subtitle';

export interface Clip {
  id: string;                  // UUID format, e.g. crypto.randomUUID()
  trackId: string;             // 'main' | 'sub' | 'tts' | 'bgm' | 'overlay-N'
  type: ClipType;
  sourceFile: string;          // Đường dẫn file gốc
  sourceStart: number;         // Điểm bắt đầu cắt trong file gốc (giây)
  sourceDuration: number;      // Thời lượng cắt từ file gốc (giây)
  timelineStart: number;       // Vị trí trên timeline (giây)
  timelineDuration: number;    // Thời lượng hiển thị trên timeline (giây)
}

// SubtitleClip mở rộng Clip với text fields
export interface SubtitleClip extends Clip {
  type: 'subtitle';
  sourceText: string;
  translatedText: string;
  confidence: number;
  ttsStatus: 'pending' | 'generated' | 'error';
  ttsAudioPath?: string;
}

// === Track Types ===
export type FixedTrackId = 'main' | 'sub' | 'tts' | 'bgm';
export type OverlayTrackId = `overlay-${number}`;
export type TrackId = FixedTrackId | OverlayTrackId;

// Fixed track order (không bao gồm overlay — overlay được tính dynamic)
export const FIXED_TRACK_ORDER: FixedTrackId[] = ['sub', 'main', 'tts', 'bgm'];

/**
 * Tạo track order đầy đủ bao gồm overlay tracks.
 * Overlay tracks nằm giữa SUB và MAIN.
 * Render order: [sub, overlay-N, ..., overlay-1, main, tts, bgm]
 */
export function getTrackOrder(overlayIds: OverlayTrackId[]): string[] {
  // Sort overlay IDs theo số giảm dần (overlay-N trên, overlay-1 dưới gần main)
  const sorted = [...overlayIds].sort((a, b) => {
    const numA = parseInt(a.replace('overlay-', ''));
    const numB = parseInt(b.replace('overlay-', ''));
    return numB - numA;
  });
  // sub → overlay-N ... overlay-1 → main → tts → bgm
  return ['sub', ...sorted, 'main', 'tts', 'bgm'];
}

/** Type guard: kiểm tra trackId có phải overlay track */
export function isOverlayTrack(trackId: string): trackId is OverlayTrackId {
  return /^overlay-\d+$/.test(trackId);
}

/** Kiểm tra trackId có phải fixed track */
export function isFixedTrack(trackId: string): trackId is FixedTrackId {
  return ['main', 'sub', 'tts', 'bgm'].includes(trackId);
}

export interface TrackMeta {
  id: string;
  label: string;
  color: string;
  height: number;              // px — Main: 60, overlay: 50, others: 40
  locked: boolean;
  visible: boolean;
  volume: number;              // 0.0 - 1.0
  muted: boolean;
}

// === Store State ===
export interface TimelineState {
  tracks: Record<string, TrackMeta>;           // dynamic keys (fixed + overlay)
  clips: Record<string, Clip | SubtitleClip>;
  trackClips: Record<string, string[]>;        // ordered clip IDs per track (dynamic)
  selectedClipId: string | null;
  zoom: number;
  scrollX: number;
  snapEnabled: boolean;
  snapThreshold: number;       // px
  overlayTrackIds: OverlayTrackId[];           // ordered list of active overlay tracks
}
