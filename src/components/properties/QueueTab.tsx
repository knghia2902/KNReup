import { useQueueStore } from '../../stores/queueStore';

export function QueueTab() {
  const jobs = useQueueStore(s => s.jobs);
  const clearCompleted = useQueueStore(s => s.clearCompleted);
  const removeJob = useQueueStore(s => s.removeJob);

  return (
    <div className="ps" style={{ borderBottom: 'none' }}>
      <div className="pshd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Export Queue</span>
        {jobs.some(j => j.status === 'completed' || j.status === 'failed') && (
          <button className="btn sm" onClick={clearCompleted} style={{ padding: '2px 6px', fontSize: 11 }}>
            Clear Done
          </button>
        )}
      </div>
      
      {jobs.length === 0 ? (
        <div style={{ padding: 12, opacity: 0.5, textAlign: 'center', fontSize: 13 }}>No jobs in queue</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => (
            <div key={job.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span className={`fcbadge ${job.status === 'completed' ? 'ok' : job.status === 'failed' ? 'error' : 'warn'}`}>
                  {job.status.toUpperCase()}
                </span>
                <span style={{ opacity: 0.8 }}>{Math.round(job.progress)}%</span>
              </div>
              
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${job.progress}%`, 
                    background: job.status === 'failed' ? '#ff3b30' : 'var(--accent)',
                    transition: 'width 0.3s'
                  }} 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={job.videoPath}>
                  {job.videoPath.split(/[\\/]/).pop()}
                </div>
                
                {job.status !== 'processing' && (
                   <button className="btn sm" onClick={() => removeJob(job.id)} style={{ padding: '2px 6px', fontSize: 10 }}>Remove</button>
                )}
              </div>
              
              {job.message && <div style={{ fontSize: 11, color: 'var(--i4)', marginTop: 4 }}>{job.message}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
