import { useVideoGenLabStore } from '../../stores/useVideoGenLabStore';
import { LabSequencePlayer } from './LabSequencePlayer';
import { LabVideoPreview } from './LabVideoPreview';
import { LabLivePreview } from './LabLivePreview';
import { FilmStrip } from '@phosphor-icons/react';

const phoneFrame: React.CSSProperties = {
  height: '100%',
  maxHeight: '85vh',
  aspectRatio: '9/16',
  backgroundColor: 'var(--vgl-bg)',
  borderRadius: '32px',
  border: '1px solid var(--vgl-border)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
};

export function LabOutputPanel() {
  const store = useVideoGenLabStore();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'auto' }}>
      <div style={phoneFrame}>

        {/* IDLE: Live Preview with Sample Data */}
        {store.pipelineStatus === 'idle' && (
           <LabLivePreview />
        )}

        {/* RUNNING: progress logs */}
        {store.pipelineStatus === 'running' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
             <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
               {store.logs.slice(-4).map((l, i, arr) => (
                 <div key={i} style={{ 
                   fontSize: i === arr.length - 1 ? '15px' : '13px', 
                   color: i === arr.length - 1 ? 'var(--vgl-accent)' : 'var(--vgl-muted)',
                   fontWeight: i === arr.length - 1 ? 600 : 400,
                   textAlign: 'center',
                   transition: 'all 0.3s ease'
                 }}>
                   {l.message}
                 </div>
               ))}
             </div>
             
             {/* Progress bar */}
             <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
               <div style={{ height: '6px', backgroundColor: 'var(--vgl-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${store.overallProgress}%`, 
                    backgroundColor: 'var(--vgl-accent)', 
                    transition: 'width 0.3s var(--spring-smooth)' 
                  }} />
               </div>
               <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px', fontWeight: 700, color: 'var(--vgl-accent)' }}>
                 {store.overallProgress}%
               </div>
             </div>
          </div>
        )}

        {/* PAUSED: sequence preview inside phone frame */}
        {store.pipelineStatus === 'paused' && (
           <LabSequencePlayer />
        )}

        {/* COMPLETE: video player */}
        {store.pipelineStatus === 'complete' && (
           <LabVideoPreview />
        )}

        {/* ERROR */}
        {store.pipelineStatus === 'error' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--vgl-danger)', padding: '24px', textAlign: 'center' }}>
             <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Lỗi hệ thống</div>
             <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{store.logs[store.logs.length - 1]?.message || "Đã xảy ra lỗi không xác định."}</div>
           </div>
        )}

      </div>
    </div>
  );
}
