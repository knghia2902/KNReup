export interface SelectOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange?: (val: string) => void;
  fullWidth?: boolean;
}

export function SelectControl({ label, value, options, onChange, fullWidth }: SelectControlProps) {
  const content = (
    <select 
      className="psel" 
      value={value} 
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  if (fullWidth || !label) {
    return <div className="pc">{content}</div>;
  }

  return (
    <div className="pr">
      <div className="plbl">{label}</div>
      <div className="pc">{content}</div>
    </div>
  );
}
