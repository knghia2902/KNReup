import React from "react";
import ReactDOM from "react-dom/client";
import { getWindowType, getToolIdFromUrl } from "./utils/windowManager";

/**
 * Multi-window entry point.
 * Detects window type from Tauri label and renders the correct view:
 *  - launcher → HomeLauncher
 *  - editor   → Full NLE Editor (App)
 *  - tool     → Standalone tool window
 */
function RootApp() {
  const windowType = getWindowType();
  const [View, setView] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    switch (windowType) {
      case 'editor':
        import('./App').then((m) => setView(() => m.default));
        break;
      case 'tool': {
        const toolId = getToolIdFromUrl();
        if (toolId === 'downloader') {
          import('./components/downloader/DownloaderWindow').then((m) => setView(() => m.DownloaderWindow));
        } else if (toolId === 'voice-clone') {
          import('./components/tools/VoiceCloneWindow').then((m) => setView(() => m.VoiceCloneWindow));
        } else {
          // Fallback — show launcher
          import('./components/setup/HomeLauncher').then((m) => setView(() => m.HomeLauncher));
        }
        break;
      }
      case 'launcher':
      default:
        import('./components/setup/HomeLauncher').then((m) => setView(() => m.HomeLauncher));
        break;
    }
  }, [windowType]);

  if (!View) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111', color: '#888', fontFamily: 'system-ui',
      }}>
        Loading...
      </div>
    );
  }

  return <View />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);

