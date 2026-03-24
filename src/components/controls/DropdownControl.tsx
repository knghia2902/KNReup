import { CaretDown } from '@phosphor-icons/react';
import './controls.css';

interface DropdownControlProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function DropdownControl({
  label, value, options, onChange,
}: DropdownControlProps) {
  return (
    <div className="control-row">
      <span className="control-label">{label}</span>
      <div className="dropdown-control">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <CaretDown size={12} className="dropdown-caret" />
      </div>
    </div>
  );
}
