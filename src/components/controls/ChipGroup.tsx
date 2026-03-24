export interface ChipGroupItem {
  value: string;
  label: string;
}

interface ChipGroupProps {
  items: ChipGroupItem[];
  value: string;
  onChange?: (val: string) => void;
}

export function ChipGroup({ items, value, onChange }: ChipGroupProps) {
  return (
    <div className="chiprow">
      {items.map((item) => (
        <button
          key={item.value}
          className={`chip ${item.value === value ? 'active' : ''}`}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
