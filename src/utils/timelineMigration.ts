import { Clip, SubtitleClip } from '../types/timeline';
import { ProjectConfig } from '../stores/useProjectStore';

// Re-export SubtitleSegment interface cho typing
export interface SubtitleSegmentCompat {
  id: number;
  start: number;
  end: number;
  source_text: string;
  translated_text: string;
  confidence: number;
  tts_status: 'pending' | 'generated' | 'error';
  tts_audio_path?: string;
}

/**
 * Chuyển đổi ProjectStore video config → Clip trên Main Track
 * timelineStart = vid_clip_start (clip position khớp video time, giữ subtitle sync)
 */
export function projectToVideoClip(
  config: Pick<ProjectConfig, 'vid_clip_start' | 'vid_clip_duration'>,
  videoPath: string,
  videoDuration: number
): Clip {
  return {
    id: 'vid-main-clip',  // Stable ID — sync useEffect runs repeatedly, must not create duplicates
    trackId: 'main',
    type: 'video',
    sourceFile: videoPath,
    sourceStart: config.vid_clip_start || 0,
    sourceDuration: videoDuration,
    timelineStart: config.vid_clip_start || 0,
    timelineDuration: config.vid_clip_duration || videoDuration,
  };
}

/**
 * Chuyển đổi ProjectStore audio config → Clip trên BGM Track
 */
export function projectToAudioClip(
  config: Pick<ProjectConfig, 'audio_enabled' | 'audio_file' | 'audio_clip_start' | 'audio_clip_duration' | 'audio_timeline_start'>
): Clip | null {
  if (!config.audio_enabled || !config.audio_file) return null;
  return {
    id: 'bgm-main-clip',  // Stable ID
    trackId: 'bgm',
    type: 'audio',
    sourceFile: config.audio_file,
    sourceStart: config.audio_clip_start || 0,
    sourceDuration: config.audio_clip_duration || 200,
    timelineStart: config.audio_timeline_start || 0,
    timelineDuration: config.audio_clip_duration || 200,
  };
}

/**
 * Chuyển đổi SubtitleSegment[] → SubtitleClip[] trên SUB Track
 * Giữ nguyên tts_audio_path cho liên kết sub↔TTS (D-06)
 */
export function segmentsToSubtitleClips(segments: SubtitleSegmentCompat[]): SubtitleClip[] {
  return segments.map(seg => ({
    id: `sub-${seg.id}`,        // Backward-compatible ID format
    trackId: 'sub' as const,
    type: 'subtitle' as const,
    sourceFile: '',
    sourceStart: seg.start,
    sourceDuration: seg.end - seg.start,
    timelineStart: seg.start,
    timelineDuration: seg.end - seg.start,
    sourceText: seg.source_text,
    translatedText: seg.translated_text,
    confidence: seg.confidence,
    ttsStatus: seg.tts_status,
    ttsAudioPath: seg.tts_audio_path,
  }));
}

/**
 * Chuyển ngược SubtitleClip[] → SubtitleSegment[] cho AudioMixer compatibility
 */
export function subtitleClipsToSegments(clips: SubtitleClip[]): SubtitleSegmentCompat[] {
  return clips.map((clip, index) => ({
    id: index,
    start: clip.timelineStart,
    end: clip.timelineStart + clip.timelineDuration,
    source_text: clip.sourceText,
    translated_text: clip.translatedText,
    confidence: clip.confidence,
    tts_status: clip.ttsStatus,
    tts_audio_path: clip.ttsAudioPath,
  }));
}
