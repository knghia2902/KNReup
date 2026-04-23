import React, { useState, useRef, useEffect } from 'react';
import { Microphone, Trash, UploadSimple } from '@phosphor-icons/react';
import { useSidecar } from '../../hooks/useSidecar';
import { sidecar } from '../../lib/sidecar';
import './VoiceCloneWindow.css';

export function VoiceCloneWindow() {
  const { connected } = useSidecar();
  const [activeTab, setActiveTab] = useState<'clone' | 'design' | 'profiles'>('clone');
  
  // Clone State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Design State
  const [designDesc, setDesignDesc] = useState('');
  const [designText, setDesignText] = useState('Xin chào, tôi là trợ lý AI thông minh.');
  const [designName, setDesignName] = useState('');
  const [designRegion, setDesignRegion] = useState('Bắc');
  const [isDesigning, setIsDesigning] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);


  // Profiles State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'profiles') {
      loadProfiles();
    }
  }, [activeTab]);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await sidecar.fetch<{profiles: any[]}>('/api/tts/profiles/');
      setProfiles(res.profiles || []);
    } catch (e: any) {
      console.error("Failed to load profiles:", e);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteDialog) return;
    try {
      await sidecar.fetch(`/api/tts/profiles/${deleteDialog}`, { method: 'DELETE' });
      setDeleteDialog(null);
      loadProfiles();
    } catch (e: any) {
      console.error("Failed to delete profile:", e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const doClone = async () => {
    if (!selectedFile || !cloneName) return;
    setIsCloning(true);
    setCloneError(null);
    try {
      const formData = new FormData();
      formData.append('profile_name', cloneName);
      formData.append('file', selectedFile);

      const res = await fetch(`${sidecar.getBaseUrl()}/api/tts/profiles/clone`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed');
      }
      setSelectedFile(null);
      setCloneName('');
      setActiveTab('profiles');
    } catch (e: any) {
      setCloneError(e.message);
    } finally {
      setIsCloning(false);
    }
  };

  const doDesign = async () => {
    if (!designDesc || !designName || !designText) return;
    setIsDesigning(true);
    setDesignError(null);
    try {
      await sidecar.fetch('/api/tts/profiles/design', {
        method: 'POST',
        body: JSON.stringify({
          description: designDesc,
          text: designText,
          profile_name: designName,
          region: designRegion,
          speed: 1.0
        })
      });
      setDesignDesc('');
      setDesignName('');
      setActiveTab('profiles');
    } catch (e: any) {
      setDesignError(e.message);
    } finally {
      setIsDesigning(false);
    }
  };




  return (
    <div className="vc-window">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <div className="vc-header">
        <Microphone size={20} weight="duotone" />
        <span className="vc-title">Voice Studio</span>
        <span className={`vc-status ${connected ? 'connected' : ''}`}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      <div className="vc-tabs">
        <button 
          className={`vc-tab ${activeTab === 'clone' ? 'active' : ''}`}
          onClick={() => setActiveTab('clone')}
        >
          Clone Giọng
        </button>
        <button 
          className={`vc-tab ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          Thiết Kế Giọng
        </button>
        <button 
          className={`vc-tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profiles
        </button>
      </div>

      <div className="vc-content">
        {activeTab === 'clone' && (
          <div className="vc-tab-content">
            <label className="vc-dropzone" onDragOver={handleDragOver} onDrop={handleDrop}>
              <input type="file" style={{ display: 'none' }} accept=".wav,.mp3,.ogg,.flac,.m4a" onChange={handleFileSelect} />
              <UploadSimple size={32} weight="duotone" color="var(--accent)" />
              <div className="vc-dropzone-label">Kéo thả file âm thanh mẫu</div>
              <div className="vc-dropzone-sub">Hỗ trợ .wav, .mp3, .ogg (Max 30s)</div>
            </label>

            {selectedFile && (
              <div className="vc-audio-info">
                <span>{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            )}

            {cloneError && (
              <div className="vc-banner error">{cloneError}</div>
            )}

            <div className="vc-input-group">
              <label className="vc-label">Tên Profile</label>
              <input 
                className="vc-input" 
                placeholder="vd: clone_nam_01" 
                value={cloneName} 
                onChange={e => setCloneName(e.target.value)} 
              />
            </div>

            {isCloning ? (
              <div className="vc-progress-overlay">
                <SpinnerIcon />
                <div className="vc-progress-track">
                  <div className="vc-progress-fill-track" style={{ width: '100%' }}></div>
                </div>
                <div className="vc-progress-text">Đang tạo profile...</div>
              </div>
            ) : (
              <button className="vc-cta" onClick={doClone} disabled={!selectedFile || !cloneName}>
                Clone Voice
              </button>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="vc-tab-content">
            <div className="vc-input-group" style={{ marginTop: 0 }}>
              <label className="vc-label">Mô tả giọng (Tiếng Việt hoặc Anh)</label>
              <textarea 
                className="vc-textarea" 
                placeholder="A warm, professional male voice suitable for news reading."
                value={designDesc}
                onChange={e => setDesignDesc(e.target.value)}
              />
            </div>

            <div className="vc-input-group">
              <label className="vc-label">Vùng miền</label>
              <div className="vc-chips">
                {['Bắc', 'Trung', 'Nam'].map(r => (
                  <button 
                    key={r}
                    className={`vc-chip ${designRegion === r ? 'active' : ''}`}
                    onClick={() => setDesignRegion(r)}
                  >
                    Giọng {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="vc-input-group">
              <label className="vc-label">Câu thoại mẫu (để preview / tạo profile)</label>
              <input 
                className="vc-input" 
                value={designText} 
                onChange={e => setDesignText(e.target.value)} 
              />
            </div>
            
            <div className="vc-input-group">
              <label className="vc-label">Tên Profile</label>
              <input 
                className="vc-input" 
                placeholder="vd: design_news_01" 
                value={designName} 
                onChange={e => setDesignName(e.target.value)} 
              />
            </div>

            {designError && (
              <div className="vc-banner error">{designError}</div>
            )}

            {isDesigning ? (
              <div className="vc-progress-overlay">
                <SpinnerIcon />
                <div className="vc-progress-track">
                  <div className="vc-progress-fill-track" style={{ width: '100%' }}></div>
                </div>
                <div className="vc-progress-text">Đang xử lý, xin đợi giây lát...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="vc-cta" onClick={doDesign} disabled={!designDesc || !designName || !designText}>
                  Design Voice & Save
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="vc-tab-content">
            {isLoadingProfiles ? (
              <div className="vc-empty">Đang tải profiles...</div>
            ) : profiles.length === 0 ? (
              <div className="vc-empty">
                <Microphone size={32} color="var(--text-disabled)" />
                <div className="vc-empty-heading">Chưa có giọng nào</div>
                <div className="vc-empty-body">Hãy thêm giọng mới bằng việc Clone hoặc Design.</div>
              </div>
            ) : (
              <div className="vc-profile-list">
                {profiles.map(p => (
                  <div key={p.name} className="vc-profile-item">
                    <div className="vc-profile-info">
                      <div className="vc-profile-name">{p.name} <span className="vc-status">{p.type}</span></div>
                      <div className="vc-profile-meta">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown date'} 
                        &bull; {p.duration || '0'}s
                      </div>
                    </div>
                    <div className="vc-profile-actions">
                      <button className="vc-icon-btn danger" onClick={() => setDeleteDialog(p.name)} title="Xóa giọng">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {deleteDialog && (
        <div className="vc-dialog-overlay">
          <div className="vc-dialog">
            <div className="vc-dialog-title">Xóa giọng</div>
            <div className="vc-dialog-body">Bạn có chắc chắn muốn xóa profile <strong>{deleteDialog}</strong>? Hành động này không thể hoàn tác.</div>
            <div className="vc-dialog-actions">
              <button className="vc-dialog-btn cancel" onClick={() => setDeleteDialog(null)}>Hủy</button>
              <button className="vc-dialog-btn delete" onClick={handleDeleteProfile}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="4"></circle>
      <path d="M4 12A8 8 0 0112 4V0C5.373 0 0 5.373 0 12h4z" fill="var(--accent)"></path>
    </svg>
  );
}
