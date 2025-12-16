# Stage 13: Polish & UX

## Objective
Refine all interactions, add visual polish, improve performance, and handle edge cases. This stage transforms the functional app into a professional-feeling product.

---

## Prerequisites
- Stage 12 completed (all features functional)
- All core features working

---

## Polish Areas

### 1. Gizmo Visual Polish
### 2. Performance Optimization
### 3. Input Validation & Edge Cases
### 4. Loading States & Feedback
### 5. Keyboard Shortcut Hints
### 6. Tooltips
### 7. Cursor Feedback
### 8. Error Handling

---

## Implementation

### 13.1 Gizmo Visual Polish

**Enhanced gizmo appearance:**

```typescript
// Gizmo style constants
const GIZMO_STYLE = {
  // Base appearance
  axisOpacity: 0.85,
  axisOpacityHover: 1.0,
  axisOpacityActive: 1.0,
  
  // Thickness
  lineThickness: 2.5,
  lineThicknessHover: 3.5,
  lineThicknessActive: 4.0,
  
  // Colors with slight luminosity boost on hover
  colors: {
    x: { base: '#E53935', hover: '#EF5350', active: '#FF7043' },
    y: { base: '#43A047', hover: '#66BB6A', active: '#81C784' },
    z: { base: '#1E88E5', hover: '#42A5F5', active: '#64B5F6' },
  },
  
  // Depth fade (gizmo parts behind others)
  depthFadeAmount: 0.3,
  
  // Anti-aliasing
  antiAliasEdges: true,
};
```

**Gizmo shader enhancements:**

```wgsl
// Add smooth edges via alpha gradient
fn smoothEdge(distance: f32, thickness: f32) -> f32 {
  let edge = thickness * 0.5;
  let aa = fwidth(distance);
  return 1.0 - smoothstep(edge - aa, edge + aa, distance);
}

// Depth-based fading for parts behind other parts
fn depthFade(clipZ: f32, maxZ: f32) -> f32 {
  let fade = 1.0 - saturate((clipZ - 0.5) / (maxZ - 0.5)) * 0.3;
  return fade;
}
```

**Visual feedback states:**

```css
/* Cursor changes */
.gizmo-hover-x { cursor: ew-resize; }
.gizmo-hover-y { cursor: ns-resize; }
.gizmo-hover-z { cursor: nesw-resize; }
.gizmo-hover-plane { cursor: move; }
.gizmo-active { cursor: grabbing !important; }
```

### 13.2 Performance Optimization

**Render throttling during interaction:**

```typescript
class Renderer {
  private interactionMode = false;
  private lastRenderTime = 0;
  private readonly INTERACTION_FPS = 30;
  private readonly STATIC_FPS = 60;
  
  setInteractionMode(active: boolean): void {
    this.interactionMode = active;
    if (!active) {
      // Reset accumulation when interaction ends
      this.resetAccumulation();
    }
  }
  
  private render(): void {
    const now = performance.now();
    const targetFPS = this.interactionMode ? this.INTERACTION_FPS : this.STATIC_FPS;
    const targetDelta = 1000 / targetFPS;
    
    if (now - this.lastRenderTime < targetDelta) {
      requestAnimationFrame(() => this.render());
      return;
    }
    
    this.lastRenderTime = now;
    
    // Reduce sample count during interaction
    const samplesPerFrame = this.interactionMode ? 1 : 1;
    const maxBounces = this.interactionMode ? 4 : 8;
    
    // ... render with adjusted settings
  }
}
```

**Debounced scene updates:**

```typescript
import { debounce } from '../utils/debounce';

// Debounce heavy updates
const debouncedSceneUpload = debounce((objects: SceneObject[]) => {
  sceneBuffer.upload(objects);
}, 16); // ~60fps max update rate
```

**Memoization for expensive computations:**

```typescript
// Memoize matrix calculations
const viewProjectionCache = new Map<string, Float32Array>();

function getViewProjection(cameraState: CameraState): Float32Array {
  const key = JSON.stringify(cameraState);
  
  if (!viewProjectionCache.has(key)) {
    const vp = mat4Multiply(
      mat4Perspective(cameraState.fovY, cameraState.aspect, 0.1, 1000),
      mat4LookAt(cameraState.position, cameraState.target, cameraState.up)
    );
    viewProjectionCache.set(key, vp);
    
    // Limit cache size
    if (viewProjectionCache.size > 10) {
      const firstKey = viewProjectionCache.keys().next().value;
      viewProjectionCache.delete(firstKey);
    }
  }
  
  return viewProjectionCache.get(key)!;
}
```

### 13.3 Input Validation & Edge Cases

**Number input validation:**

```typescript
const validateNumber = (
  value: string,
  min: number,
  max: number,
  fallback: number
): number => {
  // Handle empty
  if (!value.trim()) return fallback;
  
  // Try parsing
  const parsed = parseFloat(value);
  
  // Handle NaN
  if (isNaN(parsed)) return fallback;
  
  // Handle Infinity
  if (!isFinite(parsed)) return fallback;
  
  // Clamp to range
  return Math.max(min, Math.min(max, parsed));
};

// Support math expressions
const evaluateMathExpression = (expr: string): number | null => {
  try {
    // Only allow safe characters
    if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
    
    // Use Function instead of eval for slight safety improvement
    const result = new Function(`return ${expr}`)();
    
    if (typeof result !== 'number' || !isFinite(result)) return null;
    
    return result;
  } catch {
    return null;
  }
};
```

