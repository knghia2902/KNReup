import { useState } from 'react';
import { VideoTab } from './VideoTab';
import { AudioTab } from './AudioTab';
import { TextTab } from './TextTab';
import { AdjustTab } from './AdjustTab';
import { OutTab } from './OutTab';
import { QueueTab } from './QueueTab';
import { FilmStrip, SpeakerHigh, TextT, Faders, Export, ListBullets } from '@phosphor-icons/react';

export type PropertiesTabID = 'video' | 'audio' | 'text' | 'adjust' | 'out' | 'queue';

interface PropertiesPanelProps {
  onRender?: () => void;
  onAnalyze?: () => void;
  processing?: boolean;
}



const TABS: { id: PropertiesTabID; label: string; icon: any }[] = [
  { id: 'video', label: 'Video', icon: FilmStrip },
  { id: 'audio', label: 'Audio', icon: SpeakerHigh },
  { id: 'text', label: 'Text', icon: TextT },
  { id: 'adjust', label: 'Adjust', icon: Faders },
  { id: 'out', label: 'Out', icon: Export },
  { id: 'queue', label: 'Queue', icon: ListBullets },
];

export function PropertiesPanel({ onRender, onAnalyze, processing }: PropertiesPanelProps) {
  const [tab, setTab] = useState<PropertiesTabID>('video');


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
      
      <div className="pscroll">
        <div className={`tc ${tab === 'video' ? 'vis' : ''}`}>
          <div className="pbody">
            <VideoTab />
          </div>
        </div>
        
        <div className={`tc ${tab === 'audio' ? 'vis' : ''}`}>
          <div className="pbody">
            <AudioTab />
          </div>
        </div>

        <div className={`tc ${tab === 'text' ? 'vis' : ''}`}>
          <div className="pbody">
            <TextTab onAnalyze={onAnalyze} processing={processing} />
          </div>
        </div>

        <div className={`tc ${tab === 'adjust' ? 'vis' : ''}`}>
          <div className="pbody">
            <AdjustTab />
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
    </div>
  );
}
