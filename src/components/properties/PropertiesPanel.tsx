import { useState, useEffect } from 'react';
import { StyleTab } from './StyleTab';
import { TTSTab } from './TTSTab';
import { SubTab } from './SubTab';
import { OutTab } from './OutTab';
import { QueueTab } from './QueueTab';
import type { SidebarFocus } from '../layout/NLELayout';

export type PropertiesTabID = 'style' | 'tts' | 'sub' | 'out' | 'queue';

interface PropertiesPanelProps {
  sidebarFocus?: SidebarFocus;
  onRender?: () => void;
  onAnalyze?: () => void;
  processing?: boolean;
}

const FOCUS_TAB_MAP: Record<SidebarFocus, PropertiesTabID> = {
  preview: 'style',
  subtitle: 'sub',
  pipeline: 'tts',
  'monitor-mini': 'queue',
  'settings-mini': 'style',
};

const TABS: { id: PropertiesTabID; label: string }[] = [
  { id: 'style', label: 'STYLE' },
  { id: 'tts', label: 'TTS' },
  { id: 'sub', label: 'SUB' },
  { id: 'out', label: 'OUT' },
  { id: 'queue', label: 'QUEUE' },
];

export function PropertiesPanel({ sidebarFocus, onRender, onAnalyze, processing }: PropertiesPanelProps) {
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
          <SubTab onAnalyze={onAnalyze} processing={processing} />
        </div>
      </div>
      
      <div className={`tc ${tab === 'out' ? 'vis' : ''}`}>
        <div className="pbody">
          <OutTab onRender={onRender} processing={processing} />
        </div>
      </div>
      
      <div className={`tc ${tab === 'queue' ? 'vis' : ''}`}>
        <div className="pbody">
          <QueueTab />
        </div>
      </div>
    </div>
  );
}
