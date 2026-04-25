/**
 * RecentProjects — Grid display of recent project cards with thumbnails
 * Phase 09, Plan 02
 */
import { useState, useRef, useEffect } from 'react';
import { useLauncherStore, type ProjectMetadata } from '../../stores/useLauncherStore';
import { openEditor, openDownloaderForProject } from '../../utils/windowManager';
import { sidecar } from '../../lib/sidecar';
import { Folder, Clock, Trash, DownloadSimple, PencilSimple } from '@phosphor-icons/react';

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
  const updateProject = useLauncherStore((s) => s.updateProject);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleOpen = async () => {
    if (isEditing) return;
    await openEditor(project.id);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}" không?\n\nCẢNH BÁO: Toàn bộ thư mục chứa file đã tải về và file dự án sẽ bị xóa vĩnh viễn khỏi máy!`)) {
      try {
        await sidecar.fetch('/api/system/project', {
          method: 'DELETE',
          body: JSON.stringify({
            project_name: project.name,
            project_path: project.path || ''
          })
        });
      } catch (err) {
        console.error("Lỗi xóa thư mục dự án", err);
      }
      removeProject(project.id);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await openDownloaderForProject(project.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(project.name);
  };

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject(project.id, { name: trimmed });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(project.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
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
        {isEditing ? (
          <div className="launcher-project-edit-row" onClick={e => e.stopPropagation()}>
            <input 
              ref={inputRef}
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="launcher-project-edit-input"
            />
          </div>
        ) : (
          <p className="launcher-project-name">{project.name}</p>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <span className="launcher-project-meta">
            <Clock size={10} weight="bold" style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {formatDate(project.lastModified)}
          </span>
          <div className="launcher-project-actions" style={{ display: 'flex', gap: 4 }}>
            {!isEditing && (
              <>
                <button
                  onClick={handleEditClick}
                  className="launcher-card-btn"
                  title="Đổi tên dự án"
                >
                  <PencilSimple size={12} weight="bold" />
                </button>
                <button
                  onClick={handleDownload}
                  className="launcher-card-btn"
                  title="Tải media cho dự án"
                >
                  <DownloadSimple size={12} weight="bold" />
                </button>
                <button
                  onClick={handleRemove}
                  className="launcher-card-btn trash-btn"
                  title="Xóa khỏi danh sách"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </>
            )}
          </div>
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
