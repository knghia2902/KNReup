import { useQueueStore } from '../../stores/queueStore';

export function QueueTab() {
  const jobs = useQueueStore(s => s.jobs);
  const clearCompleted = useQueueStore(s => s.clearCompleted);
  const removeJob = useQueueStore(s => s.removeJob);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pshd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>RENDER QUEUE</span>
        {jobs.some(j => j.status === 'completed' || j.status === 'failed') && (
          <button 
            className="btn" 
            onClick={clearCompleted} 
            style={{ padding: '2px 8px', fontSize: '9px', height: '20px' }}
          >
            Clear Done
          </button>
        )}
      </div>
      
      {jobs.length === 0 ? (
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'center', gap: '12px', padding: '40px 20px',
          color: 'var(--text-disabled)'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="32" height="32" style={{ opacity: 0.3 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <div style={{ fontSize: '11px', textAlign: 'center' }}>No jobs in queue.<br/>Use the OUT tab to add exports.</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ 
              padding: '10px', background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', borderRadius: '8px',
              transition: 'border-color 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ 
                  fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  padding: '2px 6px', borderRadius: '4px',
                  background: job.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : job.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-subtle)',
                  color: job.status === 'completed' ? '#22c55e' : job.status === 'failed' ? '#ef4444' : 'var(--accent)'
                }}>
                  {job.status === 'processing' ? `${Math.round(job.progress)}%` : job.status}
                </span>
                
                {job.status !== 'processing' && (
                  <button 
                    className="btn" 
                    onClick={() => removeJob(job.id)} 
                    style={{ padding: '2px 6px', fontSize: '9px', height: '18px', color: '#ef4444', borderColor: 'transparent' }}
                  >✕</button>
                )}
              </div>
              
              <div style={{ 
                height: '3px', background: 'var(--border)', borderRadius: '2px', 
                overflow: 'hidden', marginBottom: '8px'
              }}>
                <div style={{ 
                  height: '100%', width: `${job.progress}%`, 
                  background: job.status === 'failed' ? '#ef4444' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                  borderRadius: '2px'
                }} />
              </div>
              
              <div style={{ 
                fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', 
                overflow: 'hidden', textOverflow: 'ellipsis' 
              }} title={job.videoPath}>
                {job.videoPath.split(/[\\/]/).pop()}
              </div>
              
              {job.message && <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>{job.message}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
