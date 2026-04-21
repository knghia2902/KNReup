import { MusicNote, TextT, Sticker, MagicWand, Shuffle, FunnelSimple } from '@phosphor-icons/react';
import type { AssetCategory } from './CategoryBar';

const PLACEHOLDER_INFO: Record<string, { icon: any; title: string; description: string }> = {
  audio: {
    icon: MusicNote,
    title: 'Sound effects & Music',
    description: 'Browse and add audio tracks, sound effects, or music to your project.',
  },
  text: {
    icon: TextT,
    title: 'Text presets',
    description: 'Choose from ready-made text templates and subtitle styles.',
  },
  stickers: {
    icon: Sticker,
    title: 'Stickers & GIFs',
    description: 'Add animated stickers and GIF overlays to your video.',
  },
  effects: {
    icon: MagicWand,
    title: 'Video effects',
    description: 'Apply visual effects like glitch, blur, or glow to your clips.',
  },
  transitions: {
    icon: Shuffle,
    title: 'Transitions',
    description: 'Smooth transitions between clips — fade, slide, zoom, and more.',
  },
  filters: {
    icon: FunnelSimple,
    title: 'Color filters',
    description: 'Apply cinematic color grading and filter presets.',
  },

};

interface AssetPlaceholderProps {
  category: AssetCategory;
}

export function AssetPlaceholder({ category }: AssetPlaceholderProps) {
  const info = PLACEHOLDER_INFO[category];
  if (!info) return null;

  const Icon = info.icon;

  return (
    <div className="asset-placeholder">
      <div className="asset-placeholder-icon">
        <Icon size={32} weight="duotone" />
      </div>
      <div className="asset-placeholder-title">{info.title}</div>
      <div className="asset-placeholder-desc">{info.description}</div>
      <div className="asset-placeholder-badge">Coming soon</div>
    </div>
  );
}
