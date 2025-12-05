# Stage 11: Properties Panel

## Objective
Implement the full properties panel with transform inputs (position, rotation, scale) and material controls (color picker, sliders). All inputs should have two-way binding with the scene state.

---

## Prerequisites
- Stage 10 completed (all gizmos working)
- Right panel structure from Stage 7

---

## Panel Structure

```
┌─────────────────────────────┐
│ Transform                   │
├─────────────────────────────┤
│ Position                    │
│ X [  0.00  ] ●──────────────│
│ Y [  1.00  ] ●──────────────│
│ Z [  0.00  ] ●──────────────│
│                             │
│ Rotation (°)                │
│ X [  0.00  ] ●──────────────│
│ Y [ 45.00  ] ●──────────────│
│ Z [  0.00  ] ●──────────────│
│                             │
│ Scale                       │
│ X [  1.00  ] ●──────────────│
│ Y [  1.00  ] ●──────────────│
│ Z [  1.00  ] ●──────────────│
│ [🔗 Uniform]                │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Material                    │
├─────────────────────────────┤
│ Color      [████████] #FFF  │
│                             │
│ Roughness                   │
│ ●════════════════════ 0.50  │
│                             │
│ Metallic                    │
│ ═●═══════════════════ 0.00  │
│                             │
│ Transparency                │
│ ═●═══════════════════ 0.00  │
│                             │
│ ☐ Emissive                  │
│   Strength ══════●═══ 1.00  │
│   Color    [████████] #FFF  │
└─────────────────────────────┘
```

---

## Project Structure

```
src/
├── components/
│   └── panels/
│       ├── TransformSection.tsx    # UPDATE: full implementation
│       ├── MaterialSection.tsx     # UPDATE: full implementation
│       └── ActionSection.tsx       # NEW: delete, duplicate buttons
│   └── ui/
│       ├── NumberInput.tsx         # UPDATE: draggable input
│       ├── Slider.tsx              # UPDATE: styled slider
│       ├── ColorPicker.tsx         # UPDATE: full color picker
│       ├── Checkbox.tsx            # NEW
│       └── Vec3Input.tsx           # NEW: grouped XYZ inputs
```

---

## UI Components Implementation

### 11.1 NumberInput with Drag

A number input that can be adjusted by dragging.

```tsx
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
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === inputRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, value };
    document.body.style.cursor = 'ew-resize';
  }, [value]);
  
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
      onChange(clamped);
      setInputValue(clamped.toFixed(precision));
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
    }
  };
  
  return (
    <div 
      className={`
        flex items-center gap-2 px-2 py-1 bg-elevated rounded border
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
          w-full bg-transparent text-sm text-right font-mono
          text-text-primary outline-none cursor-text
        "
      />
    </div>
  );
}
```

### 11.2 Vec3Input (XYZ grouped input)

```tsx
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
```

### 11.3 Slider Component

```tsx
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
  
  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newValue = min + percent * (max - min);
    newValue = Math.round(newValue / step) * step;
    onChange(newValue);
  }, [min, max, step, onChange]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
  }, [updateValue]);
  
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
```

### 11.4 Color Picker

```tsx
import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: [number, number, number];  // RGB 0-1
  onChange: (value: [number, number, number]) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Convert RGB 0-1 to hex
  const toHex = (rgb: [number, number, number]): string => {
    const r = Math.round(rgb[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(rgb[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(rgb[2] * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };
  
  // Convert hex to RGB 0-1
  const fromHex = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  };
  
  const hexValue = toHex(value);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fromHex(e.target.value));
  };
  
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>
      
      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          className="w-8 h-8 rounded border border-border-default shadow-inner"
          style={{ backgroundColor: hexValue }}
          onClick={() => inputRef.current?.click()}
        />
        
        {/* Hex input */}
        <input
          type="text"
          value={hexValue.toUpperCase()}
          onChange={(e) => {
            const parsed = fromHex(e.target.value);
            if (parsed) onChange(parsed);
          }}
          className="
            flex-1 px-2 py-1 bg-elevated rounded border border-border-default
            text-sm font-mono text-text-primary uppercase
            focus:border-accent focus:outline-none
          "
        />
        
        {/* Hidden native color picker */}
        <input
          ref={inputRef}
          type="color"
          value={hexValue}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
    </div>
  );
}
```

### 11.5 TransformSection

```tsx
import { useCallback } from 'react';
import { SceneObject } from '../../core/types';
import { useSceneStore } from '../../store/sceneStore';
import { Panel } from '../ui/Panel';
import { Vec3Input } from '../ui/Vec3Input';

interface TransformSectionProps {
  object: SceneObject;
}

