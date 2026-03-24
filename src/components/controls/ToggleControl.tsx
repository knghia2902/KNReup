interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  return (
    <div className="pr">
      <div className="plbl">{label}</div>
      <div className="pc">
        <div 
          className={`tog ${checked ? 'on' : ''}`}
          onClick={() => onChange?.(!checked)}
        >
          <div className="togthumb"></div>
        </div>
        <span className="toglbl">{checked ? 'Enabled' : 'Disabled'}</span>
      </div>
    </div>
  );
}
