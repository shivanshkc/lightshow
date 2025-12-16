interface SelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: SelectProps<T>) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="
          w-full px-3 py-2 bg-elevated rounded border border-border-default
          text-sm text-text-primary
          focus:border-accent focus:outline-none
          cursor-pointer
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

