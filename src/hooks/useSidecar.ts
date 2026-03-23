/**
 * useSidecar hook — quản lý kết nối tới Python FastAPI sidecar.
 */
import { useState, useEffect, useCallback } from 'react';
import { sidecar } from '../lib/sidecar';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}

export interface SystemCheck {
  gpu: {
    gpu_available: boolean;
    gpu_name: string | null;
    cuda_version: string | null;
    compute_type: string;
    driver_version: string | null;
  };
  ffmpeg: {
    available: boolean;
    version: string | null;
  };
  summary: {
    gpu: string;
    ffmpeg: string;
  };
  all_ok: boolean;
}

export function useSidecar() {
  const [connected, setConnected] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [systemCheck, setSystemCheck] = useState<SystemCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await sidecar.init();
      const healthData = await sidecar.fetch<HealthStatus>('/api/health');
      setHealth(healthData);
      setConnected(true);

      // Auto-run system check
      const sysData = await sidecar.fetch<SystemCheck>('/api/system/check');
      setSystemCheck(sysData);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối tới sidecar');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const retrySystemCheck = useCallback(async () => {
    try {
      const sysData = await sidecar.fetch<SystemCheck>('/api/system/check');
      setSystemCheck(sysData);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return { connected, health, systemCheck, error, loading, retrySystemCheck };
}
