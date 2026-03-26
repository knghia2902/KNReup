/**
 * FontPicker — Modal dialog for selecting Vietnamese-friendly fonts
 */
import { useState, useEffect, useRef } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import { X, MagnifyingGlass } from '@phosphor-icons/react';

interface FontPickerProps {
  currentFont: string;
  onSelect: (fontName: string) => void;
  onClose: () => void;
}

const FONT_LIST = [
  'Be Vietnam Pro',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Nunito',
  'Quicksand',
  'Josefin Sans',
];

const PREVIEW_TEXT = 'Xin chào Việt Nam — Ẩặẫậ';

export function FontPicker({ currentFont, onSelect, onClose }: FontPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedFont, setSelectedFont] = useState(currentFont);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = FONT_LIST.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  // Load fonts from Google Fonts
  useEffect(() => {
    FONT_LIST.forEach((fontName) => {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const observer = new FontFaceObserver(fontName);
      observer.load('Ẩặẫậ', 5000).then(() => {
        setLoadedFonts((prev) => new Set(prev).add(fontName));
      }).catch(() => {});
    });
  }, []);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleConfirm = () => {
    const observer = new FontFaceObserver(selectedFont);
    observer.load('Ẩặẫậ', 3000).then(() => {
      onSelect(selectedFont);
    }).catch(() => {
      onSelect(selectedFont); // fallback anyway
    });
  };

  return (
    <div className="font-picker-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="font-picker-panel">
        <div className="fp-header">
          <span className="fp-title">Chọn Font</span>
          <button className="fp-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="fp-search">
          <MagnifyingGlass size={12} className="fp-search-icon" />
          <input
            className="fp-search-input"
            placeholder="Tìm font..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Font List */}
        <div className="fp-list">
          {filtered.map((fontName) => (
            <button
              key={fontName}
              className={`fp-item ${selectedFont === fontName ? 'active' : ''}`}
              onClick={() => setSelectedFont(fontName)}
              style={{ fontFamily: loadedFonts.has(fontName) ? `"${fontName}", sans-serif` : 'inherit' }}
            >
              {fontName}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div
          className="fp-preview"
          style={{ fontFamily: loadedFonts.has(selectedFont) ? `"${selectedFont}", sans-serif` : 'inherit' }}
        >
          {PREVIEW_TEXT}
        </div>

        {/* Confirm */}
        <button className="btn btn-primary fp-confirm" onClick={handleConfirm}>
          Chọn "{selectedFont}"
        </button>
      </div>
    </div>
  );
}
