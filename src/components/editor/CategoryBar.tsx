import {
  MonitorPlay, MusicNote, TextT, Sticker,
  MagicWand, Shuffle, FunnelSimple
} from '@phosphor-icons/react';

export type AssetCategory = 'media' | 'audio' | 'text' | 'stickers' | 'effects' | 'transitions' | 'filters';

interface CategoryBarProps {
  active: AssetCategory;
  onChange: (cat: AssetCategory) => void;
}

const CATEGORIES: { id: AssetCategory; label: string; icon: any }[] = [
  { id: 'media',       label: 'Media',       icon: MonitorPlay },
  { id: 'audio',       label: 'Audio',       icon: MusicNote },
  { id: 'text',        label: 'Text',        icon: TextT },
  { id: 'stickers',    label: 'Stickers',    icon: Sticker },
  { id: 'effects',     label: 'Effects',     icon: MagicWand },
  { id: 'transitions', label: 'Transitions', icon: Shuffle },
  { id: 'filters',     label: 'Filters',     icon: FunnelSimple },
];

export function CategoryBar({ active, onChange }: CategoryBarProps) {
  return (
    <div className="catbar">
      {CATEGORIES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`catbar-item ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          title={label}
        >
          <Icon size={18} weight={active === id ? 'fill' : 'regular'} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
