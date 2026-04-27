// === Clip Types ===
export type ClipType = 'video' | 'audio' | 'subtitle';

export interface Clip {
  id: string;                  // UUID format, e.g. crypto.randomUUID()
  trackId: string;             // 'main' | 'sub' | 'tts' | 'bgm'
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
export type TrackId = 'main' | 'sub' | 'tts' | 'bgm';

// Track order cho render: SUB trên Main, TTS/BGM dưới Main (D-02, D-03)
export const TRACK_ORDER: TrackId[] = ['sub', 'main', 'tts', 'bgm'];

export interface TrackMeta {
  id: TrackId;
  label: string;
  color: string;
  height: number;              // px — Main: 60, others: 40
  locked: boolean;
  visible: boolean;
  volume: number;              // 0.0 - 1.0
  muted: boolean;
}

// === Store State ===
export interface TimelineState {
  tracks: Record<TrackId, TrackMeta>;
  clips: Record<string, Clip | SubtitleClip>;   // clip registry by ID
  trackClips: Record<TrackId, string[]>;         // ordered clip IDs per track
  selectedClipId: string | null;
  zoom: number;
  scrollX: number;
  snapEnabled: boolean;
  snapThreshold: number;       // px
}
