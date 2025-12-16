import { useRef } from 'react';

interface ColorPickerProps {
  label: string;
  value: [number, number, number]; // RGB 0-1
  onChange: (value: [number, number, number]) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert RGB 0-1 to hex
  const toHex = (rgb: [number, number, number]): string => {
    const r = Math.round(rgb[0] * 255)
      .toString(16)
      .padStart(2, '0');
    const g = Math.round(rgb[1] * 255)
      .toString(16)
      .padStart(2, '0');
    const b = Math.round(rgb[2] * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  // Convert hex to RGB 0-1
  const fromHex = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  };

  const hexValue = toHex(value);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = fromHex(e.target.value);
    if (parsed) onChange(parsed);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = fromHex(e.target.value);
    if (parsed) onChange(parsed);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>

      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          className="w-8 h-8 rounded border border-border-default shadow-inner cursor-pointer"
          style={{ backgroundColor: hexValue }}
          onClick={() => inputRef.current?.click()}
        />

        {/* Hex input */}
        <input
          type="text"
          value={hexValue.toUpperCase()}
          onChange={handleTextChange}
          className="
            flex-1 px-2 py-1 bg-elevated rounded border border-border-default
            text-xs font-mono text-text-primary uppercase
            focus:border-accent focus:outline-none
          "
        />

        {/* Hidden native color picker */}
        <input
          ref={inputRef}
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          className="sr-only"
        />
      </div>
    </div>
  );
}

