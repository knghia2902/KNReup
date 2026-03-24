/**
 * JobMonitor — Background processing progress toast (taste-skill compliant).
 */
import { X, CircleNotch, HardDrive, PlayCircle, ChatText, MusicNotes, Export } from '@phosphor-icons/react';
import type { PipelineProgress } from '../../hooks/usePipeline';
import './JobMonitor.css';

interface JobMonitorProps {
  progress: PipelineProgress;
  onCancel: () => void;
  onDismiss: () => void;
}

export function JobMonitor({ progress, onCancel, onDismiss }: JobMonitorProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'upload': return <HardDrive size={16} />;
      case 'transcribe': return <ChatText size={16} />;
      case 'translate': return <ChatText size={16} />;
      case 'tts': return <MusicNotes size={16} />;
      case 'merge': return <Export size={16} />;
      default: return <PlayCircle size={16} />;
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'upload': return 'Extracting';
      case 'transcribe': return 'Transcribing';
      case 'translate': return 'Translating';
      case 'tts': return 'Synthesizing Audio';
      case 'merge': return 'Exporting Video';
      case 'done': return 'Finished';
      case 'error': return 'Error';
      default: return 'Processing';
    }
  };

  const isDone = progress.stage === 'done';
  const isError = progress.stage === 'error';

  return (
    <div className={`job-monitor glass-panel ${isDone ? 'done' : ''} ${isError ? 'error' : ''}`}>
      <div className="job-top">
        <div className="job-stage-badge">
           {!isDone && !isError && <CircleNotch size={14} className="dep-spin" />}
           <span>{getStageLabel(progress.stage)}</span>
        </div>
        {!isDone && !isError ? (
          <button className="job-cancel-btn" onClick={onCancel} title="Cancel">
            <X size={14} />
          </button>
        ) : (
          <button className="job-cancel-btn" onClick={onDismiss} title="Dismiss">
            <X size={14} />
          </button>
        )}
      </div>
      
      <div className="job-message">{progress.message}</div>
      
      {!isDone && !isError && (
        <div className="job-progress-container">
          <div 
            className="job-progress-bar" 
            style={{ width: `${progress.progress}%` }} 
          />
        </div>
      )}
    </div>
  );
}
