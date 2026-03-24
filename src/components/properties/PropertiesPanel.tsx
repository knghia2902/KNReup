import { useState, useEffect } from 'react';
import { StyleTab } from './StyleTab';
import { TTSTab } from './TTSTab';
import { SubTab } from './SubTab';
import { OutTab } from './OutTab';
import type { SidebarFocus } from '../layout/NLELayout';

export type PropertiesTabID = 'style' | 'tts' | 'sub' | 'out';

interface PropertiesPanelProps {
  sidebarFocus?: SidebarFocus;
}

const FOCUS_TAB_MAP: Record<SidebarFocus, PropertiesTabID> = {
  preview: 'style',
  subtitle: 'sub',
  pipeline: 'tts',
  'monitor-mini': 'style',
  'settings-mini': 'style',
};

const TABS: { id: PropertiesTabID; label: string }[] = [
  { id: 'style', label: 'STYLE' },
  { id: 'tts', label: 'TTS' },
  { id: 'sub', label: 'SUB' },
  { id: 'out', label: 'OUT' },
];

export function PropertiesPanel({ sidebarFocus }: PropertiesPanelProps) {
  const [tab, setTab] = useState<PropertiesTabID>('style');

  useEffect(() => {
    if (sidebarFocus && FOCUS_TAB_MAP[sidebarFocus]) {
      setTab(FOCUS_TAB_MAP[sidebarFocus]);
    }
  }, [sidebarFocus]);

  return (
    <div className="pp">
      <div className="ptabs">
        {TABS.map(({ id, label }) => (
          <div
            key={id}
            className={`pt ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </div>
        ))}
      </div>
      
      <div className={`tc ${tab === 'style' ? 'vis' : ''}`}>
        <div className="pbody">
          <StyleTab />
        </div>
      </div>
      
      <div className={`tc ${tab === 'tts' ? 'vis' : ''}`}>
        <div className="pbody">
          <TTSTab />
        </div>
      </div>
      
      <div className={`tc ${tab === 'sub' ? 'vis' : ''}`}>
        <div className="pbody">
          <SubTab />
        </div>
      </div>
      
      <div className={`tc ${tab === 'out' ? 'vis' : ''}`}>
        <div className="pbody">
          <OutTab />
        </div>
      </div>
    </div>
  );
}
