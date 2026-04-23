/**
 * HomeLauncher — CapCut-style Home/Project Manager
 * Phase 09, Plan 02: Full dashboard with hero, tools, and recent projects.
 */
import { useState, useCallback, useEffect } from 'react';
import { openEditor, openTool } from '../../utils/windowManager';
import { useLauncherStore } from '../../stores/useLauncherStore';
import {
  DownloadSimple,
  Microphone,
  Sun,
  Moon,
  MagnifyingGlass,
  FolderOpen,
  Plus,
  VideoCamera,
  ChartBar,
  GearSix,
} from '@phosphor-icons/react';
import { RecentProjects } from './RecentProjects';
import '../../styles/design-system.css';
import '../../styles/launcher.css';

import { useTheme } from '../../hooks/useTheme';

export function HomeLauncher() {
  const { isDark, toggle } = useTheme();
  const projectCount = useLauncherStore((s) => s.recentProjects.length);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewProject = async () => {
    const id = `proj-${Date.now()}`;
    // Add to launcher store
    useLauncherStore.getState().addProject({
      id,
      name: `Dự án ${projectCount + 1}`,
      path: '',
      createdAt: Date.now(),
      lastModified: Date.now(),
    });
    // Open editor window
    await openEditor(id);
  };

  const handleOpenExisting = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        title: 'Mở dự án',
        filters: [{ name: 'KN Project', extensions: ['kn'] }],
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        const id = `proj-${Date.now()}`;
        const name = selected.split(/[\\/]/).pop()?.replace('.kn', '') || 'Imported';
        useLauncherStore.getState().addProject({
          id,
          name,
          path: selected,
          createdAt: Date.now(),
          lastModified: Date.now(),
        });
        await openEditor(id);
      }
    } catch (err) {
      console.error('Failed to open project:', err);
    }
  };

  return (
    <div className="launcher">
      {/* Header */}
      <div className="launcher-header" data-tauri-drag-region>
        <span className="launcher-wordmark">kn<em>reup</em></span>
        <span className="launcher-version">v1.0.1</span>

        <div style={{ flex: 1 }} data-tauri-drag-region />

        {/* Search */}
        <div className="launcher-search">
          <MagnifyingGlass size={14} weight="bold" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="launcher-search-input"
          />
        </div>

        <button className="theme-toggle" onClick={toggle} title={isDark ? 'Light Mode' : 'Dark Mode'}>
          {isDark ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
        </button>
      </div>

      <div className="launcher-body">
        <div className="launcher-main">
          {/* Hero Section */}
          <div className="launcher-hero">
            <h1 className="launcher-title">Bắt đầu tạo video</h1>
            <p className="launcher-subtitle">
              Lồng tiếng, dịch phụ đề, và chỉnh sửa video chuyên nghiệp với AI
            </p>
            <div className="launcher-hero-actions">
              <button className="launcher-create-btn" onClick={handleNewProject}>
                <Plus size={18} weight="bold" />
                Tạo dự án mới
              </button>
              <button className="launcher-open-btn" onClick={handleOpenExisting}>
                <FolderOpen size={18} weight="bold" />
                Mở dự án
              </button>
            </div>
          </div>

          {/* Tools Section */}
          <div className="launcher-tools">
            <h2 className="launcher-section-title">Công cụ</h2>
            <div className="launcher-tools-grid">
              <button className="launcher-tool-card" onClick={() => openEditor(undefined, { module: 'editor' })}>
                <VideoCamera size={24} weight="duotone" />
                <span>Editor</span>
                <span className="launcher-tool-desc">Chỉnh sửa video chuyên nghiệp</span>
              </button>
              <button className="launcher-tool-card" onClick={() => openEditor(undefined, { module: 'downloader' })}>
                <DownloadSimple size={24} weight="duotone" />
                <span>Downloader</span>
                <span className="launcher-tool-desc">Tải video Douyin, TikTok</span>
              </button>
              <button className="launcher-tool-card" onClick={() => openEditor(undefined, { module: 'monitor' })}>
                <ChartBar size={24} weight="duotone" />
                <span>Monitor</span>
                <span className="launcher-tool-desc">Theo dõi tiến trình xử lý</span>
              </button>
              <button className="launcher-tool-card" onClick={() => openEditor(undefined, { module: 'settings' })}>
                <GearSix size={24} weight="duotone" />
                <span>Settings</span>
                <span className="launcher-tool-desc">Cấu hình engine & tùy chỉnh</span>
              </button>
              <button className="launcher-tool-card" onClick={() => openTool('voice-clone')}>
                <Microphone size={24} weight="duotone" />
                <span>Voice Clone</span>
                <span className="launcher-tool-desc">Nhân bản giọng nói AI</span>
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="launcher-recent">
            <h2 className="launcher-section-title">
              Dự án gần đây {projectCount > 0 && <span className="launcher-count">({projectCount})</span>}
            </h2>
            <RecentProjects searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </div>
  );
}
