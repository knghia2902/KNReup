import React, { useRef, useEffect } from 'react';
import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';

export function LabLogView() {
  const logs = useVideoGenLabStore((s) => s.logs);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'monospace', backgroundColor: '#0d1117' }}>
        Nhấn Generate để bắt đầu pipeline...
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✅';
      case 'error': return '❌';
      case 'paused': return '⏳';
      case 'running': return '🔄';
      default: return '▶';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#3fb950'; // green
      case 'error': return '#f85149'; // red
      case 'paused': return '#d29922'; // yellow
      case 'running': return '#58a6ff'; // blue
      default: return '#8b949e'; // gray
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      overflowY: 'auto', 
      backgroundColor: '#0d1117', 
      color: '#c9d1d9',
      fontFamily: 'Consolas, "JetBrains Mono", monospace',
      fontSize: '13px',
      padding: '16px',
      lineHeight: '1.5'
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          <span style={{ color: '#8b949e', whiteSpace: 'nowrap' }}>[{log.timestamp}]</span>
          <span style={{ width: '20px', textAlign: 'center' }}>{getStatusIcon(log.status)}</span>
          <span style={{ color: getStatusColor(log.status), width: '80px', fontWeight: 'bold' }}>{log.stepName || `Step ${log.step}`}</span>
          <span style={{ flex: 1, wordBreak: 'break-all' }}>{log.message}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
