/**
 * VoiceCloneWindow — Standalone Voice Studio entry point
 * Phase 10: Voice Clone & OmniVoice Integration.
 * Design: Stitch Asymmetric (matching DownloaderPanel).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Microphone, Trash, UploadSimple } from '@phosphor-icons/react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { sidecar } from '../../lib/sidecar';
import '../../styles/design-system.css';
import '../../styles/voice-studio.css';

export function VoiceCloneWindow() {
  useTheme();
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'profiles') loadProfiles();
  }, [activeTab]);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await sidecar.fetch<{ profiles: any[] }>('/api/tts/profiles/');
      setProfiles(res.profiles || []);
    } catch (e: any) {
      console.error('Failed to load profiles:', e);
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
      console.error('Failed to delete profile:', e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const doClone = async () => {
    if (!selectedFile || !cloneName) return;
    setIsCloning(true);
    setCloneError(null);
    try {
      const formData = new FormData();
      formData.append('profile_name', cloneName);
      formData.append('file', selectedFile);
      const res = await fetch(`${sidecar.getBaseUrl()}/api/tts/profiles/clone`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
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
        body: JSON.stringify({ description: designDesc, text: designText, profile_name: designName, region: designRegion, speed: 1.0 }),
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
    <div className="vs-layout-wrapper">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <div className="vs-container">

        {/* ── Hero Header ── */}
        <section className="vs-top-section">
          <div className="vs-hero-header">
            <h1>Voice Studio</h1>
            <div className="vs-status-row">
              <div className={`vs-status-dot ${connected ? 'active' : ''}`} />
              <span className="vs-status-label">{connected ? 'Session Active' : 'Offline'}</span>
            </div>
            <p>Clone giọng nói, thiết kế giọng vùng miền & quản lý voice profiles.</p>
          </div>
        </section>

        {/* ── Tab Bar ── */}
        <div className="vs-tab-bar">
          {([['clone', '🎙️ Clone Giọng'], ['design', '✨ Thiết Kế Giọng'], ['profiles', '📋 Profiles']] as const).map(([key, label]) => (
            <button key={key} className={`vs-tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key as any)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Clone Tab ── */}
        {activeTab === 'clone' && (
          <div className="vs-content-card">
            <label className="vs-dropzone" onDragOver={handleDragOver} onDrop={handleDrop}>
              <input type="file" style={{ display: 'none' }} accept=".wav,.mp3,.ogg,.flac,.m4a" onChange={handleFileSelect} />
              <div className="vs-dropzone-icon"><UploadSimple size={40} weight="duotone" /></div>
              <div className="vs-dropzone-title">Kéo thả file âm thanh mẫu</div>
              <div className="vs-dropzone-sub">Hỗ trợ .wav, .mp3, .ogg, .flac, .m4a — Tối đa 30 giây</div>
            </label>

            {selectedFile && (
              <div className="vs-audio-tag">
                <Microphone size={16} weight="bold" />
                <span className="name">{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            )}

            {cloneError && <div className="vs-error">{cloneError}</div>}

            <div className="vs-field">
              <label className="vs-field-label">Tên Profile</label>
              <input className="vs-input" placeholder="vd: clone_nam_01" value={cloneName} onChange={(e) => setCloneName(e.target.value)} />
            </div>

            {isCloning ? (
              <div className="vs-progress-row">
                <Spinner />
                <span className="vs-progress-text">Đang clone giọng nói...</span>
              </div>
            ) : (
              <button className="vs-cta" onClick={doClone} disabled={!selectedFile || !cloneName}>Clone Voice</button>
            )}
          </div>
        )}

        {/* ── Design Tab ── */}
        {activeTab === 'design' && (
          <div className="vs-content-card">
            <div className="vs-field">
              <label className="vs-field-label">Mô tả giọng</label>
              <textarea className="vs-textarea" placeholder="A warm, professional male voice suitable for news reading." value={designDesc} onChange={(e) => setDesignDesc(e.target.value)} />
            </div>

            <div className="vs-field">
              <label className="vs-field-label">Vùng miền</label>
              <div className="vs-chip-group">
                {['Bắc', 'Trung', 'Nam'].map((r) => (
                  <button key={r} className={`vs-chip ${designRegion === r ? 'active' : ''}`} onClick={() => setDesignRegion(r)}>
                    Giọng {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="vs-field">
              <label className="vs-field-label">Câu thoại mẫu</label>
              <input className="vs-input" value={designText} onChange={(e) => setDesignText(e.target.value)} />
            </div>

            <div className="vs-field">
              <label className="vs-field-label">Tên Profile</label>
              <input className="vs-input" placeholder="vd: design_news_01" value={designName} onChange={(e) => setDesignName(e.target.value)} />
            </div>

            {designError && <div className="vs-error">{designError}</div>}

            {isDesigning ? (
              <div className="vs-progress-row">
                <Spinner />
                <span className="vs-progress-text">Đang thiết kế giọng nói...</span>
              </div>
            ) : (
              <button className="vs-cta" onClick={doDesign} disabled={!designDesc || !designName || !designText}>Design Voice & Save</button>
            )}
          </div>
        )}

        {/* ── Profiles Tab ── */}
        {activeTab === 'profiles' && (
          <>
            {isLoadingProfiles ? (
              <div className="vs-empty">
                <Spinner />
                <p>Đang tải profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="vs-empty">
                <div className="vs-empty-icon">🎤</div>
                <h3>Chưa có giọng nào</h3>
                <p>Clone hoặc thiết kế giọng mới để bắt đầu sử dụng trong Editor.</p>
              </div>
            ) : (
              <div className="vs-profile-table">
                <div className="vs-pt-head">
                  <div>Profile</div>
                  <div>Type</div>
                  <div>Date</div>
                  <div>Actions</div>
                </div>
                {profiles.map((p) => (
                  <div key={p.name} className="vs-pt-row">
                    <div className="vs-pt-cell name">🎤 {p.name}</div>
                    <div className="vs-pt-cell center">
                      <span className="vs-pt-type-badge">{p.type || 'cloned'}</span>
                    </div>
                    <div className="vs-pt-cell center">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </div>
                    <div className="vs-pt-cell center">
                      <button className="vs-pt-btn" onClick={() => setDeleteDialog(p.name)} title="Xóa profile">
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteDialog && (
        <div className="vs-modal-overlay">
          <div className="vs-modal-content">
            <h2>Xóa Profile</h2>
            <p>
              Bạn có chắc chắn muốn xóa <strong>{deleteDialog}</strong>?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="vs-modal-actions">
              <button className="vs-modal-btn secondary" onClick={() => setDeleteDialog(null)}>Hủy</button>
              <button className="vs-modal-btn danger" onClick={handleDeleteProfile}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="vs-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--vs-border, rgba(255,255,255,0.1))" strokeWidth="3" />
      <path d="M4 12A8 8 0 0112 4V0C5.373 0 0 5.373 0 12h4z" fill="var(--vs-accent, #3b82f6)" />
    </svg>
  );
}
