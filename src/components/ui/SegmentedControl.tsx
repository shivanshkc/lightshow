import { useId } from 'react';

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  ariaLabel?: string;
};

export interface SegmentedControlProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const groupId = useId();

  const sizeCls =
    size === 'sm'
      ? 'h-8 text-xs'
      : 'h-9 text-sm';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <div className="text-xs text-text-secondary">{label}</div>
      ) : null}

      <div
        role="group"
        aria-label={label || 'segmented-control'}
        className={`
          inline-flex items-stretch overflow-hidden
          rounded-lg border border-border-default bg-panel-secondary
          ${sizeCls}
        `}
      >
        {options.map((opt, idx) => {
          const selected = opt.value === value;
          const isFirst = idx === 0;
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.ariaLabel ?? opt.label}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={`
                px-3 font-semibold
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:z-10
                ${isFirst ? '' : 'border-l border-border-default'}
                ${selected ? 'bg-active text-text-primary' : 'text-text-secondary hover:bg-hover'}
              `}
              data-segmented-id={groupId}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


