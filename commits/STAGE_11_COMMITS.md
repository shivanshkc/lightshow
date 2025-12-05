# Stage 11: Properties Panel — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Full transform and material property editors with two-way binding.

---

## Commit 11.1: Create draggable NumberInput component

### Description
Number input that supports click-to-edit and drag-to-adjust.

### Files to Create
```
src/components/ui/NumberInput.tsx
src/__tests__/ui/NumberInput.test.tsx
```

### Key Implementation
```typescript
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  label?: string;
}

export function NumberInput({ value, onChange, min = -Infinity, max = Infinity, step = 0.1, precision = 2, label }: NumberInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(value.toFixed(precision));
  const dragStart = useRef({ x: 0, value: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, value };
  };
  
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = (e.clientX - dragStart.current.x) * 0.1;
      let newVal = dragStart.current.value + delta * step * 10;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(Math.round(newVal / step) * step);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging]);
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-elevated rounded cursor-ew-resize" onMouseDown={handleMouseDown}>
      {label && <span className="text-xs w-3">{label}</span>}
      <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
        onBlur={() => { const v = parseFloat(inputValue); if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v))); }}
        className="w-full bg-transparent text-sm text-right font-mono outline-none cursor-text" />
    </div>
  );
}
```

### Test Cases
```typescript
describe('NumberInput', () => {
  it('displays formatted value', () => {
    render(<NumberInput value={3.14159} onChange={() => {}} precision={2} />);
    expect(screen.getByDisplayValue('3.14')).toBeDefined();
  });
  
  it('calls onChange on blur', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(5);
  });
  
  it('clamps value to min/max', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} min={0} max={10} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);
  });
});
```

### Commit Message
```
feat(ui): create draggable NumberInput component
```

---

## Commit 11.2: Create Slider and ColorPicker components

### Description
Styled slider and color picker for material properties.

### Files to Create
```
src/components/ui/Slider.tsx
src/components/ui/ColorPicker.tsx
src/__tests__/ui/Slider.test.tsx
```

### Key Implementation
```typescript
// Slider.tsx
export function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01 }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const percentage = ((value - min) / (max - min)) * 100;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    updateValue(e.clientX);
    // Add move/up listeners for drag
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between"><span className="text-xs">{label}</span><span className="text-xs font-mono">{value.toFixed(2)}</span></div>
      <div ref={trackRef} className="h-5 cursor-pointer" onMouseDown={handleMouseDown}>
        <div className="relative w-full h-1.5 bg-elevated rounded-full">
          <div className="absolute h-full bg-accent rounded-full" style={{ width: `${percentage}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-accent"
               style={{ left: `calc(${percentage}% - 6px)` }} />
        </div>
      </div>
    </div>
  );
}

