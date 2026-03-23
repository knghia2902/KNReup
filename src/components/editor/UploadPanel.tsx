/**
 * UploadPanel — drag & drop video upload (taste-skill compliant).
 * No emojis. Phosphor Icons only.
 */
import { useState, useCallback, useRef, type DragEvent } from 'react';
import { Upload, VideoCamera } from '@phosphor-icons/react';
import './UploadPanel.css';

interface UploadPanelProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadPanel({ onFileSelected, disabled }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [disabled, onFileSelected],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`upload-panel ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        <div className="upload-file-info">
          <VideoCamera size={28} weight="duotone" className="upload-icon-selected" />
          <span className="upload-filename">{selectedFile.name}</span>
          <span className="upload-filesize font-mono">{formatSize(selectedFile.size)}</span>
        </div>
      ) : (
        <div className="upload-dropzone">
          <Upload size={24} weight="thin" className="upload-icon" />
          <span className="upload-hint">Drop video here</span>
        </div>
      )}
    </div>
  );
}
