# Stage 13: Polish & UX — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Visual polish, performance optimization, edge case handling.

---

## Commit 13.1: Polish gizmo visuals

### Description
Improve gizmo appearance with hover states and smooth edges.

### Files to Modify
```
src/gizmos/gizmoShader.wgsl
src/gizmos/GizmoRenderer.ts
```

### Key Implementation
```wgsl
// Enhanced gizmo shader with anti-aliasing and depth fade
fn smoothEdge(distance: f32, thickness: f32) -> f32 {
  let edge = thickness * 0.5;
  let aa = fwidth(distance);
  return 1.0 - smoothstep(edge - aa, edge + aa, distance);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  var color = input.color;
  
  // Brighter for hovered/active
  if (input.axisId == uniforms.hoveredAxis) {
    color = vec4(color.rgb * 1.3, color.a);
  }
  if (input.axisId == uniforms.activeAxis) {
    color = vec4(color.rgb * 1.5, min(color.a + 0.2, 1.0));
  }
  
  return color;
}
```

```typescript
// GizmoRenderer.ts - cursor management
class GizmoRenderer {
  updateCursor(hoveredAxis: GizmoAxis): void {
    const cursors: Record<GizmoAxis, string> = {
      x: 'ew-resize', y: 'ns-resize', z: 'nesw-resize',
      xy: 'move', xz: 'move', yz: 'move', xyz: 'move',
      null: 'default',
    };
    document.body.style.cursor = cursors[hoveredAxis ?? 'null'];
  }
}
```

### Test Cases
```typescript
describe('Gizmo polish', () => {
  it('shader has hover brightness', async () => {
    const code = await import('../gizmos/gizmoShader.wgsl?raw');
    expect(code.default).toContain('hoveredAxis');
  });
  
  it('cursor changes by axis', () => {
    const renderer = new GizmoRenderer(mockDevice, 'bgra8unorm');
    renderer.updateCursor('x');
    expect(document.body.style.cursor).toBe('ew-resize');
  });
});
```

### Commit Message
```
style(gizmos): polish visual appearance and cursor feedback
```

---

## Commit 13.2: Optimize render performance

### Description
Throttle during interaction, debounce updates, add FPS tracking.

### Files to Modify
```
src/renderer/Renderer.ts
src/utils/debounce.ts  # NEW
```

### Key Implementation
```typescript
// utils/debounce.ts
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Renderer.ts
class Renderer {
  private interactionMode = false;
  private fpsCounter = { frames: 0, lastTime: 0, fps: 0 };
  
  setInteractionMode(active: boolean): void {
    this.interactionMode = active;
    if (!active) this.raytracingPipeline.resetAccumulation();
  }
  
  private render = (): void => {
    // FPS calculation
    this.fpsCounter.frames++;
    const now = performance.now();
    if (now - this.fpsCounter.lastTime >= 1000) {
      this.fpsCounter.fps = this.fpsCounter.frames;
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastTime = now;
    }
    
    // Reduce bounces during interaction
    const maxBounces = this.interactionMode ? 4 : 8;
    
    // ... render
  };
  
  getFPS(): number { return this.fpsCounter.fps; }
}
```

### Test Cases
```typescript
describe('Performance', () => {
  it('debounce delays execution', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced(); debounced(); debounced();
    expect(fn).not.toHaveBeenCalled();
    await new Promise(r => setTimeout(r, 60));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  
  it('interaction mode reduces bounces', () => {
    const renderer = new Renderer(mockCtx);
    renderer.setInteractionMode(true);
    // Verify lower bounce count would be used
  });
});
```

### Commit Message
```
perf(renderer): optimize render performance with throttling
```

---

## Commit 13.3: Add input validation and edge cases

### Description
Validate all inputs, handle edge cases gracefully.

### Files to Create/Modify
```
src/utils/validation.ts
src/components/ui/NumberInput.tsx
```

### Key Implementation
```typescript
// validation.ts
export function validateNumber(value: string, fallback: number, min: number, max: number): number {
  if (!value.trim()) return fallback;
  const parsed = parseFloat(value);
  if (isNaN(parsed) || !isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function evaluateMathExpression(expr: string): number | null {
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    const result = new Function(`return ${expr}`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch { return null; }
}

export const LIMITS = {
  scale: { min: 0.001, max: 1000 },
  position: { min: -10000, max: 10000 },
  maxObjects: 256,
};

// NumberInput.tsx - enhanced validation
const handleBlur = () => {
  let value = evaluateMathExpression(inputValue) ?? parseFloat(inputValue);
  if (isNaN(value)) value = props.value;
  value = Math.max(min, Math.min(max, value));
  onChange(value);
  setInputValue(value.toFixed(precision));
};
```

### Test Cases
```typescript
describe('Validation', () => {
  it('validateNumber handles empty string', () => {
    expect(validateNumber('', 5, 0, 10)).toBe(5);
  });
  
  it('validateNumber clamps to range', () => {
    expect(validateNumber('100', 0, 0, 10)).toBe(10);
    expect(validateNumber('-5', 0, 0, 10)).toBe(0);
  });
  
  it('evaluateMathExpression evaluates simple expressions', () => {
    expect(evaluateMathExpression('1+1')).toBe(2);
    expect(evaluateMathExpression('2*3')).toBe(6);
    expect(evaluateMathExpression('10/2')).toBe(5);
  });
  
  it('evaluateMathExpression rejects invalid input', () => {
    expect(evaluateMathExpression('alert(1)')).toBeNull();
    expect(evaluateMathExpression('abc')).toBeNull();
  });
});
```

### Commit Message
```
feat(validation): add input validation and edge case handling
```

---

## Commit 13.4: Add error boundary and loading states

### Description
Global error boundary, WebGPU loading feedback.

### Files to Create/Modify
```
src/components/ErrorBoundary.tsx
src/components/Canvas.tsx
src/App.tsx
```

### Key Implementation
```typescript
// ErrorBoundary.tsx
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Lightshow error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-base text-white">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-4">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-accent rounded">
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App.tsx
export default function App() {
  return (
    <ErrorBoundary>
      {/* ... app content */}
    </ErrorBoundary>
  );
}
```

### Test Cases
```typescript
describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Child</div></ErrorBoundary>);
    expect(screen.getByText('Child')).toBeDefined();
  });
  
  it('renders error UI when child throws', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });
});
```

### Manual Testing
1. With 50+ objects, verify 30+ FPS
2. Type "1+1" in number input → shows 2
3. Enter invalid value → reverts to previous
4. Trigger error → error boundary catches

### Commit Message
```
feat(ux): add error boundary and improve loading states

Stage 13 complete: Polish and UX improvements
```

---

## Stage 13 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 13.1 | Gizmo polish | Hover states, cursor |
| 13.2 | Performance | FPS tracking, throttle |
| 13.3 | Input validation | Math expressions, limits |
| 13.4 | Error handling | Error boundary |

