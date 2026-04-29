/**
 * VoiceCloneWindow — Standalone Voice Studio entry point
 * Phase 10: Voice Clone & OmniVoice Integration.
 * Design: Stitch 2-panel (matching DownloaderPanel layout).
 *   Left  → Clone / Design form
 *   Right → Profiles table (always visible)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Microphone, Play, Stop, Trash, UploadSimple, SpeakerHigh, Sparkle, DownloadSimple } from '@phosphor-icons/react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { sidecar } from '../../lib/sidecar';
import '../../styles/design-system.css';
import '../../styles/voice-studio.css';

export function VoiceCloneWindow() {
  useTheme();
  const { connected } = useSidecar();
  const [activeTab, setActiveTab] = useState<'clone' | 'design' | 'tts'>('clone');

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
  const [playingProfile, setPlayingProfile] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [playingHistory, setPlayingHistory] = useState<string | null>(null);
  const [deleteHistoryDialog, setDeleteHistoryDialog] = useState<string | null>(null);

  // ── TTS State ──
  const [ttsVoice, setTtsVoice] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsResultAction, setTtsResultAction] = useState<any>(null); // To store history record

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await sidecar.fetch<{ profiles: any[] }>('/api/tts/profiles/');
      setProfiles(res.profiles || []);
    } catch (e: any) {
      console.error('Failed to load profiles:', e);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await sidecar.fetch<{ history: any[] }>('/api/tts/profiles/history');
      setHistory(res.history || []);
    } catch (e: any) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load data on mount + on focus
  useEffect(() => {
    if (connected) {
      loadProfiles();
      loadHistory();
    }
  }, [connected, loadProfiles, loadHistory]);

  useEffect(() => {
    const handleFocus = () => {
      loadProfiles();
      loadHistory();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProfiles, loadHistory]);

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

  const handleDeleteHistory = async () => {
    if (!deleteHistoryDialog) return;
    try {
      await sidecar.fetch(`/api/tts/profiles/history/${deleteHistoryDialog}`, { method: 'DELETE' });
      setDeleteHistoryDialog(null);
      loadHistory();
    } catch (e: any) {
      console.error('Failed to delete history:', e);
    }
  };

  const playProfile = (name: string) => {
    if (!audioRef.current) return;
    if (playingProfile === name) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingProfile(null);
      return;
    }
    const url = `${sidecar.getBaseUrl()}/api/tts/profiles/${name}/audio`;
    audioRef.current.src = url;
    audioRef.current.onended = () => {
      setPlayingProfile(null);
      setPlayingHistory(null);
    };
    audioRef.current.play().then(() => {
      setPlayingProfile(name);
      setPlayingHistory(null);
    }).catch(() => setPlayingProfile(null));
  };

  const playHistory = (filename: string) => {
    if (!audioRef.current) return;
    if (playingHistory === filename) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingHistory(null);
      return;
    }
    const url = `${sidecar.getBaseUrl()}/api/tts/profiles/history/${filename}`;
    audioRef.current.src = url;
    audioRef.current.onended = () => {
      setPlayingProfile(null);
      setPlayingHistory(null);
    };
    audioRef.current.play().then(() => {
      setPlayingHistory(filename);
      setPlayingProfile(null);
    }).catch(() => setPlayingHistory(null));
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
      loadProfiles();
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
      loadProfiles();
    } catch (e: any) {
      setDesignError(e.message);
    } finally {
      setIsDesigning(false);
    }
  };
  const doTTS = async () => {
    if (!ttsVoice || !ttsText) return;
    setIsGenerating(true);
    try {
      const res: any = await sidecar.fetch('/api/tts/profiles/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_name: ttsVoice, text: ttsText })
      });
      if (res.history_record) {
        setTtsResultAction(res.history_record);
        loadHistory(); // Reload history after generating
      }
    } catch (e: any) {
      console.error('Failed to generate TTS:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="vs-layout-wrapper">
      <audio ref={audioRef} style={{ display: 'none' }} />
      <div className="vs-container">

        {/* ── Hero Header (top section, matching dl-top-section) ── */}
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

        <div className="vs-main-grid">
          <div className="vs-panels">
            <div className="vs-tab-bar">
              <button className={`vs-tab ${activeTab === 'clone' ? 'active' : ''}`} onClick={() => setActiveTab('clone')}>
                <Microphone size={18} /> Clone Giọng
              </button>
              <button className={`vs-tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')}>
                <Sparkle size={18} /> Thiết Kế Giọng
              </button>
              <button className={`vs-tab ${activeTab === 'tts' ? 'active' : ''}`} onClick={() => setActiveTab('tts')}>
                <SpeakerHigh size={18} /> Tạo Âm Thanh
              </button>
            </div>

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

            {/* Design Form */}
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

            {/* 3. TTS Tab */}
            {activeTab === 'tts' && (
              <div className="vs-content-card">
                <div className="vs-input-group">
                  <label>Chọn Giọng Đọc</label>
                  <select 
                    className="vs-input" 
                    value={ttsVoice} 
                    onChange={e => setTtsVoice(e.target.value)}
                  >
                    <option value="" disabled>-- Chọn một giọng --</option>
                    {profiles.map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.type || 'cloned'})</option>
                    ))}
                  </select>
                </div>
                
                <div className="vs-input-group">
                  <label>Nhập Văn Bản</label>
                  <textarea
                    className="vs-input"
                    rows={8}
                    placeholder="Nhập nội dung cần đọc..."
                    value={ttsText}
                    onChange={e => setTtsText(e.target.value)}
                    maxLength={5000}
                  />
                  <div className="vs-hint" style={{ textAlign: 'right' }}>{ttsText.length}/5000 ký tự</div>
                </div>

                {isGenerating ? (
                  <div className="vs-progress-row">
                    <Spinner />
                    <span className="vs-progress-text">Đang kết nối API... Vui lòng đợi</span>
                  </div>
                ) : (
                  <button className="vs-cta" onClick={doTTS} disabled={!ttsVoice || !ttsText.trim()}>
                    <SpeakerHigh size={18} /> BẮT ĐẦU TẠO AUDIO
                  </button>
                )}

                {ttsResultAction && (
                  <div className="vs-tts-result-card" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--vs-bg-soft)', borderRadius: 'var(--vs-radius)' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--vs-text-muted)' }}>
                      Kết quả: <b>{ttsResultAction.duration}s</b>
                    </div>
                    <audio 
                      controls 
                      src={`${sidecar.getBaseUrl()}/api/tts/profiles/history/${ttsResultAction.audio_path}`} 
                      style={{ width: '100%', marginBottom: '1rem' }} 
                    />
                    <a 
                      href={`${sidecar.getBaseUrl()}/api/tts/profiles/history/${ttsResultAction.audio_path}`} 
                      download 
                      target="_blank"
                      className="vs-view-all" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      <DownloadSimple size={16} /> Tải file MP3
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Contextual Content ── */}
          <div className="vs-profiles-panel">
            {activeTab !== 'tts' ? (
              <>
                <div className="vs-recent-header">
                  <h2>Voice Profiles</h2>
                  <button className="vs-view-all" onClick={loadProfiles}>Refresh</button>
                </div>

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
                        <div className="vs-pt-cell name" title={p.name}>🎤 {p.name}</div>
                        <div className="vs-pt-cell">
                          <span className="vs-pt-type-badge">{p.type || 'cloned'}</span>
                        </div>
                        <div className="vs-pt-cell">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </div>
                        <div className="vs-pt-cell" style={{ gap: '8px' }}>
                          <button className="vs-pt-btn" onClick={() => playProfile(p.name)} title={playingProfile === p.name ? 'Dừng' : 'Nghe thử'}>
                            {playingProfile === p.name ? <Stop size={16} weight="fill" /> : <Play size={16} weight="fill" />}
                          </button>
                          <button className="vs-pt-btn" onClick={() => setDeleteDialog(p.name)} title="Xóa profile">
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="vs-recent-header">
                  <h2>Lịch sử tạo âm thanh</h2>
                  <button className="vs-view-all" onClick={loadHistory}>Refresh</button>
                </div>

                {isLoadingHistory ? (
                  <div className="vs-empty" style={{ flex: 1 }}>
                    <Spinner />
                  </div>
                ) : history.length === 0 ? (
                  <div className="vs-empty" style={{ flex: 1, padding: '1.5rem' }}>
                    <p>Chưa có lịch sử tạo âm thanh.</p>
                  </div>
                ) : (
                  <div className="vs-profile-table" style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="vs-pt-head" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 140px' }}>
                      <div>Nội dung</div>
                      <div>Profile</div>
                      <div>Time</div>
                      <div>Actions</div>
                    </div>
                    {[...history].reverse().map((h) => (
                      <div key={h.id} className="vs-pt-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 140px' }}>
                        <div className="vs-pt-cell name" title={h.text} style={{ cursor: 'help' }}>
                          {h.text}
                        </div>
                        <div className="vs-pt-cell" title={h.profile}>
                          <span className="vs-pt-type-badge">{h.profile}</span>
                        </div>
                        <div className="vs-pt-cell">
                          {h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                        <div className="vs-pt-cell" style={{ gap: '8px' }}>
                          <button className="vs-pt-btn" onClick={() => playHistory(h.audio_path)} title={playingHistory === h.audio_path ? 'Dừng' : 'Nghe lại'}>
                            {playingHistory === h.audio_path ? <Stop size={16} weight="fill" /> : <Play size={16} weight="fill" />}
                          </button>
                          <a 
                            href={`${sidecar.getBaseUrl()}/api/tts/profiles/history/${h.audio_path}`} 
                            download 
                            target="_blank"
                            className="vs-pt-btn" 
                            title="Tải file gốc"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <DownloadSimple size={16} weight="bold" />
                          </a>
                          <button className="vs-pt-btn" onClick={() => setDeleteHistoryDialog(h.id)} title="Xóa lịch sử">
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

        </div>
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

      {/* ── Delete History Confirmation Modal ── */}
      {deleteHistoryDialog && (
        <div className="vs-modal-overlay">
          <div className="vs-modal-content">
            <h2>Xóa Lịch Sử</h2>
            <p>
              Bạn có chắc chắn muốn xóa bản thu âm này?<br />
              File âm thanh liên quan cũng sẽ bị xóa vĩnh viễn.
            </p>
            <div className="vs-modal-actions">
              <button className="vs-modal-btn secondary" onClick={() => setDeleteHistoryDialog(null)}>Hủy</button>
              <button className="vs-modal-btn danger" onClick={handleDeleteHistory}>Xóa</button>
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
