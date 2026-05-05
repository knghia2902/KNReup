/**
 * Window Manager — Manages multi-window architecture for KNReup.
 * Uses Tauri 2.0 WebviewWindow API.
 *
 * Window labels:
 *  - "launcher"          → Home Launcher (main window)
 *  - "editor-{id}"       → NLE Editor instances
 *  - "tool-downloader"   → Downloader popup
 *  - "tool-voice-studio" → Voice Studio popup
 */
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

/** Detect if running inside Tauri */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
}

/** Get current window label */
export function getWindowLabel(): string {
  if (!isTauri()) return 'launcher';
  try {
    return getCurrentWindow().label;
  } catch {
    return 'launcher';
  }
}

/** Determine the view type from current window label + URL params fallback */
export function getWindowType(): 'launcher' | 'editor' | 'tool' {
  const label = getWindowLabel();
  if (label.startsWith('editor')) return 'editor';
  if (label.startsWith('tool')) return 'tool';

  // Fallback: check URL params (for spawned windows where label might not propagate)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');
    if (urlType === 'editor') return 'editor';
    if (urlType === 'tool') return 'tool';
  } catch {
    // ignore
  }

  return 'launcher';
}

/** Open an Editor window for a project */
export async function openEditor(projectId?: string, options?: { module?: string }): Promise<WebviewWindow | null> {
  if (!isTauri()) {
    console.warn('[windowManager] Not in Tauri — cannot open editor window');
    return null;
  }

  const id = projectId || `new-${Date.now()}`;
  const label = `editor-${id}`;

  // Check if already open
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return existing;
  }

  let url = `index.html?type=editor&id=${encodeURIComponent(id)}`;
  if (options?.module) {
    url += `&module=${encodeURIComponent(options.module)}`;
  }

  const editorWindow = new WebviewWindow(label, {
    url,
    title: `KNReup Editor — ${projectId || 'New Project'}`,
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    center: true,
    decorations: true,
  });

  return editorWindow;
}

/** Open a standalone tool window */
export async function openTool(toolId: string): Promise<WebviewWindow | null> {
  if (!isTauri()) {
    console.warn('[windowManager] Not in Tauri — cannot open tool window');
    return null;
  }

  const label = `tool-${toolId}`;

  // Check if already open
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return existing;
  }

  const toolConfigs: Record<string, { title: string; width: number; height: number }> = {
    downloader: { title: 'KNReup Downloader', width: 1000, height: 700 },
    'voice-studio': { title: 'KNReup Voice Studio', width: 1000, height: 750 },
    'smart-crop': { title: 'KNReup Smart Crop', width: 1200, height: 800 },
    'video-gen-lab': { title: 'KNReup Video Gen', width: 1400, height: 850 },
  };

  const config = toolConfigs[toolId] || { title: `KNReup — ${toolId}`, width: 800, height: 600 };

  const toolWindow = new WebviewWindow(label, {
    url: `index.html?type=tool&tool=${encodeURIComponent(toolId)}`,
    title: config.title,
    width: config.width,
    height: config.height,
    center: true,
    decorations: true,
    resizable: true,
  });

  return toolWindow;
}

/** Open the Downloader as a popup */
export async function openDownloader(): Promise<WebviewWindow | null> {
  return openTool('downloader');
}

/** Open Downloader with a specific project pre-selected */
export async function openDownloaderForProject(projectId: string): Promise<WebviewWindow | null> {
  // Import dynamically to avoid circular deps
  const { useLauncherStore } = await import('../stores/useLauncherStore');
  useLauncherStore.getState().setActiveProjectId(projectId);
  return openTool('downloader');
}

/** Focus the launcher window (return to home) */
export async function focusLauncher(): Promise<void> {
  if (!isTauri()) return;

  try {
    // Try getByLabel first
    let launcher = await WebviewWindow.getByLabel('launcher');

    // Fallback: search all windows
    if (!launcher) {
      const { getAllWindows } = await import('@tauri-apps/api/window');
      const allWindows = await getAllWindows();
      launcher = allWindows.find((w) => w.label === 'launcher') as unknown as WebviewWindow ?? null;
    }

    if (launcher) {
      await launcher.show();
      await launcher.setFocus();
      await launcher.unminimize();
    }

    // Close the current editor window after focusing launcher
    const currentType = getWindowType();
    if (currentType === 'editor') {
      const current = getCurrentWindow();
      await current.close();
    }
  } catch (err) {
    console.error('[windowManager] focusLauncher failed:', err);
  }
}

/** Get the project ID from URL search params (used in editor windows) */
export function getProjectIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/** Get the tool ID from URL search params (used in tool windows) */
export function getToolIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('tool');
}

/**
 * Setup window lifecycle event listeners.
 * Call this once from main.tsx after routing is determined.
 * - In editor windows: on close, focus launcher if no other editors remain
 * - In launcher: prevent app exit if editor windows are still open
 */
export async function setupWindowLifecycle(): Promise<void> {
  if (!isTauri()) return;

  const windowType = getWindowType();
  const currentWin = getCurrentWindow();

  if (windowType === 'editor') {
    // When an editor closes, try to focus the launcher
    currentWin.onCloseRequested(async () => {
      try {
        // Focus launcher on close
        await focusLauncher();
      } catch (err) {
        console.warn('[windowManager] Failed to focus launcher on editor close:', err);
      }
    });
  }
}
