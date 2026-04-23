/**
 * KNReup Sidecar Bridge
 * Quản lý giao tiếp giữa React frontend ↔ Python FastAPI sidecar.
 * Dev mode: connect trực tiếp tới port 8008.
 * Production: spawn sidecar, đọc port từ stdout.
 */

const SIDECAR_DEV_PORT = 8008;
const HEALTH_CHECK_MAX_RETRIES = 20;
const HEALTH_CHECK_BASE_DELAY = 200; // ms

class SidecarBridge {
  private port: number | null = null;
  private baseUrl: string = '';
  private connected: boolean = false;

  /**
   * Khởi tạo kết nối tới sidecar.
   * Dev mode: connect trực tiếp.
   * Production: spawn process, đọc port từ stdout.
   */
  async init(): Promise<void> {
    if (import.meta.env.DEV) {
      this.port = SIDECAR_DEV_PORT;
      this.baseUrl = `http://127.0.0.1:${this.port}`;
      // Exponential backoff health check
      await this.waitForHealth();
      return;
    }

    // Production: spawn sidecar
    try {
      const { Command } = await import('@tauri-apps/plugin-shell');
      const command = Command.sidecar('binaries/python-sidecar');

      command.stdout.on('data', (line: string) => {
        const match = line.match(/^PORT:(\d+)$/);
        if (match) {
          this.port = parseInt(match[1], 10);
          this.baseUrl = `http://127.0.0.1:${this.port}`;
        }
      });

      command.stderr.on('data', (line: string) => {
        console.warn('[sidecar]', line);
      });

      await command.spawn();

      // Chờ port
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Sidecar timeout — không nhận được port')), 15000);
        const check = setInterval(() => {
          if (this.port) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });

      await this.waitForHealth();
    } catch (err) {
      console.error('Không thể khởi động sidecar:', err);
      throw err;
    }
  }

  /**
   * Exponential backoff health check.
   * Chờ sidecar ready trước khi cho frontend gọi API.
   */
  private async waitForHealth(): Promise<void> {
    for (let i = 0; i < HEALTH_CHECK_MAX_RETRIES; i++) {
      try {
        const res = await fetch(`${this.baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          this.connected = true;
          console.log(`[sidecar] Connected on port ${this.port}`);
          return;
        }
      } catch {
        // Expected — sidecar chưa ready
      }
      // Exponential backoff: 200, 400, 800, 1600, 2000, 2000...
      const delay = Math.min(HEALTH_CHECK_BASE_DELAY * Math.pow(2, i), 2000);
      await new Promise(r => setTimeout(r, delay));
    }
    throw new Error('Sidecar không phản hồi sau nhiều lần thử');
  }

  /**
   * Gọi API — wrapper cho fetch.
   */
  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    if (!this.baseUrl) throw new Error('Sidecar chưa khởi tạo');

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      const detail = error.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join('; ')
          : `API error: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * SSE — Server-Sent Events cho progress streaming.
   */
  createEventSource(path: string): EventSource {
    if (!this.baseUrl) throw new Error('Sidecar chưa khởi tạo');
    return new EventSource(`${this.baseUrl}${path}`);
  }

  async uploadReferenceAudio(file: File): Promise<{ temp_path: string, duration: number }> {
    if (!this.baseUrl) throw new Error('Sidecar chưa khởi tạo');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/api/tts/profiles/upload-reference`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }

  async saveProfile(name: string, tempPath: string): Promise<{ profile_name: string }> {
    return this.fetch<{ profile_name: string }>('/api/tts/profiles/save', {
      method: 'POST',
      body: JSON.stringify({ name, temp_path: tempPath }),
    });
  }

  async getProfiles(): Promise<{ profiles: any[] }> {
    return this.fetch<{ profiles: any[] }>('/api/tts/profiles');
  }

  async synthesize(params: any): Promise<Blob> {
    if (!this.baseUrl) throw new Error('Sidecar chưa khởi tạo');
    const res = await fetch(`${this.baseUrl}/api/pipeline/tts-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Synthesize failed');
    return res.blob();
  }

  getPort(): number | null { return this.port; }
  getBaseUrl(): string { return this.baseUrl; }
  isConnected(): boolean { return this.connected; }
}

export const sidecar = new SidecarBridge();
