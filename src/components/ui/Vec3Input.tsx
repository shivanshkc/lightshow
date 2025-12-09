import { NumberInput } from './NumberInput';

interface Vec3InputProps {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export function Vec3Input({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  precision = 2,
}: Vec3InputProps) {
  const handleChange = (index: number, newValue: number) => {
    const updated: [number, number, number] = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        <NumberInput
          label="X"
          value={value[0]}
          onChange={(v) => handleChange(0, v)}
          min={min}
          max={max}
          step={step}
          precision={precision}
        />
        <NumberInput
          label="Y"
          value={value[1]}
          onChange={(v) => handleChange(1, v)}
          min={min}
          max={max}
          step={step}
          precision={precision}
        />
        <NumberInput
          label="Z"
          value={value[2]}
          onChange={(v) => handleChange(2, v)}
          min={min}
          max={max}
          step={step}
          precision={precision}
        />
      </div>
    </div>
  );
}

