/**
 * RecentProjects — Grid display of recent project cards with thumbnails
 * Phase 09, Plan 02
 */
import { useLauncherStore, type ProjectMetadata } from '../../stores/useLauncherStore';
import { openEditor } from '../../utils/windowManager';
import { Folder, Clock, Trash } from '@phosphor-icons/react';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function ProjectCard({ project }: { project: ProjectMetadata }) {
  const removeProject = useLauncherStore((s) => s.removeProject);

  const handleOpen = async () => {
    await openEditor(project.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeProject(project.id);
  };

  return (
    <div className="launcher-project-card" onClick={handleOpen} title={project.path}>
      {project.thumbnailPath ? (
        <img
          className="launcher-project-thumb"
          src={project.thumbnailPath}
          alt={project.name}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="launcher-project-thumb" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Folder size={32} weight="duotone" style={{ color: 'var(--text-muted, #555)' }} />
        </div>
      )}
      <div className="launcher-project-info">
        <p className="launcher-project-name">{project.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="launcher-project-meta">
            <Clock size={10} weight="bold" style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {formatDate(project.lastModified)}
          </span>
          <button
            onClick={handleRemove}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #666)',
              padding: 2,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Xóa khỏi danh sách"
          >
            <Trash size={12} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecentProjects({ searchQuery = '' }: { searchQuery?: string }) {
  const recentProjects = useLauncherStore((s) => s.recentProjects);

  const filtered = searchQuery.trim()
    ? recentProjects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentProjects;

  if (recentProjects.length === 0) {
    return (
      <div className="launcher-empty">
        <p>Chưa có dự án nào. Nhấn "Tạo dự án mới" để bắt đầu.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="launcher-empty">
        <p>Không tìm thấy dự án phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="launcher-projects-grid">
      {filtered.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
