interface NumberControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (val: number) => void;
}

export function NumberControl({ label, value, min, max, step, onChange }: NumberControlProps) {
  return (
    <div className="pr">
      <div className="plbl">{label}</div>
      <div className="pc">
        <input 
          type="number" 
          className="pnum" 
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
