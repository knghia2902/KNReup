/**
 * HomeLauncher — Main entry screen (CapCut-style launcher)
 * Phase 09: Placeholder layout, will be fully designed in Plan 09-02.
 */
import { openEditor } from '../../utils/windowManager';
import { Play, DownloadSimple, Microphone } from '@phosphor-icons/react';
import '../../styles/launcher.css';

export function HomeLauncher() {
  const handleNewProject = async () => {
    await openEditor();
  };

  return (
    <div className="launcher">
      <div className="launcher-header">
        <span className="launcher-wordmark">kn<em>reup</em></span>
        <span className="launcher-version">v1.0.1</span>
      </div>

      <div className="launcher-body">
        {/* Hero Section */}
        <div className="launcher-hero">
          <h1 className="launcher-title">Bắt đầu tạo video</h1>
          <p className="launcher-subtitle">Lồng tiếng, dịch phụ đề, và chỉnh sửa video chuyên nghiệp</p>
          <button className="launcher-create-btn" onClick={handleNewProject}>
            <Play size={20} weight="fill" />
            Tạo dự án mới
          </button>
        </div>

        {/* Tools Section */}
        <div className="launcher-tools">
          <h2 className="launcher-section-title">Công cụ</h2>
          <div className="launcher-tools-grid">
            <button className="launcher-tool-card" onClick={() => import('../../utils/windowManager').then(m => m.openDownloader())}>
              <DownloadSimple size={24} weight="duotone" />
              <span>Downloader</span>
            </button>
            <button className="launcher-tool-card" onClick={() => import('../../utils/windowManager').then(m => m.openTool('voice-clone'))}>
              <Microphone size={24} weight="duotone" />
              <span>Voice Clone</span>
            </button>
          </div>
        </div>

        {/* Recent Projects — placeholder, filled in Plan 09-02 */}
        <div className="launcher-recent">
          <h2 className="launcher-section-title">Dự án gần đây</h2>
          <div className="launcher-empty">
            <p>Chưa có dự án nào. Nhấn "Tạo dự án mới" để bắt đầu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
