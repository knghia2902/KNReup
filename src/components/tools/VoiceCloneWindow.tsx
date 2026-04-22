/**
 * VoiceCloneWindow — Standalone tool window for Voice Cloning
 * Phase 09: Placeholder UI, full implementation in future phase.
 */
import { Microphone, CloudArrowUp } from '@phosphor-icons/react';

export function VoiceCloneWindow() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: 'var(--bg-primary, #111)',
      color: 'var(--text-primary, #eee)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <Microphone size={48} weight="duotone" style={{ color: 'var(--accent, #7c6aef)' }} />
      <h2 style={{ margin: 0, fontSize: 20 }}>Voice Clone</h2>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, #888)', textAlign: 'center', maxWidth: 300 }}>
        Tải lên bản ghi giọng mẫu để tạo giọng nói AI tùy chỉnh cho video của bạn.
      </p>
      <button style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 20px',
        fontSize: 13,
        fontWeight: 600,
        background: 'var(--accent, #7c6aef)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        opacity: 0.5,
      }} disabled>
        <CloudArrowUp size={16} weight="bold" />
        Tải lên giọng mẫu (Coming Soon)
      </button>
    </div>
  );
}
