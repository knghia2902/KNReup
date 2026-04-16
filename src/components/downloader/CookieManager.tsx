import { useState } from 'react';
import type { CookieStatus } from '../../hooks/useDownloader';

interface CookieManagerProps {
  cookieStatus: CookieStatus | null;
  onSync: (browser: string) => Promise<any>;
  isSyncing: boolean;
}

const BROWSERS = [
  { value: 'edge', label: 'Edge' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
];

export function CookieManager({ cookieStatus, onSync, isSyncing }: CookieManagerProps) {
  const [selectedBrowser, setSelectedBrowser] = useState('edge');

  return (
    <div className="dl-cookie">
      <div className="dl-cookie-status">
        <span 
          className={`dl-cookie-dot ${cookieStatus?.valid ? 'ok' : cookieStatus === null ? 'none' : 'expired'}`} 
        />
        <span className="dl-cookie-label">
          {cookieStatus?.valid ? 'Connected' : cookieStatus === null ? 'Not set' : 'Expired'}
        </span>
      </div>
      <select
        className="dl-cookie-select"
        value={selectedBrowser}
        onChange={(e) => setSelectedBrowser(e.target.value)}
        disabled={isSyncing}
      >
        {BROWSERS.map(b => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>
      <button
        className="dl-cookie-sync-btn"
        onClick={() => onSync(selectedBrowser)}
        disabled={isSyncing}
      >
        {isSyncing ? '⟳' : '🔗'} Sync
      </button>
    </div>
  );
}