// ColorPicker.tsx
export function ColorPicker({ label, value, onChange }: { label: string; value: [number,number,number]; onChange: (v: [number,number,number]) => void }) {
  const toHex = (rgb: [number,number,number]) => '#' + rgb.map(c => Math.round(c*255).toString(16).padStart(2,'0')).join('');
  const fromHex = (hex: string): [number,number,number] => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255] : [1,1,1];
  };
  
  return (
    <div className="space-y-1">
      <label className="text-xs">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={toHex(value)} onChange={e => onChange(fromHex(e.target.value))}
          className="w-8 h-8 rounded border cursor-pointer" />
        <input type="text" value={toHex(value).toUpperCase()} onChange={e => onChange(fromHex(e.target.value))}
          className="flex-1 px-2 py-1 bg-elevated rounded text-sm font-mono uppercase" />
      </div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('Slider', () => {
  it('displays current value', () => {
    render(<Slider label="Test" value={0.5} onChange={() => {}} />);
    expect(screen.getByText('0.50')).toBeDefined();
  });
  
  it('displays label', () => {
    render(<Slider label="Roughness" value={0} onChange={() => {}} />);
    expect(screen.getByText('Roughness')).toBeDefined();
  });
});

describe('ColorPicker', () => {
  it('converts RGB to hex', () => {
    render(<ColorPicker label="Color" value={[1, 0, 0]} onChange={() => {}} />);
    expect(screen.getByDisplayValue('#FF0000')).toBeDefined();
  });
});
```

### Commit Message
```
feat(ui): create Slider and ColorPicker components
```

---

## Commit 11.3: Create TransformSection panel

### Description
Position, rotation, scale inputs for selected object.

### Files to Create
```
src/components/panels/TransformSection.tsx
src/__tests__/panels/TransformSection.test.tsx
```

### Key Implementation
```typescript
export function TransformSection({ object }: { object: SceneObject }) {
  const updateTransform = useSceneStore(s => s.updateTransform);
  
  const setPosition = (pos: Vec3) => updateTransform(object.id, { position: pos });
  const setRotation = (rot: Vec3) => updateTransform(object.id, { rotation: rot.map(d => d * Math.PI/180) as Vec3 });
  const setScale = (scale: Vec3) => {
    if (object.type === 'sphere') updateTransform(object.id, { scale: [scale[0], scale[0], scale[0]] });
    else updateTransform(object.id, { scale });
  };
  
  const rotDeg = object.transform.rotation.map(r => r * 180 / Math.PI) as Vec3;
  
  return (
    <Panel title="Transform">
      <div className="space-y-4">
        <Vec3Input label="Position" value={object.transform.position} onChange={setPosition} />
        <Vec3Input label="Rotation (°)" value={rotDeg} onChange={setRotation} step={1} precision={1} />
        {object.type === 'sphere'
          ? <NumberInput label="Radius" value={object.transform.scale[0]} onChange={v => setScale([v,v,v])} min={0.1} />
          : <Vec3Input label="Scale" value={object.transform.scale} onChange={setScale} min={0.1} />}
      </div>
    </Panel>
  );
}
```

### Test Cases
```typescript
describe('TransformSection', () => {
  it('renders position inputs', () => {
    const obj = { id: '1', type: 'sphere', transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } };
    render(<TransformSection object={obj as SceneObject} />);
    expect(screen.getByText('Position')).toBeDefined();
  });
  
  it('sphere shows radius instead of scale', () => {
    const obj = { id: '1', type: 'sphere', transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } };
    render(<TransformSection object={obj as SceneObject} />);
    expect(screen.getByText('Radius')).toBeDefined();
    expect(screen.queryByText('Scale')).toBeNull();
  });
  
  it('cuboid shows XYZ scale', () => {
    const obj = { id: '1', type: 'cuboid', transform: { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] } };
    render(<TransformSection object={obj as SceneObject} />);
    expect(screen.getByText('Scale')).toBeDefined();
  });
});
```

### Commit Message
```
feat(panels): create TransformSection with position/rotation/scale
```

---

## Commit 11.4: Create MaterialSection panel

### Description
Color, roughness, metallic, transparency, emission controls.

### Files to Create
```
src/components/panels/MaterialSection.tsx
src/__tests__/panels/MaterialSection.test.tsx
```

### Key Implementation
```typescript
export function MaterialSection({ object }: { object: SceneObject }) {
  const updateMaterial = useSceneStore(s => s.updateMaterial);
  const change = (updates: Partial<Material>) => updateMaterial(object.id, updates);
  
  const isEmissive = object.material.emission > 0;
  
  return (
    <Panel title="Material">
      <div className="space-y-4">
        <ColorPicker label="Color" value={object.material.color} onChange={color => change({ color })} />
        <Slider label="Roughness" value={object.material.roughness} onChange={roughness => change({ roughness })} />
        <Slider label="Metallic" value={object.material.metallic} onChange={metallic => change({ metallic })} />
        <Slider label="Transparency" value={object.material.transparency} onChange={transparency => change({ transparency })} />
        
        {object.material.transparency > 0 && (
          <Slider label="IOR" value={object.material.ior} onChange={ior => change({ ior })} min={1} max={2.5} step={0.05} />
        )}
        
        <div className="pt-2 border-t border-border-subtle">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isEmissive} onChange={e => change({ emission: e.target.checked ? 1 : 0 })} />
            <span className="text-sm">Emissive</span>
          </label>
          
          {isEmissive && (
            <div className="mt-3 ml-6 space-y-3">
              <Slider label="Strength" value={object.material.emission} onChange={emission => change({ emission })} min={0.1} max={10} />
              <ColorPicker label="Light Color" value={object.material.emissionColor} onChange={emissionColor => change({ emissionColor })} />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
```

### Test Cases
```typescript
describe('MaterialSection', () => {
  const mockObj = { id: '1', material: createDefaultMaterial() } as SceneObject;
  
  it('renders color picker', () => {
    render(<MaterialSection object={mockObj} />);
    expect(screen.getByText('Color')).toBeDefined();
  });
  
  it('shows IOR when transparency > 0', () => {
    const obj = { ...mockObj, material: { ...mockObj.material, transparency: 0.5 } };
    render(<MaterialSection object={obj as SceneObject} />);
    expect(screen.getByText('IOR')).toBeDefined();
  });
  
  it('hides IOR when transparency = 0', () => {
    render(<MaterialSection object={mockObj} />);
    expect(screen.queryByText('IOR')).toBeNull();
  });
  
  it('shows emission controls when emissive checked', () => {
    const obj = { ...mockObj, material: { ...mockObj.material, emission: 2 } };
    render(<MaterialSection object={obj as SceneObject} />);
    expect(screen.getByText('Strength')).toBeDefined();
    expect(screen.getByText('Light Color')).toBeDefined();
  });
});
```

### Manual Testing
1. Select object → right panel shows properties
2. Change color → object updates in real-time
3. Adjust roughness slider → reflection changes
4. Enable emission → object glows
5. Move with gizmo → input values update

### Commit Message
```
feat(panels): create MaterialSection with all properties

Stage 11 complete: Full properties panel
```

---

## Stage 11 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 11.1 | NumberInput | Drag-to-adjust |
| 11.2 | Slider, ColorPicker | UI controls |
| 11.3 | TransformSection | Position/rotation/scale |
| 11.4 | MaterialSection | All material props |

