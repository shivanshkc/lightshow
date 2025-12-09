import { useCallback, useRef, useState, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  displayValue = true,
  formatValue = (v) => v.toFixed(2),
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      let newValue = min + percent * (max - min);
      newValue = Math.round(newValue / step) * step;
      onChange(newValue);
    },
    [min, max, step, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updateValue(e.clientX);
    },
    [updateValue]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValue]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs text-text-secondary">{label}</label>
        {displayValue && (
          <span className="text-xs font-mono text-text-primary">
            {formatValue(value)}
          </span>
        )}
      </div>

      <div
        ref={trackRef}
        className="h-5 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div className="relative w-full h-1.5 bg-elevated rounded-full">
          {/* Filled track */}
          <div
            className="absolute h-full bg-accent rounded-full"
            style={{ width: `${percentage}%` }}
          />

          {/* Thumb */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full
              bg-white shadow-md border-2 border-accent
              transition-transform
              ${isDragging ? 'scale-110' : ''}
            `}
            style={{ left: `calc(${percentage}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
}

