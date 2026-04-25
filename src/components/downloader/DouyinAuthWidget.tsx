import { useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { CheckCircle, Globe } from '@phosphor-icons/react';
import type { CookieStatus } from '../../hooks/useDownloader';

interface DouyinAuthWidgetProps {
  cookieStatus: CookieStatus | null;
  onSet: (cookieString: string) => Promise<any>;
}

export function DouyinAuthWidget({ 
  cookieStatus, 
  onSet
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
          // Poll native Rust command to get cookies from memory
          const cookies = await invoke<string>('get_webview_cookies', { 
            window: webview.label 
          });
          
          if (cookies && cookies.includes('sessionid=')) {
            console.log('Session ID found via native capture');
            onSet(cookies);
            if (pollInterval) clearInterval(pollInterval);
            try {
              webview.close();
            } catch (e) {
              // Ignore window not found
            }
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

  const handleLogout = () => {
    onSet('');
  };

  return (
    <div className="dl-auth-widget">
      {cookieStatus?.valid ? (
        <div className="dl-auth-info">
          <button 
            className="dl-logout-btn" 
            onClick={handleLogout}
            title="Click to logout"
          >
            <CheckCircle weight="fill" />
            Logout
          </button>
        </div>
      ) : (
        <button 
          className="dl-auth-btn"
          onClick={handleLogin}
          disabled={isOpeningWebView}
        >
          <Globe size={18} />
          {isOpeningWebView ? 'Login Open' : 'Login Douyin'}
        </button>
      )}
    </div>
  );
}