export function TransformSection({ object }: TransformSectionProps) {
  const updateTransform = useSceneStore(state => state.updateTransform);
  
  const handlePositionChange = useCallback((position: [number, number, number]) => {
    updateTransform(object.id, { position });
  }, [object.id, updateTransform]);
  
  const handleRotationChange = useCallback((rotation: [number, number, number]) => {
    // Convert degrees to radians for storage
    updateTransform(object.id, {
      rotation: rotation.map(d => d * Math.PI / 180) as [number, number, number],
    });
  }, [object.id, updateTransform]);
  
  const handleScaleChange = useCallback((scale: [number, number, number]) => {
    // For spheres, enforce uniform scale
    if (object.type === 'sphere') {
      const uniform = scale[0];
      updateTransform(object.id, { scale: [uniform, uniform, uniform] });
    } else {
      updateTransform(object.id, { scale });
    }
  }, [object.id, object.type, updateTransform]);
  
  // Convert radians to degrees for display
  const rotationDegrees: [number, number, number] = [
    object.transform.rotation[0] * 180 / Math.PI,
    object.transform.rotation[1] * 180 / Math.PI,
    object.transform.rotation[2] * 180 / Math.PI,
  ];
  
  return (
    <Panel title="Transform">
      <div className="space-y-4">
        <Vec3Input
          label="Position"
          value={object.transform.position}
          onChange={handlePositionChange}
          step={0.1}
        />
        
        <Vec3Input
          label="Rotation (°)"
          value={rotationDegrees}
          onChange={handleRotationChange}
          step={1}
          precision={1}
        />
        
        {object.type === 'sphere' ? (
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Radius</label>
            <NumberInput
              value={object.transform.scale[0]}
              onChange={(v) => handleScaleChange([v, v, v])}
              min={0.1}
              step={0.1}
            />
          </div>
        ) : (
          <Vec3Input
            label="Scale"
            value={object.transform.scale}
            onChange={handleScaleChange}
            min={0.1}
            step={0.1}
          />
        )}
      </div>
    </Panel>
  );
}
```

### 11.6 MaterialSection

```tsx
import { useCallback } from 'react';
import { SceneObject } from '../../core/types';
import { useSceneStore } from '../../store/sceneStore';
import { Panel } from '../ui/Panel';
import { ColorPicker } from '../ui/ColorPicker';
import { Slider } from '../ui/Slider';
import { Checkbox } from '../ui/Checkbox';

interface MaterialSectionProps {
  object: SceneObject;
}

export function MaterialSection({ object }: MaterialSectionProps) {
  const updateMaterial = useSceneStore(state => state.updateMaterial);
  
  const handleChange = useCallback((updates: Partial<typeof object.material>) => {
    updateMaterial(object.id, updates);
  }, [object.id, updateMaterial]);
  
  const isEmissive = object.material.emission > 0;
  
  return (
    <Panel title="Material">
      <div className="space-y-4">
        <ColorPicker
          label="Color"
          value={object.material.color}
          onChange={(color) => handleChange({ color })}
        />
        
        <Slider
          label="Roughness"
          value={object.material.roughness}
          onChange={(roughness) => handleChange({ roughness })}
          min={0}
          max={1}
        />
        
        <Slider
          label="Metallic"
          value={object.material.metallic}
          onChange={(metallic) => handleChange({ metallic })}
          min={0}
          max={1}
        />
        
        <Slider
          label="Transparency"
          value={object.material.transparency}
          onChange={(transparency) => handleChange({ transparency })}
          min={0}
          max={1}
        />
        
        {object.material.transparency > 0 && (
          <Slider
            label="IOR"
            value={object.material.ior}
            onChange={(ior) => handleChange({ ior })}
            min={1.0}
            max={2.5}
            step={0.05}
          />
        )}
        
        <div className="pt-2 border-t border-border-subtle">
          <Checkbox
            label="Emissive"
            checked={isEmissive}
            onChange={(checked) => handleChange({ emission: checked ? 1 : 0 })}
          />
          
          {isEmissive && (
            <div className="mt-3 ml-6 space-y-3">
              <Slider
                label="Strength"
                value={object.material.emission}
                onChange={(emission) => handleChange({ emission })}
                min={0.1}
                max={10}
                step={0.1}
              />
              
              <ColorPicker
                label="Light Color"
                value={object.material.emissionColor}
                onChange={(emissionColor) => handleChange({ emissionColor })}
              />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
```

---

## Testing Requirements

### Transform Panel Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T11.1 | Position input | Type new X value, press Enter | Object moves, gizmo moves |
| T11.2 | Position drag | Drag on X input | Object moves in real-time |
| T11.3 | Rotation input | Type 45 in Y rotation | Object rotates 45 degrees |
| T11.4 | Scale input | Change scale values | Object resizes |
| T11.5 | Sphere radius | Select sphere, change radius | Sphere resizes uniformly |
| T11.6 | Two-way binding | Move with gizmo | Input values update |

### Material Panel Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T11.7 | Color picker | Click swatch, pick color | Object color changes |
| T11.8 | Roughness slider | Drag slider | Reflection sharpness changes |
| T11.9 | Transparency slider | Increase transparency | Object becomes see-through |
| T11.10 | IOR appears | Set transparency > 0 | IOR slider appears |
| T11.11 | Enable emission | Check "Emissive" | Emission controls appear |
| T11.12 | Emission strength | Increase strength | Object glows brighter |
| T11.13 | Emission color | Change emission color | Light color changes |

### Input Behavior Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T11.14 | Invalid input | Reverts to last valid value |
| T11.15 | Enter to confirm | Applies value |
| T11.16 | Escape to cancel | Reverts and blurs |
| T11.17 | Click outside | Applies value |
| T11.18 | Drag precision | Ctrl = fine, Shift = coarse |

---

## Acceptance Criteria

- [ ] All transform inputs work (position, rotation, scale)
- [ ] Two-way binding: gizmo ↔ inputs sync
- [ ] Sphere shows radius instead of XYZ scale
- [ ] Color picker works with visual swatch
- [ ] All sliders work and update render
- [ ] Emission toggle shows/hides sub-controls
- [ ] Transparency shows IOR when > 0
- [ ] Drag-to-adjust works on number inputs
- [ ] Inputs validate and handle edge cases

---

## Definition of Done

Stage 11 is complete when:
1. Full transform panel is functional
2. Full material panel is functional
3. Two-way binding works between gizmos and inputs
4. All inputs have proper validation
5. Visual feedback during interaction

