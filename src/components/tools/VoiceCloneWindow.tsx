import { useState, useRef, useEffect, useCallback } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { useTheme } from '../../hooks/useTheme';
import { 
  Microphone, Play, Pause, Trash, UploadSimple, 
  MagicWand, WarningCircle, XCircle, 
  Waveform, MusicNotes, Sparkle 
} from '@phosphor-icons/react';
import './VoiceCloneWindow.css';

interface Profile {
  id: string;
  name: string;
  audio_path: string;
  duration?: number;
  created_at?: string;
}

export function VoiceCloneWindow() {
  const { connected } = useSidecar();
  useTheme(); // Initializes theme for this window
  const [activeTab, setActiveTab] = useState<'clone' | 'design'>('clone');
  
  // Clone State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; duration: number; format: string } | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<{ original_audio?: string; cloned_audio?: string } | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Design State
  const [designName, setDesignName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [age, setAge] = useState<'Young' | 'Middle' | 'Senior' | null>(null);
  const [pitch] = useState<'Low' | 'Normal' | 'High' | null>(null); // Kept state, removed unused setter
  const [sampleText, setSampleText] = useState('Xin chào, tôi là trợ lý AI của KNReup');
  const [customText, setCustomText] = useState('');
  const [isDesigning, setIsDesigning] = useState(false);
  const [designResult, setDesignResult] = useState<{ audio?: string } | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);

  // Profiles State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Players
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const clonedAudioRef = useRef<HTMLAudioElement>(null);
  const designAudioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const profileAudioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const sampleTexts = [
    "Xin chào, tôi là trợ lý AI của KNReup",
    "Hôm nay trời đẹp quá, chúng ta đi dạo nhé",
    "Video này được tạo bởi công nghệ AI hiện đại"
  ];

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/tts/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Failed to fetch profiles', err);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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
    formData.append('name', cloneName.trim());
    
    try {
      const res = await fetch('http://localhost:8000/api/tts/profiles/clone', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Clone thất bại');
      const data = await res.json();
      
      setCloneResult({
        original_audio: URL.createObjectURL(selectedFile),
        cloned_audio: `http://localhost:8000${data.sample_url || ''}`
      });
      setCloneName('');
      setSelectedFile(null);
      setFileInfo(null);
      fetchProfiles();
    } catch (err: any) {
      setCloneError(`Clone thất bại: ${err.message}. Thử lại với file audio khác.`);
    } finally {
      setIsCloning(false);
    }
  };

  const handleDesign = async () => {
    if (!designName.trim()) return;
    setIsDesigning(true);
    setDesignError(null);
    
    const attrs = [];
    if (gender) attrs.push(gender);
    if (age) attrs.push(age);
    if (pitch) attrs.push(`${pitch} pitch`);
    const fullDesc = `${attrs.join(', ')}. ${description}`.trim();
    
    try {
      const res = await fetch('http://localhost:8000/api/tts/profiles/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designName.trim(),
          description: fullDesc,
          text: customText || sampleText
        })
      });
      if (!res.ok) throw new Error('Design thất bại');
      const data = await res.json();
      
      setDesignResult({ audio: `http://localhost:8000${data.audio_url}` });
      setDesignName('');
      fetchProfiles();
    } catch (err: any) {
      setDesignError(err.message);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleDeleteProfile = async (name: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tts/profiles/${name}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDeleting(null);
        fetchProfiles();
      }
    } catch (err) {
      console.error('Failed to delete profile', err);
    }
  };

  const togglePlay = (id: string, audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (playingId && playingId === 'original' && originalAudioRef.current) originalAudioRef.current.pause();
      if (playingId && playingId === 'cloned' && clonedAudioRef.current) clonedAudioRef.current.pause();
      if (playingId && playingId === 'design' && designAudioRef.current) designAudioRef.current.pause();
      if (playingId && profileAudioRefs.current[playingId]) profileAudioRefs.current[playingId].pause();
      
      audioRef.current?.play();
      setPlayingId(id);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="vc-layout-wrapper" data-tauri-drag-region>
      <div className="vc-container">
        
        {/* Top Section */}
        <section className="vc-top-section">
          <div className="vc-hero-header">
            <div className="vc-top-row">
              <Waveform size={42} weight="duotone" color="var(--vc-accent)" />
              <h1>Voice Studio</h1>
              <div className={`vc-status-pill ${connected ? 'connected' : ''}`}>
                <div className="vc-status-dot"></div>
                {connected ? 'Engine Ready' : 'Offline'}
              </div>
            </div>
            <p>Tạo bản sao giọng đọc chân thực hoặc thiết kế giọng AI mới hoàn toàn. Cấu hình được đồng bộ tự động vào TTS Editor.</p>
          </div>

          {/* Tab Pill Selector */}
          <div className="vc-tab-selector">
            <button 
              className={`vc-tab-btn ${activeTab === 'clone' ? 'active' : ''}`}
              onClick={() => setActiveTab('clone')}
            >
              <Microphone size={18} weight="fill" />
              Voice Clone
            </button>
            <button 
              className={`vc-tab-btn ${activeTab === 'design' ? 'active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              <MagicWand size={18} weight="fill" />
              Voice Design
            </button>
          </div>
        </section>

        {/* Main 2-Column Grid */}
        <div className="vc-main-grid">
          
          {/* Left Column: Action Form */}
          <div className="vc-options-panel">
            {!connected ? (
              <div className="vc-empty-placeholder">
                <WarningCircle size={48} weight="duotone" className="vc-ep-icon" color="var(--vc-danger)" />
                <h3>Engine Offline</h3>
                <p>OmniVoice engine chưa khởi động. Vui lòng kiểm tra Python sidecar.</p>
              </div>
            ) : activeTab === 'clone' ? (
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
            ) : (
              <div className="vc-card">
                <h2 className="vc-card-title">Thiết kế giọng AI</h2>
                
                <div className="vc-input-group">
                  <label className="vc-label">Mô tả (Prompt tiếng Anh)</label>
                  <textarea 
                    className="vc-textarea" 
                    placeholder="VD: A calm, deep male voice suitable for documentaries..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isDesigning}
                  />
                </div>

                <div className="vc-input-group">
                  <label className="vc-label">Thuộc tính</label>
                  <div className="vc-chips">
                    {['Male', 'Female'].map(g => (
                      <div key={g} className={`vc-chip ${gender === g ? 'active' : ''}`} onClick={() => setGender(gender === g ? null : g as any)}>
                        {g}
                      </div>
                    ))}
                    <div style={{ width: '1px', background: 'var(--vc-border)' }}></div>
                    {['Young', 'Middle', 'Senior'].map(a => (
                      <div key={a} className={`vc-chip ${age === a ? 'active' : ''}`} onClick={() => setAge(age === a ? null : a as any)}>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="vc-input-group" style={{ marginTop: '8px' }}>
                  <label className="vc-label">Đoạn đọc thử (Tiếng Việt)</label>
                  <select 
                    className="vc-select" 
                    value={customText ? '' : sampleText}
                    onChange={e => {
                      if (e.target.value) {
                        setSampleText(e.target.value);
                        setCustomText('');
                      }
                    }}
                    disabled={isDesigning}
                  >
                    <option value="" disabled>Chọn câu mẫu...</option>
                    {sampleTexts.map((text, i) => <option key={i} value={text}>{text}</option>)}
                  </select>
                  <input 
                    type="text" 
                    className="vc-input" 
                    placeholder="Hoặc nhập tùy ý..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    disabled={isDesigning}
                  />
                </div>

                <div className="vc-input-group">
                  <label className="vc-label">Tên hồ sơ lưu trữ</label>
                  <input 
                    type="text" 
                    className="vc-input" 
                    placeholder="VD: Giọng Design 01"
                    value={designName}
                    onChange={e => setDesignName(e.target.value)}
                    disabled={isDesigning}
                  />
                </div>

                {designError && (
                  <div className="vc-banner error">
                    <WarningCircle size={18} weight="fill" />
                    {designError}
                  </div>
                )}

                <button 
                  className="vc-btn-primary" 
                  onClick={handleDesign}
                  disabled={!designName.trim() || isDesigning}
                >
                  {isDesigning ? 'Đang tổng hợp (Designing)...' : 'Tạo Giọng Design'}
                </button>

                {designResult && (
                  <div className="vc-player" style={{ marginTop: '12px' }}>
                    <button className="vc-play-btn" onClick={() => togglePlay('design', designAudioRef)}>
                      {playingId === 'design' ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                    </button>
                    <div className="vc-wave-container"><div className="vc-wave-fill" style={{ width: '0%' }}></div></div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--vc-slate)', width: '60px' }}>Preview</div>
                    <audio ref={designAudioRef} src={designResult.audio} onEnded={() => setPlayingId(null)} />
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right Column: Library */}
          <div className="vc-library-panel">
            <div className="vc-card" style={{ height: '100%' }}>
              <h2 className="vc-card-title" style={{ marginBottom: '8px' }}>
                Thư viện Profiles
                <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--vc-slate)', fontWeight: 500 }}>
                  {profiles.length} giọng
                </span>
              </h2>

              {profiles.length === 0 ? (
                <div className="vc-empty-placeholder" style={{ flex: 1, border: 'none', background: 'transparent' }}>
                  <Sparkle size={40} weight="duotone" className="vc-ep-icon" />
                  <p style={{ margin: 0 }}>Chưa có cấu hình nào. Tạo mới từ bảng bên trái.</p>
                </div>
              ) : (
                <div className="vc-profile-list">
                  {profiles.map(profile => (
                    <div key={profile.name} className="vc-profile-item">
                      <div className="vc-profile-info">
                        <div className="vc-profile-title">{profile.name}</div>
                        <div className="vc-profile-meta">
                          {profile.created_at || 'Mới'} · {profile.duration ? `${profile.duration}s` : '—'}
                        </div>
                      </div>
                      <div className="vc-profile-actions">
                        <button 
                          className="vc-icon-btn" 
                          onClick={() => {
                            if (!profileAudioRefs.current[profile.name]) return;
                            togglePlay(profile.name, { current: profileAudioRefs.current[profile.name] } as React.RefObject<HTMLAudioElement>);
                          }}
                        >
                          {playingId === profile.name ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
                        </button>
                        <button 
                          className="vc-icon-btn danger"
                          onClick={() => setIsDeleting(profile.name)}
                        >
                          <Trash size={16} weight="fill" />
                        </button>
                        <audio 
                          ref={el => { if (el) profileAudioRefs.current[profile.name] = el; }} 
                          src={`http://localhost:8000/api/tts/profiles/${profile.name}/audio`} 
                          onEnded={() => setPlayingId(null)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Dialog Overlay */}
      {isDeleting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="vc-card" style={{ width: '400px', border: '1px solid var(--vc-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Xóa hồ sơ giọng?</h3>
            <p style={{ margin: 0, color: 'var(--vc-slate)', lineHeight: 1.5 }}>
              Bạn có chắc muốn xóa "{isDeleting}"? Thao tác này không thể phục hồi và có thể ảnh hưởng đến project NLE đang dùng giọng này.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsDeleting(null)}
                style={{
                  padding: '10px 20px', borderRadius: '999px', border: '1px solid var(--vc-border)',
                  background: 'transparent', color: 'var(--vc-text)', fontWeight: 600, cursor: 'pointer'
                }}
              >Hủy</button>
              <button 
                onClick={() => handleDeleteProfile(isDeleting)}
                style={{
                  padding: '10px 20px', borderRadius: '999px', border: 'none',
                  background: 'var(--vc-danger)', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}
              >Xóa Vĩnh Viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}