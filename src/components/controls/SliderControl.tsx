interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange?: (val: number) => void;
}

export function SliderControl({ label, value, min, max, step = 1, unit = '', onChange }: SliderControlProps) {
  return (
    <div className="pr">
      <div className="plbl">{label}</div>
      <div className="pc">
        <input
          type="range"
          className="pslider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
        <span className="pval">
          {value}{unit}
        </span>
      </div>
    </div>
  );
}
