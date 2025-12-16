import { useState, useRef, useCallback, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  label?: string;
  dragSensitivity?: number;
}

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.1,
  precision = 2,
  label,
  dragSensitivity = 0.1,
}: NumberInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(value.toFixed(precision));
  const [isFocused, setIsFocused] = useState(false);
  const dragStartRef = useRef({ x: 0, value: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toFixed(precision));
    }
  }, [value, precision, isFocused]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === inputRef.current) return;

      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, value };
      document.body.style.cursor = 'ew-resize';
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = (e.clientX - dragStartRef.current.x) * dragSensitivity;
      let newValue = dragStartRef.current.value + delta * step * 10;
      newValue = Math.max(min, Math.min(max, newValue));
      newValue = Math.round(newValue / step) * step;
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange, min, max, step, dragSensitivity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      const stepped = Math.round(clamped / step) * step;
      onChange(stepped);
      setInputValue(stepped.toFixed(precision));
    } else {
      setInputValue(value.toFixed(precision));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toFixed(precision));
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  };

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1 bg-elevated rounded border
        ${isDragging ? 'border-accent' : 'border-border-default'}
        cursor-ew-resize select-none
      `}
      onMouseDown={handleMouseDown}
    >
      {label && (
        <span className="text-xs font-medium text-text-secondary w-3">
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className="
          w-full bg-transparent text-xs text-right font-mono
          text-text-primary outline-none cursor-text
        "
      />
    </div>
  );
}

