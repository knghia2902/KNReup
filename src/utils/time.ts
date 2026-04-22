/**
 * Định dạng thời gian cho KNReup.
 * Đảm bảo tách biệt rõ ràng Giờ, Phút, Giây.
 */

/**
 * Định dạng: HH:mm:ss
 * Ví dụ: 12863 giây -> 03:34:23
 */
export function formatTime(secs: number, fps: number = 30): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00:00';
  
  const totalSeconds = Math.floor(secs);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  
  return `${hStr}:${mStr}:${sStr}`;
}

/**
 * Định dạng kèm Frame: HH:mm:ss:ff
 */
export function formatTimeWithFrames(secs: number, fps: number = 30): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00:00:00';
  
  const totalSeconds = Math.floor(secs);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor((secs % 1) * fps);
  
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  const fStr = frames.toString().padStart(2, '0');
  
  return `${hStr}:${mStr}:${sStr}:${fStr}`;
}

/**
 * Định dạng ngắn cho Ruler: HH:mm:ss hoặc mm:ss
 */
export function formatTimeShort(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
  
  const totalSeconds = Math.floor(secs);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  
  if (hours > 0) {
    const hStr = hours.toString().padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  
  return `${minutes}:${sStr}`;
}
