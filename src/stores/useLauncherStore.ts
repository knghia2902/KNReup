import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectMetadata {
  id: string;
  name: string;
  path: string;
  thumbnailPath?: string;
  lastModified: number; // timestamp
  createdAt: number;
  videoPath?: string;
}

interface LauncherState {
  recentProjects: ProjectMetadata[];

  addProject: (project: ProjectMetadata) => void;
  updateProject: (id: string, updates: Partial<ProjectMetadata>) => void;
  removeProject: (id: string) => void;
  getProjectById: (id: string) => ProjectMetadata | undefined;
}

export const useLauncherStore = create<LauncherState>()(
  persist(
    (set, get) => ({
      recentProjects: [],

      addProject: (project) =>
        set((state) => {
          // If project already exists, update it
          const existing = state.recentProjects.find((p) => p.id === project.id);
          if (existing) {
            return {
              recentProjects: state.recentProjects.map((p) =>
                p.id === project.id ? { ...p, ...project, lastModified: Date.now() } : p
              ),
            };
          }
          // Add to front, keep max 20
          return {
            recentProjects: [
              { ...project, lastModified: Date.now() },
              ...state.recentProjects,
            ].slice(0, 20),
          };
        }),

      updateProject: (id, updates) =>
        set((state) => ({
          recentProjects: state.recentProjects.map((p) =>
            p.id === id ? { ...p, ...updates, lastModified: Date.now() } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          recentProjects: state.recentProjects.filter((p) => p.id !== id),
        })),

      getProjectById: (id) => get().recentProjects.find((p) => p.id === id),
    }),
    { name: 'knreup-launcher' }
  )
);
