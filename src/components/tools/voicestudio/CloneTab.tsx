import React, { useState, useRef, useCallback, useEffect } from 'react';
import { sidecar } from '../../../lib/sidecar';
import { UploadSimple, MusicNotes, XCircle, WarningCircle, Play, Pause } from '@phosphor-icons/react';

interface CloneTabProps {
  connected: boolean;
}

export function CloneTab({ connected }: CloneTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; duration: number; format: string } | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<{ original_audio?: string; cloned_audio?: string } | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const clonedAudioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const validExts = ['wav', 'mp3', 'ogg', 'flac', 'm4a'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExts.includes(ext)) {
      setCloneError('Định dạng file không hỗ trợ. Dùng WAV, MP3, OGG, FLAC, M4A.');
      return;
    }
    
    setSelectedFile(file);
    setCloneError(null);
    setCloneResult(null);

    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      setFileInfo({
        name: file.name,
        duration: audio.duration,
        format: ext.toUpperCase()
      });
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClone = async () => {
    if (!selectedFile || !cloneName.trim()) return;
    setIsCloning(true);
    setCloneError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('profile_name', cloneName.trim());
    
    try {
      const baseUrl = sidecar.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/tts/profiles/clone`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Clone thất bại');
      const data = await res.json();
      
      setCloneResult({
        original_audio: URL.createObjectURL(selectedFile),
        cloned_audio: `${baseUrl}/api/tts/profiles/${data.profile_name}/audio`
      });
      setCloneName('');
      setSelectedFile(null);
      setFileInfo(null);
      // Removed fetchProfiles from here to decouple logic, we will rely on history/global store later
    } catch (err: any) {
      setCloneError(`Clone thất bại: ${err.message}. Thử lại với file audio khác.`);
    } finally {
      setIsCloning(false);
    }
  };

  const togglePlay = (id: string, audioRef: React.RefObject<HTMLAudioElement | null>) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
    } else {
      if (originalAudioRef.current) originalAudioRef.current.pause();
      if (clonedAudioRef.current) clonedAudioRef.current.pause();
      
      audio.load();
      audio.play().then(() => {
        setPlayingId(id);
      }).catch(err => {
        console.error('Audio play error:', err);
        setPlayingId(null);
      });
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!connected) {
    return (
      <div className="vc-empty-placeholder">
        <WarningCircle size={48} weight="duotone" className="vc-ep-icon" color="var(--vc-danger)" />
        <h3>Engine Offline</h3>
        <p>OmniVoice engine chưa khởi động. Vui lòng kiểm tra Python sidecar.</p>
      </div>
    );
  }

  return (
    <div className="vc-card">
      <h2 className="vc-card-title">Tạo bản sao giọng</h2>
      
      {!selectedFile ? (
        <div 
          className={`vc-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".wav,.mp3,.ogg,.flac,.m4a"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
          />
          <div className="vc-icon-circle">
            <UploadSimple size={28} weight="duotone" />
          </div>
          <div className="vc-dropzone-text">
            <strong>Kéo thả file âm thanh</strong>
            <span>WAV, MP3, FLAC · Dưới 30 giây</span>
          </div>
        </div>
      ) : (
        <div className="vc-file-pill">
          <MusicNotes size={20} weight="duotone" color="var(--vc-accent)" />
          <span>{fileInfo?.name}</span>
          <span style={{ color: 'var(--vc-slate)' }}>{fileInfo?.format}</span>
          <span style={{ color: 'var(--vc-slate)' }}>{formatDuration(fileInfo?.duration || 0)}s</span>
          <button 
            className="vc-file-pill-close"
            onClick={() => { setSelectedFile(null); setFileInfo(null); }}
          >
            <XCircle size={16} weight="bold" />
          </button>
        </div>
      )}

      {fileInfo && fileInfo.duration > 10 && fileInfo.duration <= 30 && (
        <div className="vc-banner warning">
          <WarningCircle size={18} weight="fill" />
          Độ dài {formatDuration(fileInfo.duration)}s. Lý tưởng nhất là 3-10 giây.
        </div>
      )}
      {fileInfo && fileInfo.duration > 30 && (
        <div className="vc-banner error">
          <WarningCircle size={18} weight="fill" />
          File quá dài (hơn 30s). Vui lòng cắt bớt để clone.
        </div>
      )}
      {cloneError && (
        <div className="vc-banner error">
          <WarningCircle size={18} weight="fill" />
          {cloneError}
        </div>
      )}

      <div className="vc-input-group">
        <label className="vc-label">Tên hồ sơ</label>
        <input 
          type="text" 
          className="vc-input" 
          placeholder="VD: Giọng kể chuyện, Trợ lý ảo..."
          value={cloneName}
          onChange={e => setCloneName(e.target.value)}
          disabled={isCloning}
        />
      </div>

      <button 
        className="vc-btn-primary" 
        onClick={handleClone}
        disabled={!selectedFile || !cloneName.trim() || (fileInfo && fileInfo.duration > 30) || isCloning}
      >
        {isCloning ? 'Đang phân tích...' : 'Clone Giọng Đọc'}
      </button>

      {cloneResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          <div className="vc-player">
            <button className="vc-play-btn" onClick={() => togglePlay('original', originalAudioRef)}>
              {playingId === 'original' ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            </button>
            <div className="vc-wave-container"><div className="vc-wave-fill" style={{ width: '0%' }}></div></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--vc-slate)', width: '60px' }}>Gốc</div>
            <audio ref={originalAudioRef} src={cloneResult.original_audio} onEnded={() => setPlayingId(null)} />
          </div>
          <div className="vc-player">
            <button className="vc-play-btn" onClick={() => togglePlay('cloned', clonedAudioRef)}>
              {playingId === 'cloned' ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            </button>
            <div className="vc-wave-container"><div className="vc-wave-fill" style={{ width: '0%' }}></div></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--vc-slate)', width: '60px' }}>Bản Sao</div>
            <audio ref={clonedAudioRef} src={cloneResult.cloned_audio} onEnded={() => setPlayingId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
