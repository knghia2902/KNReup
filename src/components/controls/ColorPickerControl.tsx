interface ColorPickerControlProps {
  label: string;
  color: string;
  onChange?: (color: string) => void;
}

export function ColorPickerControl({ label, color, onChange }: ColorPickerControlProps) {
  return (
    <div className="pr">
      <div className="plbl">{label}</div>
      <div className="pc">
        <input 
          type="color" 
          className="cinp" 
          value={color}
          onChange={(e) => onChange?.(e.target.value)}
        />
        <span className="chex">{color.toUpperCase()}</span>
      </div>
    </div>
  );
}