**Scale constraints:**

```typescript
const SCALE_CONSTRAINTS = {
  min: 0.001,
  max: 1000,
  
  validate(scale: [number, number, number]): [number, number, number] {
    return scale.map(s => 
      Math.max(this.min, Math.min(this.max, s))
    ) as [number, number, number];
  }
};
```

**Object limits:**

```typescript
const SCENE_LIMITS = {
  maxObjects: 256,
  
  canAddObject(currentCount: number): boolean {
    return currentCount < this.maxObjects;
  },
  
  getWarningMessage(currentCount: number): string | null {
    if (currentCount >= this.maxObjects) {
      return `Maximum object limit reached (${this.maxObjects})`;
    }
    if (currentCount >= this.maxObjects * 0.9) {
      return `Approaching object limit (${currentCount}/${this.maxObjects})`;
    }
    return null;
  }
};
```

### 13.4 Loading States & Feedback

**WebGPU initialization loading:**

```tsx
function Canvas() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    initWebGPU(canvas)
      .then(() => setStatus('ready'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message);
      });
  }, []);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full bg-base">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Initializing renderer...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-base">
        <div className="text-center max-w-md p-6">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">WebGPU Not Available</h2>
          <p className="text-text-secondary mb-4">{errorMessage}</p>
          <a 
            href="https://caniuse.com/webgpu" 
            target="_blank"
            className="text-accent hover:underline"
          >
            Check browser compatibility →
          </a>
        </div>
      </div>
    );
  }
  
  return <canvas ref={canvasRef} />;
}
```

**Sample count indicator:**

```tsx
function StatusBar() {
  const [samples, setSamples] = useState(0);
  const [fps, setFps] = useState(0);
  
  // Update from renderer
  useEffect(() => {
    const interval = setInterval(() => {
      const renderer = getRenderer();
      if (renderer) {
        setSamples(renderer.getSampleCount());
        setFps(renderer.getFPS());
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <footer className="...">
      <span>Samples: {samples}</span>
      <span className={fps < 20 ? 'text-yellow-400' : ''}>
        FPS: {fps.toFixed(0)}
      </span>
    </footer>
  );
}
```

### 13.5 Tooltips

```tsx
import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ 
  content, 
  shortcut, 
  children, 
  position = 'top' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`
            absolute z-50 px-2 py-1 text-xs rounded shadow-lg
            bg-gray-900 text-white whitespace-nowrap
            animate-fade-in
            ${positionClasses[position]}
          `}
        >
          {content}
          {shortcut && (
            <kbd className="ml-2 px-1 bg-gray-700 rounded">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
```

### 13.6 Cursor Feedback

```typescript
// Cursor manager for consistent cursor states
class CursorManager {
  private stack: string[] = [];
  
  push(cursor: string): void {
    this.stack.push(cursor);
    document.body.style.cursor = cursor;
  }
  
  pop(): void {
    this.stack.pop();
    document.body.style.cursor = this.stack[this.stack.length - 1] || 'default';
  }
  
  set(cursor: string): void {
    this.stack = [cursor];
    document.body.style.cursor = cursor;
  }
  
  reset(): void {
    this.stack = [];
    document.body.style.cursor = 'default';
  }
}

export const cursorManager = new CursorManager();
```

### 13.7 Error Boundary

```tsx
import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Lightshow error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-base text-white">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent rounded hover:bg-accent-hover"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## Testing Requirements

### Visual Polish Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T13.1 | Gizmo hover state | Axis brightens smoothly on hover |
| T13.2 | Gizmo active state | Clear visual during drag |
| T13.3 | Cursor changes | Appropriate cursor for each action |
| T13.4 | Smooth animations | No jank in UI transitions |

### Performance Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T13.5 | 50+ objects | Maintains 30+ FPS |
| T13.6 | Rapid input | No lag when typing quickly |
| T13.7 | Continuous drag | Smooth movement, no stutter |
| T13.8 | Window resize | Quick adaptation, no artifacts |

### Edge Case Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T13.9 | Invalid number input | Graceful handling, no crash |
| T13.10 | Extreme values | Clamped to valid range |
| T13.11 | Rapid undo/redo | No race conditions |
| T13.12 | Max objects | Warning shown, add disabled |

### Error Handling Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T13.13 | WebGPU unavailable | Friendly error message |
| T13.14 | GPU lost | Recovery or clear message |
| T13.15 | Component error | Error boundary catches |

---

## Acceptance Criteria

- [ ] Gizmos have polished visual feedback
- [ ] Performance is acceptable (30+ FPS) with many objects
- [ ] All inputs validate properly
- [ ] Loading states shown during init
- [ ] Tooltips on important buttons
- [ ] Cursor feedback on all interactions
- [ ] Error boundary catches crashes
- [ ] No console errors during normal use

---

## Definition of Done

Stage 13 is complete when:
1. All interactions feel polished
2. Performance is optimized
3. Edge cases are handled gracefully
4. Error states are user-friendly
5. Visual feedback is consistent

