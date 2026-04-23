import { useState, useRef, useEffect, useCallback } from 'react';
import { useSidecar } from '../../hooks/useSidecar';
import { Microphone, Play, Pause, Trash, UploadSimple, MagicWand, WarningCircle, XCircle } from '@phosphor-icons/react';
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
  const [activeTab, setActiveTab] = useState<'clone' | 'design' | 'profiles'>('clone');
  
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
  const [pitch, setPitch] = useState<'Low' | 'Normal' | 'High' | null>(null);
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
    if (activeTab === 'profiles') {
      fetchProfiles();
    }
  }, [activeTab, fetchProfiles]);

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

    // Get duration
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
      
      // Setup preview
      setCloneResult({
        original_audio: URL.createObjectURL(selectedFile),
        cloned_audio: `http://localhost:8000${data.sample_url || ''}` // Assume API returns sample
      });
      setCloneName('');
      setSelectedFile(null);
      setFileInfo(null);
      // Fetch profiles implicitly to update list
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
    
    // Combine description from chips and text
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

  const togglePlay = (id: string, audioRef: React.RefObject<HTMLAudioElement>) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Pause current
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
    <div className="vc-window">
      {/* Header */}
      <div className="vc-header" data-tauri-drag-region>
        <Microphone size={20} weight="duotone" style={{ color: 'var(--accent)' }} />
        <span className="vc-title">KNReup Voice Clone</span>
        <span className={`vc-status ${connected ? 'connected' : ''}`}>
          {connected ? '● Connected' : '○ Offline'}
        </span>
      </div>

      {/* Tabs */}
      <div className="vc-tabs">
        <button className={`vc-tab ${activeTab === 'clone' ? 'active' : ''}`} onClick={() => setActiveTab('clone')}>
          Clone Giọng
        </button>
        <button className={`vc-tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')}>
          Thiết Kế Giọng
        </button>
        <button className={`vc-tab ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
          Profiles
        </button>
      </div>

      {/* Content */}
      <div className="vc-content">
        {!connected ? (
          <div className="vc-empty">
            <WarningCircle size={40} weight="duotone" color="var(--warning)" />
            <div className="vc-empty-heading">OmniVoice chưa sẵn sàng</div>
            <div className="vc-empty-body">Kiểm tra cài đặt trong Settings để đảm bảo Sidecar đang hoạt động.</div>
          </div>
        ) : activeTab === 'clone' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <UploadSimple size={40} weight="duotone" color="var(--text-muted)" />
                <span className="vc-dropzone-label">Kéo thả hoặc chọn file audio</span>
                <span className="vc-dropzone-sub">WAV, MP3 · Khuyến nghị 3-10 giây</span>
              </div>
            ) : (
              <div className="vc-audio-info">
                <FileAudio size={16} weight="duotone" color="var(--accent)" />
                <span>{fileInfo?.name}</span>
                <span>·</span>
                <span>{fileInfo?.format}</span>
                <span>·</span>
                <span>{formatDuration(fileInfo?.duration || 0)}s</span>
                <button 
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => { setSelectedFile(null); setFileInfo(null); }}
                >
                  <XCircle size={16} weight="fill" />
                </button>
              </div>
            )}

            {fileInfo && fileInfo.duration > 10 && fileInfo.duration <= 30 && (
              <div className="vc-banner warning">
                ⚠ File dài hơn 10 giây. Chất lượng tốt nhất với 3-10 giây audio.
              </div>
            )}
            
            {fileInfo && fileInfo.duration > 30 && (
              <div className="vc-banner error">
                File vượt quá 30 giây. Vui lòng chọn audio ngắn hơn.
              </div>
            )}

            {cloneError && (
              <div className="vc-banner error">{cloneError}</div>
            )}

            {cloneResult && (
              <div className="vc-comparison">
                <div className="vc-player-card">
                  <div className="vc-player-label">Giọng Gốc</div>
                  <div className="vc-audio-player">
                    <button className="vc-play-btn" onClick={() => togglePlay('original', originalAudioRef)}>
                      {playingId === 'original' ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                    </button>
                    <div className="vc-progress-bar"><div className="vc-progress-fill" style={{ width: '0%' }}></div></div>
                    <div className="vc-duration">0:00</div>
                    <audio 
                      ref={originalAudioRef} 
                      src={cloneResult.original_audio} 
                      onEnded={() => setPlayingId(null)}
                    />
                  </div>
                </div>
                <div className="vc-player-card">
                  <div className="vc-player-label">Giọng Clone</div>
                  <div className="vc-audio-player">
                    <button className="vc-play-btn" onClick={() => togglePlay('cloned', clonedAudioRef)}>
                      {playingId === 'cloned' ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                    </button>
                    <div className="vc-progress-bar"><div className="vc-progress-fill" style={{ width: '0%' }}></div></div>
                    <div className="vc-duration">0:00</div>
                    <audio 
                      ref={clonedAudioRef} 
                      src={cloneResult.cloned_audio} 
                      onEnded={() => setPlayingId(null)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="vc-input-group">
              <label className="vc-label">Tên giọng</label>
              <input 
                type="text" 
                className="vc-input" 
                placeholder="Đặt tên cho giọng clone..."
                value={cloneName}
                onChange={e => setCloneName(e.target.value)}
                disabled={isCloning}
              />
            </div>

            {isCloning ? (
              <div className="vc-progress-overlay">
                <div className="vc-progress-text">Cloning...</div>
                <div className="vc-progress-track"><div className="vc-progress-fill-track" style={{ width: '60%' }}></div></div>
              </div>
            ) : (
              <button 
                className="vc-cta" 
                onClick={handleClone}
                disabled={!selectedFile || !cloneName.trim() || (fileInfo && fileInfo.duration > 30) ? true : false}
              >
                Clone Voice ▶
              </button>
            )}
          </div>
        ) : activeTab === 'design' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="vc-input-group" style={{ marginTop: 0 }}>
              <label className="vc-label">Mô tả giọng</label>
              <textarea 
                className="vc-textarea" 
                placeholder="Mô tả giọng bạn muốn tạo (VD: female, low pitch, calm)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isDesigning}
              ></textarea>
            </div>

            <div>
              <label className="vc-label">Quick Attributes</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="vc-chips">
                  {['Male', 'Female'].map(g => (
                    <div 
                      key={g} 
                      className={`vc-chip ${gender === g ? 'active' : ''}`}
                      onClick={() => setGender(gender === g ? null : g as any)}
                    >
                      {g}
                    </div>
                  ))}
                </div>
                <div className="vc-chips">
                  {['Young', 'Middle', 'Senior'].map(a => (
                    <div 
                      key={a} 
                      className={`vc-chip ${age === a ? 'active' : ''}`}
                      onClick={() => setAge(age === a ? null : a as any)}
                    >
                      {a}
                    </div>
                  ))}
                </div>
                <div className="vc-chips">
                  {['Low', 'Normal', 'High'].map(p => (
                    <div 
                      key={p} 
                      className={`vc-chip ${pitch === p ? 'active' : ''}`}
                      onClick={() => setPitch(pitch === p ? null : p as any)}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <label className="vc-label">Preview</label>
              <select 
                className="vc-input" 
                style={{ marginBottom: '8px' }}
                value={customText ? '' : sampleText}
                onChange={e => {
                  if (e.target.value) {
                    setSampleText(e.target.value);
                    setCustomText('');
                  }
                }}
                disabled={isDesigning}
              >
                <option value="" disabled>Chọn câu mẫu tiếng Việt</option>
                {sampleTexts.map((text, i) => <option key={i} value={text}>{text}</option>)}
              </select>
              <input 
                type="text" 
                className="vc-input" 
                placeholder="Hoặc nhập text tùy ý để test..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                disabled={isDesigning}
              />
            </div>

            {designResult && (
              <div className="vc-player-card">
                <div className="vc-player-label">Preview Audio</div>
                <div className="vc-audio-player">
                  <button className="vc-play-btn" onClick={() => togglePlay('design', designAudioRef)}>
                    {playingId === 'design' ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                  </button>
                  <div className="vc-progress-bar"><div className="vc-progress-fill" style={{ width: '0%' }}></div></div>
                  <div className="vc-duration">0:00</div>
                  <audio 
                    ref={designAudioRef} 
                    src={designResult.audio} 
                    onEnded={() => setPlayingId(null)}
                  />
                </div>
              </div>
            )}

            {designError && (
              <div className="vc-banner error">{designError}</div>
            )}

            <div className="vc-input-group">
              <label className="vc-label">Tên giọng</label>
              <input 
                type="text" 
                className="vc-input" 
                placeholder="Đặt tên cho giọng clone..."
                value={designName}
                onChange={e => setDesignName(e.target.value)}
                disabled={isDesigning}
              />
            </div>

            {isDesigning ? (
              <div className="vc-progress-overlay">
                <div className="vc-progress-text">Designing...</div>
                <div className="vc-progress-track"><div className="vc-progress-fill-track" style={{ width: '60%' }}></div></div>
              </div>
            ) : (
              <button 
                className="vc-cta" 
                onClick={handleDesign}
                disabled={!designName.trim()}
              >
                Design Voice ▶
              </button>
            )}
          </div>
        ) : (
          <div style={{ height: '100%' }}>
            {profiles.length === 0 ? (
              <div className="vc-empty">
                <Microphone size={40} weight="duotone" color="var(--text-muted)" />
                <div className="vc-empty-heading">Chưa có giọng nào</div>
                <div className="vc-empty-body">Tạo giọng clone hoặc thiết kế giọng mới từ các tab bên trái.</div>
              </div>
            ) : (
              <div className="vc-profile-list">
                {profiles.map(profile => (
                  <div key={profile.name} className="vc-profile-item">
                    <div className="vc-profile-info">
                      <div className="vc-profile-name">♦ {profile.name}</div>
                      <div className="vc-profile-meta">
                        {profile.created_at || '12/04/2026'} · {profile.duration ? `${profile.duration}s` : '—'}
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
                        {playingId === profile.name ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
                      </button>
                      <button 
                        className="vc-icon-btn danger"
                        onClick={() => setIsDeleting(profile.name)}
                      >
                        <Trash size={14} weight="bold" />
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
        )}
      </div>

      {/* Confirm Dialog */}
      {isDeleting && (
        <div className="vc-dialog-overlay">
          <div className="vc-dialog">
            <div className="vc-dialog-title">Xóa giọng</div>
            <div className="vc-dialog-body">Bạn có chắc muốn xóa "{isDeleting}"? Hành động này không thể hoàn tác.</div>
            <div className="vc-dialog-actions">
              <button className="vc-dialog-btn cancel" onClick={() => setIsDeleting(null)}>Hủy</button>
              <button className="vc-dialog-btn delete" onClick={() => handleDeleteProfile(isDeleting)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
