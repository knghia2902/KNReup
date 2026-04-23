/**
 * VoiceCloneWindow — Standalone Voice Studio entry point
 * Phase 10: Voice Clone & OmniVoice Integration.
 * UI pattern matches DownloaderWindow for consistency.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Microphone, Trash, UploadSimple } from '@phosphor-icons/react';
import { useSidecar } from '../../hooks/useSidecar';
import { sidecar } from '../../lib/sidecar';
import '../../styles/design-system.css';

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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'profiles') loadProfiles();
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
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
        body: JSON.stringify({ description: designDesc, text: designText, profile_name: designName, region: designRegion, speed: 1.0 })
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

  // ── Shared inline styles (match DownloaderWindow) ──────────
  const S = {
    root: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg-primary, #111)', color: 'var(--text-primary, #eee)', fontFamily: 'var(--font-sans, system-ui, sans-serif)' },
    header: { padding: '14px 20px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center' as const, gap: 10 },
    headerIcon: { color: 'var(--accent, #7c6aef)' },
    headerTitle: { fontWeight: 600, fontSize: 15 },
    statusPill: { fontSize: 11, color: 'var(--text-muted, #888)', marginLeft: 8, padding: '2px 6px', background: 'var(--surface-hover, rgba(255,255,255,0.04))', borderRadius: 4 },
    tabBar: { display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', padding: '0 20px', background: 'var(--bg-secondary, rgba(255,255,255,0.02))' },
    tab: (active: boolean) => ({
      padding: '10px 16px', fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? 'var(--accent, #7c6aef)' : 'var(--text-muted, #888)',
      background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent, #7c6aef)' : '2px solid transparent',
      cursor: 'pointer', transition: 'all .15s ease',
    }),
    content: { flex: 1, overflow: 'auto' as const, padding: '16px 20px' },
    // Inputs
    inputRow: { marginTop: 14 },
    label: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #888)', marginBottom: 4, display: 'block' as const },
    input: {
      width: '100%', height: 34, padding: '0 12px', fontSize: 13, boxSizing: 'border-box' as const,
      background: 'var(--surface, rgba(255,255,255,0.03))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      borderRadius: 8, color: 'var(--text-primary, #eee)', outline: 'none', fontFamily: 'inherit',
    },
    textarea: {
      width: '100%', minHeight: 64, padding: '8px 12px', fontSize: 13, boxSizing: 'border-box' as const,
      background: 'var(--surface, rgba(255,255,255,0.03))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      borderRadius: 8, color: 'var(--text-primary, #eee)', resize: 'vertical' as const, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit',
    },
    // CTA button – matches Downloader's download button
    cta: (enabled: boolean) => ({
      width: '100%', padding: '10px 20px', fontSize: 13, fontWeight: 600, marginTop: 14,
      background: enabled ? 'var(--accent, #7c6aef)' : 'var(--surface, #333)',
      color: '#fff', border: 'none', borderRadius: 8,
      cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.5,
    }),
    // Dropzone
    dropzone: {
      border: '2px dashed var(--border-subtle, rgba(255,255,255,0.1))', borderRadius: 8,
      padding: 32, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, gap: 8,
      cursor: 'pointer', background: 'var(--surface, rgba(255,255,255,0.02))', transition: 'all .15s ease',
    },
    // Chip
    chip: (active: boolean) => ({
      padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      border: active ? '1px solid var(--accent, #7c6aef)' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
      background: active ? 'var(--accent, #7c6aef)' : 'transparent',
      color: active ? '#fff' : 'var(--text-muted, #888)', transition: 'all .15s ease',
    }),
    // Profile item (match downloader list item)
    profileItem: {
      display: 'flex', alignItems: 'center' as const, gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.04))',
    },
    profileName: { margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    profileMeta: { fontSize: 11, color: 'var(--text-muted, #888)' },
    // Empty state (match downloader)
    empty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, justifyContent: 'center' as const, height: '100%', gap: 12, color: 'var(--text-muted, #888)' },
    // Error banner
    banner: { padding: '8px 14px', borderRadius: 6, fontSize: 11, marginTop: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' },
    // Progress
    progress: { display: 'flex', alignItems: 'center' as const, gap: 10, padding: '10px 14px', marginTop: 14, background: 'var(--surface, rgba(255,255,255,0.03))', borderRadius: 8, border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))' },
    progressText: { fontSize: 11, color: 'var(--text-muted, #888)' },
    // Icon button (trash)
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #888)', padding: 4 },
    // Dialog overlay
    dialogOverlay: { position: 'fixed' as const, inset: 0, zIndex: 100, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const },
    dialog: { background: 'var(--bg-secondary, #1a1a1a)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', borderRadius: 12, padding: 20, width: 320 },
    dialogTitle: { fontSize: 15, fontWeight: 600, marginBottom: 8 },
    dialogBody: { fontSize: 13, color: 'var(--text-muted, #888)', marginBottom: 16 },
    dialogActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' as const },
    dialogBtnCancel: { padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--surface, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', color: 'var(--text-muted, #888)' },
    dialogBtnDanger: { padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#ef4444', border: 'none', color: '#fff' },
  };

  return (
    <div style={S.root}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* ── Header (matches Downloader) ── */}
      <div style={S.header} data-tauri-drag-region>
        <Microphone size={20} weight="duotone" style={S.headerIcon} />
        <span style={S.headerTitle}>Voice Studio</span>
        <span style={S.statusPill}>{connected ? '● Connected' : '○ Offline'}</span>
      </div>

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {([['clone', 'Clone Giọng'], ['design', 'Thiết Kế Giọng'], ['profiles', 'Profiles']] as const).map(([key, label]) => (
          <button key={key} style={S.tab(activeTab === key)} onClick={() => setActiveTab(key as any)}>{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={S.content}>

        {/* ── Clone Tab ── */}
        {activeTab === 'clone' && (
          <>
            <label style={S.dropzone} onDragOver={handleDragOver} onDrop={handleDrop}>
              <input type="file" style={{ display: 'none' }} accept=".wav,.mp3,.ogg,.flac,.m4a" onChange={handleFileSelect} />
              <UploadSimple size={32} weight="duotone" style={S.headerIcon} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Kéo thả file âm thanh mẫu</span>
              <span style={{ fontSize: 11, color: 'var(--text-disabled, #555)' }}>Hỗ trợ .wav, .mp3, .ogg, .flac, .m4a (Max 30s)</span>
            </label>

            {selectedFile && (
              <div style={{ ...S.progress, marginTop: 8 }}>
                <span style={{ fontSize: 12 }}>{selectedFile.name}</span>
                <span style={S.progressText}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            )}

            {cloneError && <div style={S.banner}>{cloneError}</div>}

            <div style={S.inputRow}>
              <label style={S.label}>Tên Profile</label>
              <input style={S.input} placeholder="vd: clone_nam_01" value={cloneName} onChange={e => setCloneName(e.target.value)} />
            </div>

            {isCloning ? (
              <div style={S.progress}>
                <SpinnerIcon />
                <span style={S.progressText}>Đang tạo profile...</span>
              </div>
            ) : (
              <button style={S.cta(!!selectedFile && !!cloneName)} onClick={doClone} disabled={!selectedFile || !cloneName}>
                Clone Voice
              </button>
            )}
          </>
        )}

        {/* ── Design Tab ── */}
        {activeTab === 'design' && (
          <>
            <div>
              <label style={S.label}>Mô tả giọng (Tiếng Việt hoặc Anh)</label>
              <textarea style={S.textarea} placeholder="A warm, professional male voice suitable for news reading." value={designDesc} onChange={e => setDesignDesc(e.target.value)} />
            </div>

            <div style={S.inputRow}>
              <label style={S.label}>Vùng miền</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Bắc', 'Trung', 'Nam'].map(r => (
                  <button key={r} style={S.chip(designRegion === r)} onClick={() => setDesignRegion(r)}>
                    Giọng {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.inputRow}>
              <label style={S.label}>Câu thoại mẫu</label>
              <input style={S.input} value={designText} onChange={e => setDesignText(e.target.value)} />
            </div>

            <div style={S.inputRow}>
              <label style={S.label}>Tên Profile</label>
              <input style={S.input} placeholder="vd: design_news_01" value={designName} onChange={e => setDesignName(e.target.value)} />
            </div>

            {designError && <div style={S.banner}>{designError}</div>}

            {isDesigning ? (
              <div style={S.progress}>
                <SpinnerIcon />
                <span style={S.progressText}>Đang xử lý, xin đợi giây lát...</span>
              </div>
            ) : (
              <button style={S.cta(!!designDesc && !!designName && !!designText)} onClick={doDesign} disabled={!designDesc || !designName || !designText}>
                Design Voice & Save
              </button>
            )}
          </>
        )}

        {/* ── Profiles Tab ── */}
        {activeTab === 'profiles' && (
          <>
            {isLoadingProfiles ? (
              <div style={S.empty}><span style={{ fontSize: 13 }}>Đang tải profiles...</span></div>
            ) : profiles.length === 0 ? (
              <div style={S.empty}>
                <Microphone size={40} weight="duotone" />
                <p style={{ fontSize: 13, margin: 0 }}>Chưa có giọng nào. Hãy Clone hoặc Design để bắt đầu.</p>
              </div>
            ) : (
              profiles.map(p => (
                <div key={p.name} style={S.profileItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={S.profileName}>
                      🎤 {p.name}
                      <span style={{ ...S.statusPill, marginLeft: 6 }}>{p.type || 'cloned'}</span>
                    </p>
                    <span style={S.profileMeta}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'} · {p.duration || '0'}s
                    </span>
                  </div>
                  <button style={S.iconBtn} onClick={() => setDeleteDialog(p.name)} title="Xóa giọng">
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ── Delete Dialog ── */}
      {deleteDialog && (
        <div style={S.dialogOverlay}>
          <div style={S.dialog}>
            <div style={S.dialogTitle}>Xóa giọng</div>
            <div style={S.dialogBody}>Bạn có chắc chắn muốn xóa profile <strong>{deleteDialog}</strong>? Hành động này không thể hoàn tác.</div>
            <div style={S.dialogActions}>
              <button style={S.dialogBtnCancel} onClick={() => setDeleteDialog(null)}>Hủy</button>
              <button style={S.dialogBtnDanger} onClick={handleDeleteProfile}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="var(--border-subtle, rgba(255,255,255,0.1))" strokeWidth="3" />
      <path d="M4 12A8 8 0 0112 4V0C5.373 0 0 5.373 0 12h4z" fill="var(--accent, #7c6aef)" />
    </svg>
  );
}
