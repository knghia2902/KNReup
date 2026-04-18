import { useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { CheckCircle, Warning, Globe } from '@phosphor-icons/react';
import type { CookieStatus } from '../../hooks/useDownloader';

interface DouyinAuthWidgetProps {
  cookieStatus: CookieStatus | null;
  onSet: (cookieString: string) => Promise<any>;
  onSync: (browser?: string) => Promise<any>;
  isSyncing: boolean;
}

export function DouyinAuthWidget({ 
  cookieStatus, 
  onSet,
  onSync,
  isSyncing 
}: DouyinAuthWidgetProps) {
  const [isOpeningWebView, setIsOpeningWebView] = useState(false);

  const handleLogin = async () => {
    setIsOpeningWebView(true);
    try {
      // Create a webview window for Douyin login
      const webview = new WebviewWindow('douyin-login', {
        url: 'https://www.douyin.com/',
        title: 'Login Douyin - Hãy đăng nhập để tiếp tục',
        width: 1000,
        height: 800,
        resizable: true,
      });

      let pollInterval: any;

      const unlistenCaptured = await listen<string>('douyin-cookie-captured', (event) => {
        console.log('Cookie captured via event from Rust');
        if (event.payload && event.payload.includes('sessionid=')) {
          onSet(event.payload);
          if (pollInterval) clearInterval(pollInterval);
          webview.close();
        }
      });

      // Set up polling for sessionid cookie
      const { invoke } = await import('@tauri-apps/api/core');
      pollInterval = setInterval(async () => {
        try {
          // 1. Try backend sync first (most reliable decryption from disk)
          console.log('Polling backend for cookie sync...');
          const result = await onSync('auto');
          if (result && result.success) {
            console.log('Session synced via backend polling');
            if (pollInterval) clearInterval(pollInterval);
            webview.close();
            return;
          }

          // 2. Fallback: Try custom native Rust command to get cookies from memory
          const cookies = await invoke<string>('get_webview_cookies', { 
            window: webview.label 
          });
          
          if (cookies && cookies.includes('sessionid=')) {
            console.log('Session ID found via native capture');
            onSet(cookies);
            if (pollInterval) clearInterval(pollInterval);
            webview.close();
          }
        } catch (e) {
          // Silently fail if window is closing
        }
      }, 2000);

      webview.once('tauri://created', () => {
        console.log('Douyin login window created');
      });

      webview.once('tauri://error', (e) => {
        console.error('Failed to create login window:', e);
        setIsOpeningWebView(false);
        unlistenCaptured();
        if (pollInterval) clearInterval(pollInterval);
      });

      // Wait for window to close
      const unlistenClose = await webview.onCloseRequested(() => {
        setIsOpeningWebView(false);
        unlistenClose();
        unlistenCaptured();
        if (pollInterval) clearInterval(pollInterval);
      });

    } catch (err) {
      console.error('WebView error:', err);
      setIsOpeningWebView(false);
    }
  };

  const statusLabel = cookieStatus?.valid ? 'Session Active' : cookieStatus === null ? 'No Session' : 'Session Expired';
  const statusIcon = cookieStatus?.valid ? <CheckCircle weight="fill" /> : <Warning weight="fill" />;

  return (
    <div className="dl-auth-widget">
      <div className="dl-auth-info">
        <div className={`dl-status-dot ${cookieStatus?.valid ? 'active' : ''}`} />
        <span className="dl-status-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {statusIcon}
          {statusLabel}
        </span>
      </div>

      {!cookieStatus?.valid && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="dl-auth-btn"
            onClick={handleLogin}
            disabled={isSyncing || isOpeningWebView}
          >
            <Globe size={18} />
            {isOpeningWebView ? 'Login Open' : 'Login Douyin'}
          </button>
        </div>
      )}
      
      {cookieStatus?.message && !cookieStatus.valid && (
        <span className="dl-error-message" style={{ paddingLeft: 0 }}>
          {cookieStatus.message}
        </span>
      )}
    </div>
  );
}
