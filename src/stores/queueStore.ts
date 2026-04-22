import { create } from 'zustand';

export interface RenderJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message?: string;
  videoPath: string;
  outputPath?: string;
  segments: any[];
  config: Record<string, any>; // Lưu PipelineConfig dùng để render
  createdAt: number;
  duration?: number;
  videoDimensions?: { w: number; h: number };
}

interface QueueStore {
  jobs: RenderJob[];
  addJob: (jobItem: Omit<RenderJob, 'id' | 'status' | 'progress' | 'createdAt'>) => string;
  updateJobProgress: (id: string, progress: number, message?: string) => void;
  updateJobStatus: (id: string, status: RenderJob['status'], outputPath?: string) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
}

export const useQueueStore = create<QueueStore>()((set) => ({
  jobs: [],
  addJob: (jobItem) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    set((state) => ({
      jobs: [
        ...state.jobs,
        {
          id,
          ...jobItem,
          status: 'pending',
          progress: 0,
          createdAt: Date.now(),
        },
      ],
    }));
    return id;
  },
  updateJobProgress: (id, progress, message) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, progress, message: message || job.message } : job
      ),
    })),
  updateJobStatus: (id, status, outputPath) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, status, outputPath: outputPath || job.outputPath } : job
      ),
    })),
  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.status !== 'completed'),
    })),
}));
